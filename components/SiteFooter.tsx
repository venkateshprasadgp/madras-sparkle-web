"use client";

import { usePathname } from "next/navigation";
import { CITY_AREAS } from "@/lib/constants";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-white/5 bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-heading text-lg tracking-widest text-gold-gradient">MADRAS SPARKLE</p>
          <p className="mt-2 text-sm text-neutral-400">
            Bespoke fine gold, natural diamond and lab-grown diamond jewellery, brought to your home.
          </p>
        </div>
        <div>
          <p className="label">Home appointments across</p>
          <p className="text-sm text-neutral-300">{CITY_AREAS.join(" · ")}</p>
        </div>
        <div className="text-sm text-neutral-500 md:text-right">
          <p>BIS 916 Hallmarked Gold · Certified Diamonds</p>
          <p className="mt-2">© {new Date().getFullYear()} Madras Sparkle, Chennai</p>
        </div>
      </div>
    </footer>
  );
}
