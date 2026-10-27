import { Suspense } from "react";
import { getProducts } from "@/lib/data";
import CollectionView from "@/components/CollectionView";
import CollectionSearch from "@/components/CollectionSearch";

export const revalidate = 60;

export const metadata = { title: "Collections | Madras Sparkle" };

export default async function CollectionsPage() {
  const products = await getProducts();
  return (
    <Suspense fallback={<CollectionView title="All Jewellery" products={products} />}>
      <CollectionSearch products={products} />
    </Suspense>
  );
}
