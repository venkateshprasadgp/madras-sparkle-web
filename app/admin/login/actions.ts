"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { STAFF_ROLES } from "@/lib/constants";

export type LoginState = { error?: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = createServerSupabase();
  if (!supabase) return { error: "Supabase is not configured. Set the environment variables first." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Invalid email or password." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    await supabase.auth.signOut();
    return { error: "This account does not have CMS access." };
  }

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signOut() {
  const supabase = createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}
