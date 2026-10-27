"use client";

import { useFormState, useFormStatus } from "react-dom";
import { LoaderCircle, Upload } from "lucide-react";
import { restoreBackup, type RestoreState } from "@/app/admin/(cms)/audit/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      className="btn-outline"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm("Restore will overwrite products, banners and settings with the same IDs. Continue?")) {
          e.preventDefault();
        }
      }}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Restore
    </button>
  );
}

export default function RestoreForm() {
  const [state, action] = useFormState<RestoreState, FormData>(restoreBackup, {});
  return (
    <form action={action} className="space-y-3">
      <input type="file" name="backup" accept="application/json,.json" className="block text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-gold" />
      <Submit />
      {state.error && <p className="text-sm text-red-300">{state.error}</p>}
      {state.message && <p className="text-sm text-emerald-300">{state.message}</p>}
    </form>
  );
}
