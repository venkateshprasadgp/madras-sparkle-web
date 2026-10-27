import { getProducts } from "@/lib/data";
import { categoryLabel } from "@/lib/constants";
import CollectionView from "@/components/CollectionView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Collections | Madras Sparkle" };

export default async function CollectionsPage({ searchParams }: { searchParams: { q?: string } }) {
  const products = await getProducts();
  const q = searchParams.q?.trim().toLowerCase();
  if (!q) return <CollectionView title="All Jewellery" products={products} />;

  const matches = products.filter((p) =>
    [p.title, p.sku_id, p.jewelry_type, categoryLabel(p.category), p.description ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
  return <CollectionView title={`Results for “${searchParams.q?.trim()}”`} products={matches} />;
}
