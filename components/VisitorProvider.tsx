"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_MAX_TRYON, DEFAULT_WHATSAPP_NUMBER } from "@/lib/constants";
import VisitorRegisterModal from "./VisitorRegisterModal";

export interface Visitor {
  fullName: string;
  phoneNumber: string;
  cityArea: string;
  consent: boolean;
  tryonCount: number;
}

export interface RegisterInput {
  fullName: string;
  phoneNumber: string;
  cityArea: string;
  consent: boolean;
}

export interface QuotaResult {
  allowed: boolean;
  reason?: "NOT_REGISTERED" | "CONSENT_REQUIRED" | "QUOTA_EXCEEDED" | "UNKNOWN_SKU" | "ERROR";
  used?: number;
  max?: number;
  reused?: boolean;
}

interface VisitorContextValue {
  ready: boolean;
  visitor: Visitor | null;
  maxTryons: number;
  whatsappNumber: string;
  demoMode: boolean;
  register: (input: RegisterInput) => Promise<void>;
  requestRegistration: (onRegistered?: () => void) => void;
  consumeTryon: (skuId: string) => Promise<QuotaResult>;
  forgetVisitor: () => Promise<void>;
}

const VISITOR_KEY = "ms_visitor";
const DEMO_LOG_KEY = "ms_demo_tryons";
const REUSE_WINDOW_MS = 2 * 60 * 60 * 1000;

// supabase-js is loaded on demand so it stays out of the initial page bundle.
function loadSupabase() {
  return import("@/lib/supabase/client").then((m) => m.getBrowserSupabase()!);
}

const VisitorContext = createContext<VisitorContextValue | null>(null);

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

const ERROR_MESSAGES: Record<string, string> = {
  CONSENT_REQUIRED: "Please authorise photo processing to use the Try-On Studio.",
  INVALID_NAME: "Please enter your full name.",
  INVALID_PHONE: "Please enter a valid mobile number.",
  INVALID_CITY_AREA: "Please select your area.",
  PHONE_IN_USE: "This number belongs to a staff account. Please use a different number.",
};

