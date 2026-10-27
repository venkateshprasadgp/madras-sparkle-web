import PageHeader from "@/components/admin/PageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { requireStaff } from "@/lib/auth";

export default async function NewProductPage() {
  await requireStaff();
  return (
    <>
      <PageHeader title="New Product" description="Every product needs a unique alphanumeric SKU ID." />
      <ProductForm />
    </>
  );
}
