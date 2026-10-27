"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gem, Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/try-on", label: "Virtual Try-On" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-royal/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Gem className="h-6 w-6 text-gold" />
          <span className="font-heading text-xl tracking-widest text-gold-gradient">MADRAS SPARKLE</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm tracking-wide transition hover:text-gold ${
                pathname === item.href ? "text-gold" : "text-neutral-300"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          className="md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6 text-gold" /> : <Menu className="h-6 w-6 text-gold" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/5 px-4 pb-4 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm text-neutral-200 hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
