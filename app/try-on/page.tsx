import { getProducts } from "@/lib/data";
import TryOnStudio from "@/components/TryOnStudio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Virtual Try-On Studio | Madras Sparkle" };

export default async function TryOnPage({ searchParams }: { searchParams: { sku?: string } }) {
  const products = await getProducts();
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-4xl text-gold-gradient">Virtual Try-On Studio</h1>
      <p className="mt-2 max-w-2xl text-neutral-400">
        Upload a front-facing photo, place a piece by hand, then let our AI blend it photorealistically.
      </p>
      <div className="mt-8">
        <TryOnStudio products={products} initialSku={searchParams.sku} />
      </div>
    </section>
  );
}
