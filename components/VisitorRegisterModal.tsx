"use client";

import { useState } from "react";
import { LoaderCircle, MapPin, Phone, User, X } from "lucide-react";
import { CITY_AREAS } from "@/lib/constants";
import type { RegisterInput } from "./VisitorProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: RegisterInput) => Promise<void>;
  onRegistered: () => void;
}

export const CONSENT_TEXT =
  "I authorize Madras Sparkle to process my uploaded photograph solely for the Virtual Try-On Studio session.";

export default function VisitorRegisterModal({ open, onClose, onSubmit, onRegistered }: Props) {
  const [form, setForm] = useState<RegisterInput>({
    fullName: "",
    phoneNumber: "",
    cityArea: "",
    consent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const valid =
    form.fullName.trim().length >= 2 &&
    form.phoneNumber.replace(/\D/g, "").length >= 10 &&
    form.cityArea !== "" &&
    form.consent;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-title"
    >
      <form onSubmit={handleSubmit} className="card relative w-full max-w-md space-y-5 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-500 hover:text-gold"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div>
          <h2 id="register-title" className="font-heading text-2xl text-gold-gradient">
            Visitor Registration
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            Register once to unlock the Virtual Try-On Studio and private home appointments.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="reg-name">Full Name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              id="reg-name"
              className="input pl-9"
              placeholder="e.g. Lakshmi Narayanan"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-phone">Mobile Phone Number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              id="reg-phone"
              className="input pl-9"
              type="tel"
              inputMode="tel"
              placeholder="98765 43210"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              required
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="reg-city">City / Area</label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <select
              id="reg-city"
              className="input pl-9"
              value={form.cityArea}
              onChange={(e) => setForm({ ...form, cityArea: e.target.value })}
              required
            >
              <option value="" disabled>Select your area</option>
              {CITY_AREAS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gold/20 bg-gold/5 p-3 text-sm text-neutral-300">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#D4AF37]"
            checked={form.consent}
            onChange={(e) => setForm({ ...form, consent: e.target.checked })}
            required
          />
          <span>
            {CONSENT_TEXT} <span className="text-gold">*</span>
          </span>
        </label>

        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <button type="submit" className="btn-gold w-full" disabled={!valid || submitting}>
          {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
          Register &amp; Continue
        </button>
      </form>
    </div>
  );
}
