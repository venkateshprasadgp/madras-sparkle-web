import { notFound } from "next/navigation";
import { getProducts } from "@/lib/data";
import { categoryFromSlug } from "@/lib/constants";
import CollectionView from "@/components/CollectionView";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { category: string } }) {
  const cat = categoryFromSlug(params.category);
  return { title: `${cat?.label ?? "Collection"} | Madras Sparkle` };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const cat = categoryFromSlug(params.category);
  if (!cat) notFound();
  const products = await getProducts({ category: cat.value });
  return <CollectionView title={cat.label} products={products} active={cat.slug} />;
}
