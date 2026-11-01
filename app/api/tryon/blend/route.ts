import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { blendPrompt } from "@/lib/tryon";
import { generateImage, imageProviderConfigured, type GenerateResult } from "@/lib/imageProviders";
import { compositeRegion, fitTo, imageSize, prepareRegion, type InlineImage, type Region } from "@/lib/tryonRegion";
import type { JewelryCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_BASE64_LENGTH = 12 * 1024 * 1024;

function parseDataUrl(value: unknown): InlineImage | null {
  if (typeof value !== "string" || value.length > MAX_BASE64_LENGTH) return null;
  const match = DATA_URL.exec(value);
  return match ? { mimeType: match[1], data: match[2] } : null;
}

async function fetchAsInline(url: string): Promise<InlineImage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load jewelry asset (${res.status})`);
  const mimeType = res.headers.get("content-type")?.split(";")[0] ?? "image/png";
  if (!/^image\/(png|webp|jpeg)$/.test(mimeType)) throw new Error("Jewelry asset must be PNG, WEBP or JPEG");
  return { mimeType, data: Buffer.from(await res.arrayBuffer()).toString("base64") };
}

export async function POST(request: NextRequest) {
  if (!imageProviderConfigured()) {
    return NextResponse.json({ error: "AI blending is not configured (set MODEL_API_KEY)." }, { status: 503 });
  }
  const metaKey = process.env.MODEL_API_KEY;

  let body: { photo?: unknown; overlay?: unknown; sku?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const photo = parseDataUrl(body.photo);
  const sku = typeof body.sku === "string" ? body.sku : "";
  if (!photo || !sku) return NextResponse.json({ error: "A photo and product SKU are required." }, { status: 400 });

  let category: JewelryCategory;
  let jewelry: InlineImage | null;

  const supabase = createServerSupabase();
  if (supabase) {
    const { data: quota, error: quotaError } = await supabase.rpc("consume_tryon", { p_sku_id: sku });
    if (quotaError) return NextResponse.json({ error: "Please register before using the AI blend." }, { status: 401 });
    if (!quota?.allowed) {
      return NextResponse.json({ error: quota?.reason ?? "NOT_ALLOWED", reason: quota?.reason }, { status: 403 });
    }
    const { data: product } = await supabase
      .from("products")
      .select("category, transparent_png_url")
      .eq("sku_id", sku)
      .eq("is_published", true)
      .maybeSingle();
    if (!product) return NextResponse.json({ error: "Unknown product." }, { status: 404 });
    category = product.category;
    // Prefer the client overlay: it has the studio background already removed.
    jewelry = parseDataUrl(body.overlay);
    if (!jewelry) {
      try {
        jewelry = await fetchAsInline(product.transparent_png_url);
      } catch {
        jewelry = null;
      }
    }
  } else {
    const product = DEMO_PRODUCTS.find((p) => p.sku_id === sku);
    if (!product) return NextResponse.json({ error: "Unknown product." }, { status: 404 });
    category = product.category;
    jewelry = parseDataUrl(body.overlay);
  }

  if (!jewelry) return NextResponse.json({ error: "Jewelry overlay image is missing." }, { status: 400 });

  let region: Region | null = null;
  if (metaKey) {
    try {
      region = await prepareRegion(metaKey, photo, category);
    } catch (err) {
      console.error("Try-on region detection failed", err);
    }
  }

  const fullPhoto = async (): Promise<GenerateResult> => {
    const size = await imageSize(photo);
    const generated = await generateImage(blendPrompt(category), photo, jewelry, size);
    return "status" in generated ? generated : fitTo(generated, size).catch(() => generated);
  };
  let outcome = region
    ? await generateImage(blendPrompt(category, true), region.crop, jewelry, { width: 1024, height: 1024 })
    : await fullPhoto();
  if ("status" in outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });

  let image = outcome;
  if (region) {
    try {
      image = await compositeRegion(region, image);
    } catch (err) {
      console.error("Try-on composite failed", err);
      outcome = await fullPhoto();
      if ("status" in outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
      image = outcome;
    }
  }

  return NextResponse.json(
    { image: `data:${image.mimeType};base64,${image.data}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}

