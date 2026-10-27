import "server-only";
import { createServerSupabase } from "./supabase/server";
import { DEMO_BANNERS, DEMO_PRODUCTS, DEMO_SETTINGS } from "./demo-data";
import type { Banner, JewelryCategory, Product, SystemSettings } from "./types";

export async function getProducts(opts: { category?: JewelryCategory; featured?: boolean } = {}) {
  const supabase = createServerSupabase();
  if (!supabase) {
    return DEMO_PRODUCTS.filter(
      (p) => (!opts.category || p.category === opts.category) && (!opts.featured || p.is_featured),
    );
  }
  let query = supabase.from("products").select("*").eq("is_published", true).order("created_at", { ascending: false });
  if (opts.category) query = query.eq("category", opts.category);
  if (opts.featured) query = query.eq("is_featured", true);
  const { data } = await query;
  return (data ?? []) as Product[];
}

export async function getProductBySku(sku: string) {
  const supabase = createServerSupabase();
  if (!supabase) return DEMO_PRODUCTS.find((p) => p.sku_id === sku) ?? null;
  const { data } = await supabase.from("products").select("*").eq("sku_id", sku).eq("is_published", true).maybeSingle();
  return (data ?? null) as Product | null;
}

export async function getBanners() {
  const supabase = createServerSupabase();
  if (!supabase) return DEMO_BANNERS;
  const { data } = await supabase.from("banners").select("*").eq("is_active", true).order("display_order");
  return (data ?? []) as Banner[];
}

export async function getSettings() {
  const supabase = createServerSupabase();
  if (!supabase) return DEMO_SETTINGS;
  const { data } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();
  return (data ?? DEMO_SETTINGS) as SystemSettings;
}
