"use server";

import { revalidatePath } from "next/cache";
import { logAudit, requireStaff } from "@/lib/auth";

export type RestoreState = { error?: string; message?: string };

const PRODUCT_COLUMNS = [
  "id", "sku_id", "title", "category", "jewelry_type", "description", "indicative_price",
  "show_indicative_price", "featured_image_url", "transparent_png_url", "video_url",
  "is_featured", "is_published", "created_at",
];
const BANNER_COLUMNS = ["id", "title", "image_url", "target_link", "is_active", "display_order", "created_at"];

function pick(row: Record<string, unknown>, cols: string[]) {
  return Object.fromEntries(cols.filter((c) => c in row).map((c) => [c, row[c]]));
}

export async function restoreBackup(_prev: RestoreState, formData: FormData): Promise<RestoreState> {
  const ctx = await requireStaff(["SUPER_ADMINISTRATOR"]);
  const file = formData.get("backup");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a backup JSON file." };

  let backup: {
    products?: Record<string, unknown>[];
    banners?: Record<string, unknown>[];
    system_settings?: Record<string, unknown> | null;
  };
  try {
    backup = JSON.parse(await file.text());
  } catch {
    return { error: "The file is not valid JSON." };
  }
  if (!Array.isArray(backup.products) || !Array.isArray(backup.banners)) {
    return { error: "This does not look like a Madras Sparkle backup file." };
  }

  const products = backup.products.map((p) => pick(p, PRODUCT_COLUMNS));
  const banners = backup.banners.map((b) => pick(b, BANNER_COLUMNS));

  if (products.length) {
    const { error } = await ctx.supabase.from("products").upsert(products, { onConflict: "id" });
    if (error) return { error: `Products: ${error.message}` };
  }
  if (banners.length) {
    const { error } = await ctx.supabase.from("banners").upsert(banners, { onConflict: "id" });
    if (error) return { error: `Banners: ${error.message}` };
  }
  if (backup.system_settings) {
    const { max_tryon_per_user, whatsapp_business_number } = backup.system_settings as {
      max_tryon_per_user?: number;
      whatsapp_business_number?: string;
    };
    await ctx.supabase
      .from("system_settings")
      .update({ max_tryon_per_user, whatsapp_business_number })
      .eq("id", 1);
  }

  await logAudit(ctx, "RESTORE_BACKUP", { products: products.length, banners: banners.length, file: file.name });
  revalidatePath("/", "layout");
  return { message: `Restored ${products.length} products and ${banners.length} banners.` };
}
