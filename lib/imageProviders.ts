import "server-only";
import type { InlineImage } from "./tryonRegion";

export type GenerateResult = InlineImage | { status: number; error: string };
type Provider = "gemini" | "meta";

const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const META_MODEL = process.env.META_IMAGE_MODEL || "muse-image-1.0";
const META_TIMEOUT_MS = 40_000;

const UNAVAILABLE = "The AI blend service is unavailable. Please try again.";
const RATE_LIMITED = "The AI blend has reached its usage limit for now. Please try again later.";
const NO_IMAGE = "The AI could not produce an image for this photo. Try a clearer, front-facing photo.";

const toDataUrl = (img: InlineImage) => `data:${img.mimeType};base64,${img.data}`;

function configured(): Provider[] {
  const available: Provider[] = [];
  if (process.env.MODEL_API_KEY) available.push("meta");
  if (process.env.GEMINI_API_KEY) available.push("gemini");
  const preferred = process.env.AI_IMAGE_PROVIDER === "meta" ? "meta" : "gemini";
  return available.sort((a, b) => Number(b === preferred) - Number(a === preferred));
}

export function imageProviderConfigured() {
  return configured().length > 0;
}

async function generateGemini(prompt: string, photo: InlineImage, jewelry: InlineImage): Promise<GenerateResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { mime_type: photo.mimeType, data: photo.data } },
              { inline_data: { mime_type: jewelry.mimeType, data: jewelry.data } },
            ],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );
  if (!res.ok) {
    console.error("Gemini blend failed", res.status, (await res.text()).slice(0, 500));
    return { status: 502, error: res.status === 429 ? RATE_LIMITED : UNAVAILABLE };
  }
  type Part = { inlineData?: { mimeType: string; data: string }; inline_data?: { mime_type: string; data: string } };
  const parts: Part[] = (await res.json())?.candidates?.[0]?.content?.parts ?? [];
  const part = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (part?.inlineData) return { mimeType: part.inlineData.mimeType, data: part.inlineData.data };
  if (part?.inline_data) return { mimeType: part.inline_data.mime_type, data: part.inline_data.data };
  return { status: 422, error: NO_IMAGE };
}

async function generateMeta(
  prompt: string,
  photo: InlineImage,
  jewelry: InlineImage,
  size: { width: number; height: number },
): Promise<GenerateResult> {
  const res = await fetch("https://api.meta.ai/v1/images/edits", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
    signal: AbortSignal.timeout(META_TIMEOUT_MS),
    body: JSON.stringify({
      model: META_MODEL,
      prompt,
      images: [{ image_url: toDataUrl(photo) }, { image_url: toDataUrl(jewelry) }],
      n: 1,
      size: `${size.width}x${size.height}`,
      output_format: "jpeg",
      tool_enablement: { enable_image_search: false, enable_web_search: false, enable_shell: false },
    }),
  });
  if (!res.ok) {
    console.error("Meta blend failed", res.status, (await res.text()).slice(0, 500));
    return { status: res.status === 400 ? 422 : 502, error: res.status === 429 ? RATE_LIMITED : res.status === 400 ? NO_IMAGE : UNAVAILABLE };
  }
  const json = await res.json();
  const data: string | undefined = json?.data?.[0]?.b64_json;
  if (!data) return { status: 422, error: NO_IMAGE };
  return { mimeType: `image/${json.output_format || "jpeg"}`, data };
}

/** Runs the preferred provider (AI_IMAGE_PROVIDER), falling back to the other configured one on failure. */
export async function generateImage(
  prompt: string,
  photo: InlineImage,
  jewelry: InlineImage,
  size: { width: number; height: number },
): Promise<GenerateResult> {
  let last: GenerateResult = { status: 503, error: "AI blending is not configured." };
  for (const provider of configured()) {
    try {
      last = provider === "meta" ? await generateMeta(prompt, photo, jewelry, size) : await generateGemini(prompt, photo, jewelry);
    } catch (err) {
      console.error(`${provider} blend error`, err);
      last = { status: 502, error: UNAVAILABLE };
    }
    if (!("status" in last)) return last;
  }
  return last;
}
