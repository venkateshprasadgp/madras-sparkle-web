import "server-only";
import { cache } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./supabase/config";
import { DEMO_BANNERS, DEMO_PRODUCTS, DEMO_SETTINGS } from "./demo-data";
import type { Banner, JewelryCategory, Product, SystemSettings } from "./types";

let publicClient: SupabaseClient | null = null;

/**
 * Cookie-less anon client for public storefront data. Not reading cookies lets
 * pages be statically cached (ISR) instead of rendered on every request.
 */
function getPublicSupabase() {
  if (!isSupabaseConfigured()) return null;
  publicClient ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

export async function getProducts(opts: { category?: JewelryCategory; featured?: boolean } = {}) {
  const supabase = getPublicSupabase();
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

export const getProductBySku = cache(async (sku: string) => {
  const supabase = getPublicSupabase();
  if (!supabase) return DEMO_PRODUCTS.find((p) => p.sku_id === sku) ?? null;
  const { data } = await supabase.from("products").select("*").eq("sku_id", sku).eq("is_published", true).maybeSingle();
  return (data ?? null) as Product | null;
});

export async function getBanners() {
  const supabase = getPublicSupabase();
  if (!supabase) return DEMO_BANNERS;
  const { data } = await supabase.from("banners").select("*").eq("is_active", true).order("display_order");
  return (data ?? []) as Banner[];
}

export async function getSettings() {
  const supabase = getPublicSupabase();
  if (!supabase) return DEMO_SETTINGS;
  const { data } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();
  return (data ?? DEMO_SETTINGS) as SystemSettings;
}
