import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { requireStaff } from "@/lib/auth";
import type { Product } from "@/lib/types";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("products").select("*").eq("id", params.id).maybeSingle();
  if (!data) notFound();
  const product = data as Product;
  return (
    <>
      <PageHeader title={`Edit ${product.sku_id}`} description={product.title} />
      <ProductForm product={product} />
    </>
  );
}
