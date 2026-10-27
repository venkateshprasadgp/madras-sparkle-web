"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import MediaDropzone from "./MediaDropzone";

export default function MediaUploader() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  return (
    <div className="card p-6">
      <MediaDropzone
        label="Upload to Media Library"
        folder="library"
        value={url}
        onChange={(u) => {
          setUrl(u);
          if (u) router.refresh();
        }}
      />
      {url && (
        <p className="mt-2 break-all font-mono text-xs text-neutral-400">
          Public URL: <span className="text-gold">{url}</span>
        </p>
      )}
    </div>
  );
}
