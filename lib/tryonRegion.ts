import "server-only";
import sharp from "sharp";
import type { JewelryCategory } from "./types";

export type InlineImage = { mimeType: string; data: string };
export type Box = { left: number; top: number; width: number; height: number };

const DETECT_MODEL = process.env.GEMINI_DETECT_MODEL || "gemini-2.5-flash";
const WORK_SIZE = 1024;

const REGION: Record<JewelryCategory, { target: string; pad: number }> = {
  NECKLACE: { target: "the person's neck, collarbones and upper chest (from the chin down to the middle of the chest, shoulder to shoulder)", pad: 0.15 },
  PENDANT: { target: "the person's neck, collarbones and upper chest (from the chin down to the middle of the chest, shoulder to shoulder)", pad: 0.15 },
  HARAM: { target: "the person's neck and torso (from the chin down to the waist, shoulder to shoulder)", pad: 0.1 },
  EARRINGS_JUMMIKI: { target: "the person's whole head including both ears and the neck", pad: 0.2 },
  NOSE_PINS: { target: "the person's face", pad: 0.25 },
  BANGLES_BRACELET: { target: "the person's hands and wrists", pad: 0.25 },
  RINGS: { target: "the person's hands", pad: 0.25 },
};

async function detectRegion(apiKey: string, photo: InlineImage, category: JewelryCategory): Promise<number[] | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(DETECT_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: photo.mimeType, data: photo.data } },
              {
                text: `Return the bounding box of ${REGION[category].target} as JSON {"box_2d":[ymin,xmin,ymax,xmax]} with coordinates normalized to 0-1000. If there is no person, return {"box_2d":null}.`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );
  if (!res.ok) return null;
  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
  if (!text) return null;
  const parsed = JSON.parse(text);
  const box = Array.isArray(parsed) ? parsed[0]?.box_2d : parsed?.box_2d;
  return Array.isArray(box) && box.length === 4 && box.every((n) => Number.isFinite(n)) ? box : null;
}

/** Square crop around the detected region, or null when the photo is already a close-up. */
export function cropBox(box2d: number[], width: number, height: number, pad: number): Box | null {
  const [ymin, xmin, ymax, xmax] = box2d.map((n) => Math.min(1000, Math.max(0, n)) / 1000);
  const bw = (xmax - xmin) * width;
  const bh = (ymax - ymin) * height;
  if (bw < 8 || bh < 8) return null;
  let side = Math.max(bw, bh) * (1 + 2 * pad);
  side = Math.min(side, width, height);
  if (side * side > 0.6 * width * height) return null;
  const cx = ((xmin + xmax) / 2) * width;
  const cy = ((ymin + ymax) / 2) * height;
  const left = Math.round(Math.min(Math.max(cx - side / 2, 0), width - side));
  const top = Math.round(Math.min(Math.max(cy - side / 2, 0), height - side));
  const s = Math.floor(side);
  return { left, top, width: s, height: s };
}

export async function imageSize(img: InlineImage): Promise<{ width: number; height: number }> {
  const { width = 1024, height = 1024 } = await sharp(Buffer.from(img.data, "base64")).metadata();
  return { width, height };
}

export type Region = { box: Box; crop: InlineImage; source: Buffer };

/** Finds the body area for this category and returns an upscaled close-up of it for the image model. */
export async function prepareRegion(apiKey: string, photo: InlineImage, category: JewelryCategory): Promise<Region | null> {
  const source = await sharp(Buffer.from(photo.data, "base64")).rotate().toBuffer();
  const { width, height } = await sharp(source).metadata();
  if (!width || !height) return null;
  const box2d = await detectRegion(apiKey, photo, category);
  if (!box2d) return null;
  const box = cropBox(box2d, width, height, REGION[category].pad);
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
