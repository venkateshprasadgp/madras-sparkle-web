import "server-only";
import sharp from "sharp";
import type { JewelryCategory } from "./types";

export type InlineImage = { mimeType: string; data: string };
export type Box = { left: number; top: number; width: number; height: number };

const WORK_SIZE = 1024;
const SAM_TIMEOUT_MS = 15_000;

type Px = { x1: number; y1: number; x2: number; y2: number };

/** SAM 3.1 concept to locate, and how to grow its box into the area the image model should see. */
const REGION: Partial<Record<JewelryCategory, { concept: string; frame: (b: Px) => { cx: number; top: number; side: number } }>> = {
  NECKLACE: { concept: "neck", frame: (b) => neckFrame(b, 3.4, 0.22) },
  PENDANT: { concept: "neck", frame: (b) => neckFrame(b, 3.6, 0.2) },
  HARAM: { concept: "neck", frame: (b) => neckFrame(b, 5.2, 0.12) },
  EARRINGS_JUMMIKI: { concept: "head", frame: (b) => padFrame(b, 0.35) },
  NOSE_PINS: { concept: "face", frame: (b) => padFrame(b, 0.3) },
};

function neckFrame(b: Px, widthFactor: number, above: number) {
  const nw = b.x2 - b.x1;
  const side = Math.max(nw * widthFactor, (b.y2 - b.y1) * 4);
  return { cx: (b.x1 + b.x2) / 2, top: b.y1 - side * above, side };
}

function padFrame(b: Px, pad: number) {
  const side = Math.max(b.x2 - b.x1, b.y2 - b.y1) * (1 + 2 * pad);
  return { cx: (b.x1 + b.x2) / 2, top: (b.y1 + b.y2) / 2 - side / 2, side };
}

/** Largest box SAM 3.1 finds for the concept, in pixels of the (EXIF-rotated) image. */
async function detectBox(apiKey: string, image: Buffer, concept: string): Promise<Px | null> {
  const res = await fetch("https://api.meta.ai/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream", Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(SAM_TIMEOUT_MS),
    body: JSON.stringify({
      model: "sam-3.1",
      stream: true,
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: concept },
            { type: "input_image", image_url: `data:image/jpeg;base64,${image.toString("base64")}` },
          ],
        },
      ],
    }),
  });
  if (!res.ok) return null;
  let text = "";
  for (const line of (await res.text()).split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const ev = JSON.parse(line.slice(5));
      if (ev.type === "response.output_text.delta") text += ev.delta;
    } catch {
      // keep-alive or non-JSON line
    }
  }
  let best: Px | null = null;
  for (const m of Array.from(text.matchAll(/<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+)/g))) {
    const [x1, y1, x2, y2] = m.slice(1).map(Number);
    if (!best || (x2 - x1) * (y2 - y1) > (best.x2 - best.x1) * (best.y2 - best.y1)) best = { x1, y1, x2, y2 };
  }
  return best;
}

/** Square crop clamped to the image, or null when the photo is already a close-up. */
export function cropBox(frame: { cx: number; top: number; side: number }, width: number, height: number): Box | null {
  const side = Math.floor(Math.min(frame.side, width, height));
  if (side < 64 || side * side > 0.6 * width * height) return null;
  const left = Math.round(Math.min(Math.max(frame.cx - side / 2, 0), width - side));
  const top = Math.round(Math.min(Math.max(frame.top, 0), height - side));
  return { left, top, width: side, height: side };
}

export async function imageSize(img: InlineImage): Promise<{ width: number; height: number }> {
  const { width = 1024, height = 1024 } = await sharp(Buffer.from(img.data, "base64")).metadata();
  return { width, height };
}

/** Resizes a generated image back to the source photo's pixel size so the framing matches the upload. */
export async function fitTo(img: InlineImage, size: { width: number; height: number }): Promise<InlineImage> {
  const out = await sharp(Buffer.from(img.data, "base64"))
    .resize(size.width, size.height, { fit: "fill", kernel: "lanczos3" })
    .jpeg({ quality: 92 })
    .toBuffer();
  return { mimeType: "image/jpeg", data: out.toString("base64") };
}

