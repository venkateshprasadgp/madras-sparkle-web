"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gem, House, Menu, Search, Sparkles, X } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import EnquireButton from "./EnquireButton";
import ThemeToggle from "./ThemeToggle";

const MENU = [
  { href: "/collections", label: "All Jewellery" },
  ...CATEGORIES.map((c) => ({ href: `/collections/${c.slug}`, label: c.label })),
  { href: "/try-on", label: "Virtual Try-On" },
];

function SearchBox({ className = "" }: { className?: string }) {
  return (
    <form action="/collections" role="search" className={`flex overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 ${className}`}>
      <Search className="ml-3 h-4 w-4 self-center text-neutral-500" />
      <input
        name="q"
        placeholder="Search for necklaces, rings, SKU…"
        aria-label="Search jewellery"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
      />
      <button type="submit" aria-label="Search" className="bg-maroon px-4 text-royal transition hover:brightness-110">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [promo, setPromo] = useState(true);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header>
      {promo && (
        <div className="relative bg-[linear-gradient(90deg,#2a0b2c,#4b0f2b,#2a0b2c)] text-[#fdf3e7]">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 px-10 py-2.5 text-center text-xs sm:text-sm">
            <span>
              <Sparkles className="mr-1 inline h-4 w-4 text-[#f5c96a]" />
              Free private home appointments across South Chennai. Try any design on yourself, virtually!
            </span>
            <Link href="/try-on" className="hidden whitespace-nowrap rounded-full border border-[#fdf3e7]/70 px-4 py-1 text-xs font-semibold tracking-wider hover:bg-white/10 sm:inline-block">
              TRY NOW
            </Link>
          </div>
          <button aria-label="Dismiss offer" onClick={() => setPromo(false)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="border-b border-neutral-800 bg-royal">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:gap-6 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-cream sm:h-11 sm:w-11">
              <Gem className="h-6 w-6 text-gold" />
            </span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap font-heading text-base tracking-[0.12em] text-maroon sm:text-2xl sm:tracking-[0.2em]">MADRAS SPARKLE</span>
              <span className="hidden text-[10px] uppercase tracking-[0.35em] text-neutral-400 sm:block">Gold · Diamonds · Lab-Grown</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            <EnquireButton
              product={null}
              label="HOME APPOINTMENT"
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-neutral-200 hover:text-maroon"
              icon={<House className="h-5 w-5 text-maroon" />}
            />
            <Link href="/try-on" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-neutral-200 hover:text-maroon">
              <Sparkles className="h-5 w-5 text-maroon" /> VIRTUAL TRY-ON
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <SearchBox className="hidden w-80 md:flex" />
            <ThemeToggle />
            <button className="lg:hidden" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
              {open ? <X className="h-6 w-6 text-maroon" /> : <Menu className="h-6 w-6 text-maroon" />}
            </button>
          </div>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <SearchBox />
        </div>
      </div>

      <nav aria-label="Jewellery menu" className={`bg-cream ${open ? "block" : "hidden lg:block"}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:py-0">
          {MENU.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`whitespace-nowrap border-b-2 py-2 text-[15px] transition lg:py-4 ${
                  active ? "border-maroon font-semibold text-maroon" : "border-transparent text-neutral-100 hover:text-maroon"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <EnquireButton product={null} label="Book Home Appointment" className="btn-gold mt-2 py-2 lg:ml-auto lg:mt-0" />
        </div>
      </nav>

      <div className="bg-maroon-deep text-[#fdf3e7] dark:bg-card dark:text-gold">
        <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs tracking-wide sm:text-sm">
          BIS 916 Hallmarked Gold · Certified Natural &amp; Lab-Grown Diamonds · Bespoke Designs
        </p>
      </div>
    </header>
  );
}
