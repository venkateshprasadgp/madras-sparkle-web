"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { CATEGORIES, SKU_PATTERN } from "@/lib/constants";

export type ProductFormState = { error?: string };

function revalidatePublic() {
  revalidatePath("/", "layout");
}

export async function saveProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { supabase } = await requireStaff();

  const id = String(formData.get("id") ?? "");
  const sku_id = String(formData.get("sku_id") ?? "").trim().toUpperCase();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const priceRaw = String(formData.get("indicative_price") ?? "").trim();
  const featured_image_url = String(formData.get("featured_image_url") ?? "");
  const transparent_png_url = String(formData.get("transparent_png_url") ?? "");

  if (!SKU_PATTERN.test(sku_id)) {
    return { error: "SKU ID must be alphanumeric segments separated by hyphens, e.g. MS-NK-916-001." };
  }
  if (!title) return { error: "Title is required." };
  if (!CATEGORIES.some((c) => c.value === category)) return { error: "Select a valid category." };
  if (!featured_image_url) return { error: "Upload a featured image." };
  if (!transparent_png_url) return { error: "Upload a transparent PNG for the try-on engine." };
  const indicative_price = priceRaw ? Number(priceRaw) : null;
  if (indicative_price !== null && (!Number.isFinite(indicative_price) || indicative_price < 0)) {
    return { error: "Indicative price must be a positive number." };
  }

  const record = {
    sku_id,
    title,
    category,
    jewelry_type: String(formData.get("jewelry_type") ?? "Gold 22K BIS 916"),
    description: String(formData.get("description") ?? "").trim() || null,
    indicative_price,
    show_indicative_price: formData.get("show_indicative_price") === "true",
    featured_image_url,
    transparent_png_url,
    video_url: String(formData.get("video_url") ?? "") || null,
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
  };

  const { error } = id
    ? await supabase.from("products").update(record).eq("id", id)
    : await supabase.from("products").insert(record);

  if (error) {
    if (error.code === "23505") return { error: `SKU ID ${sku_id} already exists.` };
    return { error: error.message };
  }

  revalidatePublic();
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublic();
}

export async function togglePublished(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = String(formData.get("id"));
  const next = formData.get("next") === "true";
  await supabase.from("products").update({ is_published: next }).eq("id", id);
  revalidatePublic();
}
