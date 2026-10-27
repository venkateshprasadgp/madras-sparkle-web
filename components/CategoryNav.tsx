import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

const base = "whitespace-nowrap rounded-full border px-5 py-2 text-sm transition";
const on = "border-maroon bg-maroon text-royal";
const off = "border-neutral-700 text-neutral-300 hover:border-maroon hover:text-maroon";

export default function CategoryNav({ active }: { active?: string }) {
  return (
    <nav className="flex gap-3 overflow-x-auto pb-2" aria-label="Jewellery categories">
      <Link href="/collections" className={`${base} ${!active ? on : off}`}>
        All
      </Link>
      {CATEGORIES.map((c) => (
        <Link key={c.slug} href={`/collections/${c.slug}`} className={`${base} ${active === c.slug ? on : off}`}>
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
