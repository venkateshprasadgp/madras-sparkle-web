"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Check, LoaderCircle } from "lucide-react";
import type { SystemSettings } from "@/lib/types";
import { updateSettings, type SettingsState } from "@/app/admin/(cms)/settings/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-gold" disabled={pending}>
      {pending && <LoaderCircle className="h-4 w-4 animate-spin" />} Save Settings
    </button>
  );
}

export default function SettingsForm({ settings }: { settings: SystemSettings }) {
  const [state, action] = useFormState<SettingsState, FormData>(updateSettings, {});
  return (
    <form action={action} className="card max-w-xl space-y-6 p-6">
      <div>
        <label className="label" htmlFor="max_tryon_per_user">Maximum virtual try-ons per phone number</label>
        <input
          id="max_tryon_per_user"
          name="max_tryon_per_user"
          type="number"
          min={0}
          max={1000}
          defaultValue={settings.max_tryon_per_user}
          className="input max-w-[160px] text-lg"
          required
        />
        <p className="mt-1 text-xs text-neutral-500">
          Applies immediately to every registered visitor. Re-trying the same piece within 2 hours is not counted again.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="whatsapp_business_number">WhatsApp business number</label>
        <input
          id="whatsapp_business_number"
          name="whatsapp_business_number"
          defaultValue={settings.whatsapp_business_number}
          className="input max-w-xs font-mono"
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state.ok && (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <Check className="h-4 w-4" /> Settings saved.
        </p>
      )}
      <Submit />
    </form>
  );
}
