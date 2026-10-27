import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getProductBySku } from "@/lib/data";
import { categoryFromSlug, categoryLabel, CATEGORIES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import EnquireButton from "@/components/EnquireButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { sku: string } }) {
  const product = await getProductBySku(decodeURIComponent(params.sku));
  return { title: product ? `${product.title} (${product.sku_id}) | Madras Sparkle` : "Madras Sparkle" };
}

export default async function ProductPage({ params }: { params: { sku: string } }) {
  const product = await getProductBySku(decodeURIComponent(params.sku));
  if (!product) notFound();
  const slug = CATEGORIES.find((c) => c.value === product.category)?.slug ?? "";

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
      <div className="space-y-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.featured_image_url} alt={product.title} className="card aspect-square w-full object-cover" />
        {product.video_url && (
          <video src={product.video_url} controls playsInline poster={product.featured_image_url} className="card w-full" />
        )}
      </div>
      <div className="space-y-5">
        <Link href={`/collections/${slug}`} className="text-xs uppercase tracking-widest text-neutral-500 hover:text-gold">
          {categoryFromSlug(slug)?.label ?? categoryLabel(product.category)}
        </Link>
        <h1 className="font-heading text-4xl text-neutral-50">{product.title}</h1>
        <p className="font-mono text-sm text-gold">SKU {product.sku_id}</p>
        <p className="inline-block rounded-full border border-gold/30 px-3 py-1 text-xs text-gold">{product.jewelry_type}</p>
        <p className="text-2xl text-neutral-100">
          {product.show_indicative_price && product.indicative_price !== null
            ? <>Indicative price {formatPrice(product.indicative_price)}</>
            : "Price on consultation"}
        </p>
        {product.description && <p className="leading-relaxed text-neutral-300">{product.description}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={`/try-on?sku=${encodeURIComponent(product.sku_id)}`} className="btn-gold">
            <Sparkles className="h-4 w-4" /> Virtual Try-On
          </Link>
          <EnquireButton product={product} label="Book Home Appointment" />
        </div>
        <p className="text-xs text-neutral-500">
          Indicative prices vary with the day&apos;s gold rate and final customisation.
        </p>
      </div>
    </section>
  );
}
