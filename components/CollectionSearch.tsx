"use client";

import { useSearchParams } from "next/navigation";
import { categoryLabel } from "@/lib/constants";
import type { Product } from "@/lib/types";
import CollectionView from "./CollectionView";

/** Filters the statically rendered catalogue in the browser so /collections stays cacheable. */
export default function CollectionSearch({ products }: { products: Product[] }) {
  const raw = useSearchParams().get("q")?.trim() ?? "";
  const q = raw.toLowerCase();
  if (!q) return <CollectionView title="All Jewellery" products={products} />;

  const matches = products.filter((p) =>
    [p.title, p.sku_id, p.jewelry_type, categoryLabel(p.category), p.description ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
  return <CollectionView title={`Results for “${raw}”`} products={matches} />;
}