function friendlyError(message: string) {
  const key = Object.keys(ERROR_MESSAGES).find((k) => message.includes(k));
  return key ? ERROR_MESSAGES[key] : message;
}

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const demoMode = !isSupabaseConfigured();
  const [ready, setReady] = useState(false);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [maxTryons, setMaxTryons] = useState(DEFAULT_MAX_TRYON);
  const [whatsappNumber, setWhatsappNumber] = useState(DEFAULT_WHATSAPP_NUMBER);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const persist = useCallback((v: Visitor | null) => {
    setVisitor(v);
    if (v) sessionStorage.setItem(VISITOR_KEY, JSON.stringify(v));
    else sessionStorage.removeItem(VISITOR_KEY);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (demoMode) {
        const cached = sessionStorage.getItem(VISITOR_KEY);
        if (cached) setVisitor(JSON.parse(cached));
        setReady(true);
        return;
      }
      const supabase = await loadSupabase();
      if (cancelled) return;
      // getSession reads the local session without an auth-server round trip; RPCs
      // and RLS still verify the token server-side.
      const [{ data: settings }, { data: sessionData }] = await Promise.all([
        supabase.from("system_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.auth.getSession(),
      ]);
      const auth = { user: sessionData.session?.user ?? null };
      if (cancelled) return;
      if (settings) {
        setMaxTryons(settings.max_tryon_per_user);
        if (settings.whatsapp_business_number) setWhatsappNumber(settings.whatsapp_business_number);
      }
      if (auth.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .maybeSingle();
        if (!cancelled) {
          persist(
            profile
              ? {
                  fullName: profile.full_name,
                  phoneNumber: profile.phone_number,
                  cityArea: profile.city_area,
                  consent: profile.photo_authorization_consent,
                  tryonCount: profile.tryon_count,
                }
              : null,
          );
        }
      } else {
        persist(null);
      }
      if (!cancelled) setReady(true);
    })().catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [demoMode, persist]);

  const register = useCallback(
    async (input: RegisterInput) => {
      if (!input.consent) throw new Error(ERROR_MESSAGES.CONSENT_REQUIRED);
      const phoneNumber = normalizePhone(input.phoneNumber);
      if (phoneNumber.length < 10 || phoneNumber.length > 13) {
        throw new Error(ERROR_MESSAGES.INVALID_PHONE);
      }

      if (demoMode) {
        const logs = readDemoLogs(phoneNumber);
        persist({ ...input, phoneNumber, tryonCount: logs.length });
        return;
      }
      const supabase = await loadSupabase();

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw new Error(`Could not start a secure session: ${error.message}`);
      }
      const { data, error } = await supabase.rpc("register_visitor", {
        p_full_name: input.fullName,
        p_phone_number: phoneNumber,
        p_city_area: input.cityArea,
        p_consent: input.consent,
      });
      if (error) throw new Error(friendlyError(error.message));
      persist({
        fullName: data.full_name,
        phoneNumber: data.phone_number,
        cityArea: data.city_area,
        consent: data.photo_authorization_consent,
        tryonCount: data.tryon_count,
      });
    },
    [demoMode, persist],
  );

  const consumeTryon = useCallback(
    async (skuId: string): Promise<QuotaResult> => {
      if (!visitor) return { allowed: false, reason: "NOT_REGISTERED" };
      if (!visitor.consent) return { allowed: false, reason: "CONSENT_REQUIRED" };

      if (demoMode) {
        const logs = readDemoLogs(visitor.phoneNumber);
        const now = Date.now();
        if (logs.some((l) => l.sku === skuId && now - l.ts < REUSE_WINDOW_MS)) {
          return { allowed: true, used: logs.length, max: maxTryons, reused: true };
        }
        if (logs.length >= maxTryons) {
          return { allowed: false, reason: "QUOTA_EXCEEDED", used: logs.length, max: maxTryons };
        }
        logs.push({ sku: skuId, ts: now });
        writeDemoLogs(visitor.phoneNumber, logs);
        persist({ ...visitor, tryonCount: logs.length });
        return { allowed: true, used: logs.length, max: maxTryons };
      }

      const supabase = await loadSupabase();
      const { data, error } = await supabase.rpc("consume_tryon", { p_sku_id: skuId });
      if (error) return { allowed: false, reason: "ERROR" };
      const result = data as QuotaResult;
      if (typeof result.used === "number") persist({ ...visitor, tryonCount: result.used });
      if (typeof result.max === "number") setMaxTryons(result.max);
      return result;
    },
    [demoMode, visitor, maxTryons, persist],
  );

  const requestRegistration = useCallback((onRegistered?: () => void) => {
    setPendingCallback(() => onRegistered ?? null);
    setModalOpen(true);
  }, []);

  const forgetVisitor = useCallback(async () => {
    if (!demoMode) await (await loadSupabase()).auth.signOut();
    persist(null);
  }, [demoMode, persist]);

  const value = useMemo(
    () => ({
      ready,
      visitor,
      maxTryons,
      whatsappNumber,
      demoMode,
      register,
      requestRegistration,
      consumeTryon,
      forgetVisitor,
    }),
    [ready, visitor, maxTryons, whatsappNumber, demoMode, register, requestRegistration, consumeTryon, forgetVisitor],
  );

  return (
    <VisitorContext.Provider value={value}>
      {children}
      <VisitorRegisterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={register}
        onRegistered={() => {
          setModalOpen(false);
          pendingCallback?.();
          setPendingCallback(null);
        }}
      />
    </VisitorContext.Provider>
  );
}

export function useVisitor() {
  const ctx = useContext(VisitorContext);
  if (!ctx) throw new Error("useVisitor must be used inside <VisitorProvider>");
  return ctx;
}

type DemoLog = { sku: string; ts: number };

function readDemoLogs(phone: string): DemoLog[] {
  try {
    const all = JSON.parse(localStorage.getItem(DEMO_LOG_KEY) ?? "{}");
    return Array.isArray(all[phone]) ? all[phone] : [];
  } catch {
    return [];
  }
}

function writeDemoLogs(phone: string, logs: DemoLog[]) {
  const all = JSON.parse(localStorage.getItem(DEMO_LOG_KEY) ?? "{}");
  all[phone] = logs;
  localStorage.setItem(DEMO_LOG_KEY, JSON.stringify(all));
}
