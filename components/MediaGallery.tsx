"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

export interface GalleryItem {
  type: "image" | "video";
  src: string;
  poster?: string;
  caption: string;
}

export default function MediaGallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<GalleryItem | null>(null);
  if (items.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item, i) => (
          <button
            key={`${item.src}-${i}`}
            onClick={() => setActive(item)}
            className={`group relative overflow-hidden rounded-xl bg-card ${i === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            {item.type === "video" ? (
              <video src={item.src} poster={item.poster} muted loop playsInline className="aspect-square h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.src} alt={item.caption} className="aspect-square h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            )}
            {item.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-black/60 p-3 text-gold"><Play className="h-6 w-6" /></span>
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left text-xs text-neutral-200 opacity-0 transition group-hover:opacity-100">
              {item.caption}
            </span>
          </button>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActive(null)}>
          <button className="absolute right-6 top-6 text-neutral-300 hover:text-gold" aria-label="Close">
            <X className="h-7 w-7" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-4xl">
            {active.type === "video" ? (
              <video src={active.src} controls autoPlay className="max-h-[80vh] rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.src} alt={active.caption} className="max-h-[80vh] rounded-xl" />
            )}
            <p className="mt-3 text-center text-sm text-neutral-300">{active.caption}</p>
          </div>
        </div>
      )}
    </>
  );
}
