import Link from "next/link";
import { Sparkles } from "lucide-react";
import { categoryLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import EnquireButton from "./EnquireButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card group flex flex-col overflow-hidden transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-maroon/30 hover:shadow-lg">
      <Link href={`/products/${encodeURIComponent(product.sku_id)}`} className="relative block aspect-square overflow-hidden bg-neutral-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.featured_image_url}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-widest text-gold backdrop-blur">
          {product.jewelry_type}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500">{categoryLabel(product.category)}</p>
        <Link href={`/products/${encodeURIComponent(product.sku_id)}`} className="mt-1 font-heading text-lg text-neutral-100 hover:text-maroon">
          {product.title}
        </Link>
        <p className="font-mono text-xs text-gold/80">{product.sku_id}</p>
        <p className="mt-2 text-sm font-semibold text-maroon">
          {product.show_indicative_price && product.indicative_price !== null
            ? `From ${formatPrice(product.indicative_price)}`
            : "Price on consultation"}
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={`/try-on?sku=${encodeURIComponent(product.sku_id)}`} className="btn-gold flex-1 px-4 text-xs">
            <Sparkles className="h-4 w-4" /> Try On
          </Link>
          <EnquireButton product={product} className="btn-outline flex-1 px-4 text-xs" label="Enquire" />
        </div>
      </div>
    </div>
  );
}
