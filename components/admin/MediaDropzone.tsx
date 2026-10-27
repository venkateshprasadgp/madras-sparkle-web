"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Upload, X } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export const MEDIA_BUCKET = "media";
const ALL_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4"];

interface Props {
  name?: string;
  label: string;
  folder: string;
  accept?: string[];
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  hint?: string;
}

export async function uploadToMedia(file: File, folder: string) {
  const supabase = getBrowserSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function MediaDropzone({
  name,
  label,
  folder,
  accept = ALL_TYPES,
  value,
  onChange,
  required,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!accept.includes(file.type)) {
      setError(`Unsupported file type. Allowed: ${accept.map((t) => t.split("/")[1].toUpperCase()).join(", ")}`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadToMedia(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const isVideo = /\.mp4($|\?)/i.test(value);

  return (
    <div>
      <span className="label">
        {label} {required && <span className="text-gold">*</span>}
      </span>
      {name && <input type="hidden" name={name} value={value} />}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition ${
          dragging ? "border-gold bg-gold/10" : "border-white/10 hover:border-gold/50"
        } ${value ? "bg-[repeating-conic-gradient(#222_0_25%,#1a1a1a_0_50%)] bg-[length:16px_16px]" : ""}`}
      >
        {uploading ? (
          <LoaderCircle className="h-6 w-6 animate-spin text-gold" />
        ) : value ? (
          isVideo ? (
            <video src={value} className="max-h-40 rounded" muted controls />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-40 object-contain" />
          )
        ) : (
          <>
            <Upload className="h-6 w-6 text-gold" />
            <p className="text-sm text-neutral-300">Drag &amp; drop or click to upload</p>
            <p className="text-xs text-neutral-500">
              {hint ?? accept.map((t) => t.split("/")[1].toUpperCase()).join(", ")}
            </p>
          </>
        )}
        {value && !uploading && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-neutral-300 hover:text-red-300"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept.join(",")}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
