import type { Product } from "@/lib/types";
import CategoryNav from "./CategoryNav";
import ProductCard from "./ProductCard";

export default function CollectionView({
  title,
  products,
  active,
}: {
  title: string;
  products: Product[];
  active?: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl text-gold-gradient">{title}</h1>
      <div className="mt-6">
        <CategoryNav active={active} />
      </div>
      {products.length === 0 ? (
        <p className="py-24 text-center text-neutral-500">New designs are coming soon to this collection.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
