"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, CITY_AREAS } from "@/lib/constants";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-8 border-t border-neutral-800 bg-cream">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="font-heading text-lg tracking-[0.2em] text-maroon">MADRAS SPARKLE</p>
          <p className="mt-3 text-sm text-neutral-300">
            Bespoke fine gold, natural diamond and lab-grown diamond jewellery, brought to your home.
          </p>
        </div>
        <div>
          <p className="label">Collections</p>
          <ul className="space-y-1.5 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/collections/${c.slug}`} className="text-neutral-200 hover:text-maroon">{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Experiences</p>
          <ul className="space-y-1.5 text-sm">
            <li><Link href="/try-on" className="text-neutral-200 hover:text-maroon">Virtual Try-On Studio</Link></li>
            <li><Link href="/collections" className="text-neutral-200 hover:text-maroon">All Jewellery</Link></li>
            <li><Link href="/admin/login" className="text-neutral-200 hover:text-maroon">Staff Login</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Home appointments across</p>
          <p className="text-sm text-neutral-300">{CITY_AREAS.join(" · ")}</p>
        </div>
      </div>
      <div className="bg-maroon-deep text-[#fdf3e7] dark:bg-royal dark:text-neutral-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 px-4 py-3 text-xs sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Madras Sparkle, Chennai</p>
          <p>BIS 916 Hallmarked Gold · Certified Diamonds</p>
        </div>
      </div>
    </footer>
  );
}
