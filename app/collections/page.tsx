import { getProducts } from "@/lib/data";
import CollectionView from "@/components/CollectionView";

export const dynamic = "force-dynamic";

export const metadata = { title: "Collections | Madras Sparkle" };

export default async function CollectionsPage() {
  const products = await getProducts();
  return <CollectionView title="All Collections" products={products} />;
}