export type Region = { box: Box; crop: InlineImage; source: Buffer };

/** Finds the body area for this category and returns an upscaled close-up of it for the image model. */
export async function prepareRegion(apiKey: string, photo: InlineImage, category: JewelryCategory): Promise<Region | null> {
  const spec = REGION[category];
  if (!spec) return null;
  const source = await sharp(Buffer.from(photo.data, "base64")).rotate().jpeg({ quality: 95 }).toBuffer();
  const { width, height } = await sharp(source).metadata();
  if (!width || !height) return null;
  const found = await detectBox(apiKey, source, spec.concept);
  if (!found) return null;
  const box = cropBox(spec.frame(found), width, height);
  if (!box) return null;
  const crop = await sharp(source)
    .extract(box)
    .resize(WORK_SIZE, WORK_SIZE, { kernel: "lanczos3" })
    .jpeg({ quality: 95 })
    .toBuffer();
  return { box, crop: { mimeType: "image/jpeg", data: crop.toString("base64") }, source };
}

function featherMask(size: number, box: Box, imgW: number, imgH: number) {
  const feather = Math.max(4, Math.round(size * 0.12));
  const mask = Buffer.alloc(size * size);
  const soft = {
    left: box.left > 0,
    top: box.top > 0,
    right: box.left + box.width < imgW,
    bottom: box.top + box.height < imgH,
  };
  const ramp = (d: number, on: boolean) => (on ? Math.min(1, d / feather) : 1);
  for (let y = 0; y < size; y++) {
    const fy = Math.min(ramp(y, soft.top), ramp(size - 1 - y, soft.bottom));
    for (let x = 0; x < size; x++) {
      const fx = Math.min(ramp(x, soft.left), ramp(size - 1 - x, soft.right));
      const t = fx * fy;
      mask[y * size + x] = Math.round(255 * t * t * (3 - 2 * t));
    }
  }
  return mask;
}

/** Shifts the patch's colour so its outer band matches the original, hiding seams from model tone drift. */
function matchBorderTone(patch: Buffer, original: Buffer, size: number) {
  const band = Math.max(4, Math.round(size * 0.06));
  const sums = [0, 0, 0, 0, 0, 0];
  let n = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x >= band && x < size - band && y >= band && y < size - band) continue;
      const i = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) {
        sums[c] += original[i + c];
        sums[3 + c] += patch[i + c];
      }
      n++;
    }
  }
  const shift = [0, 1, 2].map((c) => Math.max(-40, Math.min(40, (sums[c] - sums[3 + c]) / n)));
  for (let i = 0; i < patch.length; i += 3) {
    for (let c = 0; c < 3; c++) patch[i + c] = Math.max(0, Math.min(255, Math.round(patch[i + c] + shift[c])));
  }
}

/** Pastes the edited close-up back into the original photo with feathered edges. */
export async function compositeRegion(region: Region, edited: InlineImage): Promise<InlineImage> {
  const { box, source } = region;
  const { width: imgW = 0, height: imgH = 0 } = await sharp(source).metadata();
  const patchRgb = await sharp(Buffer.from(edited.data, "base64"))
    .resize(box.width, box.height, { fit: "fill", kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer();
  const original = await sharp(source).extract(box).removeAlpha().raw().toBuffer();
  matchBorderTone(patchRgb, original, box.width);
  const mask = featherMask(box.width, box, imgW, imgH);
  const patch = await sharp(patchRgb, { raw: { width: box.width, height: box.height, channels: 3 } })
    .joinChannel(mask, { raw: { width: box.width, height: box.height, channels: 1 } })
    .png()
    .toBuffer();
  const out = await sharp(source).composite([{ input: patch, left: box.left, top: box.top }]).jpeg({ quality: 92 }).toBuffer();
  return { mimeType: "image/jpeg", data: out.toString("base64") };
}
