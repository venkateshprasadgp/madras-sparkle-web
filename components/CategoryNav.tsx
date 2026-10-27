import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryNav({ active }: { active?: string }) {
  return (
    <nav className="flex gap-3 overflow-x-auto pb-2" aria-label="Jewellery categories">
      <Link
        href="/collections"
        className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm transition ${
          !active ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-neutral-300 hover:border-gold/50 hover:text-gold"
        }`}
      >
        All
      </Link>
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/collections/${c.slug}`}
          className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm transition ${
            active === c.slug ? "border-gold bg-gold/10 text-gold" : "border-white/10 text-neutral-300 hover:border-gold/50 hover:text-gold"
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
