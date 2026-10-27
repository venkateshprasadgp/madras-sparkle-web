"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";

export type BannerFormState = { error?: string; ok?: boolean };

export async function createBanner(_prev: BannerFormState, formData: FormData): Promise<BannerFormState> {
  const { supabase } = await requireStaff();
  const title = String(formData.get("title") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "");
  const target_link = String(formData.get("target_link") ?? "").trim() || null;
  const display_order = Number(formData.get("display_order") ?? 0) || 0;
  if (!title || !image_url) return { error: "Title and banner image are required." };
  if (target_link && !/^(\/|https?:\/\/)/.test(target_link)) {
    return { error: "Link must start with / or https://" };
  }
  const { error } = await supabase.from("banners").insert({ title, image_url, target_link, display_order });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function toggleBanner(formData: FormData) {
  const { supabase } = await requireStaff();
  await supabase
    .from("banners")
    .update({ is_active: formData.get("next") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}

export async function deleteBanner(formData: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from("banners").delete().eq("id", String(formData.get("id")));
  revalidatePath("/", "layout");
}
