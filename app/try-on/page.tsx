import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { getProducts } from "@/lib/data";
import TryOnStudio from "@/components/TryOnStudio";

export const revalidate = 60;
export const metadata = { title: "Virtual Try-On Studio | Madras Sparkle" };

export default async function TryOnPage() {
  const products = await getProducts();
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-heading text-4xl text-gold-gradient">Virtual Try-On Studio</h1>
      <p className="mt-2 max-w-2xl text-neutral-400">
        Upload a front-facing photo, place a piece by hand, then let our AI blend it photorealistically.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="card flex h-96 items-center justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin text-gold" />
            </div>
          }
        >
          <TryOnStudio products={products} />
        </Suspense>
      </div>
    </section>
  );
}
