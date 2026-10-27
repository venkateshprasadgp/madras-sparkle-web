import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteProduct, togglePublished } from "./actions";

export default async function ProductsPage({ searchParams }: { searchParams: { q?: string } }) {
  const { supabase } = await requireStaff();
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  const q = (searchParams.q ?? "").replace(/[^\w\s-]/g, "").trim();
  if (q) query = query.or(`sku_id.ilike.%${q}%,title.ilike.%${q}%`);
  const { data } = await query;
  const products = (data ?? []) as Product[];

  return (
    <>
      <PageHeader
        title="Products & SKUs"
        description="Manage the catalogue, alphanumeric SKUs, media and price visibility."
        actions={
          <Link href="/admin/products/new" className="btn-gold">
            <Plus className="h-4 w-4" /> New Product
          </Link>
        }
      />
      <form className="mb-4">
        <input name="q" defaultValue={searchParams.q} placeholder="Search by SKU or title…" className="input max-w-sm" />
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">SKU</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500">No products yet.</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.featured_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <span className="font-medium text-neutral-100">{p.title}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-gold">{p.sku_id}</td>
                <td className="p-4 text-neutral-300">{categoryLabel(p.category)}</td>
                <td className="p-4 text-neutral-300">
                  {formatPrice(p.indicative_price)}
                  {!p.show_indicative_price && <span className="ml-2 text-xs text-neutral-500">(hidden)</span>}
                </td>
                <td className="p-4">
                  <form action={togglePublished}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="next" value={String(!p.is_published)} />
                    <button
                      className={`rounded-full px-3 py-1 text-xs ${
                        p.is_published ? "bg-emerald-500/10 text-emerald-300" : "bg-neutral-500/10 text-neutral-400"
                      }`}
                    >
                      {p.is_published ? "Published" : "Draft"}
                    </button>
                  </form>
                </td>
                <td className="p-4">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/products/${p.id}`} className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 hover:text-gold" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit message={`Delete ${p.sku_id}? This cannot be undone.`} className="rounded-lg p-2 text-neutral-400 hover:bg-red-500/10 hover:text-red-300" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
