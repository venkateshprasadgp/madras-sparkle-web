import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_PRODUCTS } from "@/lib/demo-data";
import { blendPrompt } from "@/lib/tryon";
import type { JewelryCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_BASE64_LENGTH = 12 * 1024 * 1024;
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

type InlineImage = { mimeType: string; data: string };

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI blending is not configured (missing GEMINI_API_KEY)." }, { status: 503 });
  }

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
    try {
      jewelry = await fetchAsInline(product.transparent_png_url);
    } catch {
      jewelry = parseDataUrl(body.overlay);
    }
  } else {
    const product = DEMO_PRODUCTS.find((p) => p.sku_id === sku);
    if (!product) return NextResponse.json({ error: "Unknown product." }, { status: 404 });
    category = product.category;
    jewelry = parseDataUrl(body.overlay);
  }

  if (!jewelry) return NextResponse.json({ error: "Jewelry overlay image is missing." }, { status: 400 });

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: blendPrompt(category) },
              { inline_data: { mime_type: photo.mimeType, data: photo.data } },
              { inline_data: { mime_type: jewelry.mimeType, data: jewelry.data } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    console.error("Gemini blend failed", geminiRes.status, detail.slice(0, 500));
    return NextResponse.json({ error: "The AI blend service is unavailable. Please try again." }, { status: 502 });
  }

  const result = await geminiRes.json();
  type Part = { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
  const parts: Part[] = result?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  const image = imagePart?.inlineData
    ? { mimeType: imagePart.inlineData.mimeType, data: imagePart.inlineData.data }
    : imagePart?.inline_data
      ? { mimeType: imagePart.inline_data.mime_type, data: imagePart.inline_data.data }
      : null;

  if (!image) {
    return NextResponse.json({ error: "The AI could not produce an image for this photo. Try a clearer, front-facing photo." }, { status: 422 });
  }

  return NextResponse.json(
    { image: `data:${image.mimeType};base64,${image.data}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
