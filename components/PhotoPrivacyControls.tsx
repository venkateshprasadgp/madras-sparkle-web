"use client";

import { Download, ShieldCheck, Trash2 } from "lucide-react";

interface Props {
  disabled?: boolean;
  onDownload: () => void;
  onDelete: () => void;
}

export default function PhotoPrivacyControls({ disabled, onDownload, onDelete }: Props) {
  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-gold" onClick={onDownload} disabled={disabled}>
          <Download className="h-4 w-4" /> Download Composite Photo
        </button>
        <button
          type="button"
          className="btn-outline border-red-400/60 text-red-300 hover:bg-red-500/10"
          onClick={onDelete}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" /> Delete My Uploaded Photo
        </button>
      </div>
      <p className="flex items-start gap-2 text-xs text-neutral-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        Your photo stays in this browser tab only. It is never stored on our servers, and deleting
        it wipes it from memory and session storage immediately.
      </p>
    </div>
  );
}
