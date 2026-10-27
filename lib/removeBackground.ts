"use client";

const MAX_DIM = 1200;
const HARD = 28; // colour distance treated as pure background
const SOFT = 70; // colour distance where the piece becomes fully opaque

/**
 * Makes a flat studio background (white, cream, grey…) transparent and trims
 * the result to the jewellery. Only pixels connected to the image border are
 * removed, so white stones or enamel inside the piece are kept.
 * Images that already have a transparent border are returned unchanged.
 */
export function removeBackground(img: HTMLImageElement): HTMLCanvasElement {
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);

  const image = ctx.getImageData(0, 0, w, h);
  const px = image.data;

  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);

  const transparentBorder = border.filter((i) => px[i * 4 + 3] < 128).length;
  if (transparentBorder > border.length * 0.5) return canvas;

  const [br, bgG, bb] = medianColor(px, border);
  const dist2 = (i: number) => {
    const o = i * 4;
    const dr = px[o] - br;
    const dg = px[o + 1] - bgG;
    const db = px[o + 2] - bb;
    return dr * dr + dg * dg + db * db;
  };
  const HARD2 = HARD * HARD;
  const SOFT2 = SOFT * SOFT;

  const visited = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;
  const visit = (n: number) => {
    if (!visited[n] && dist2(n) < SOFT2) {
      visited[n] = 1;
      stack[top++] = n;
    }
  };
  for (const i of border) visit(i);
  while (top > 0) {
    const i = stack[--top];
    const d2 = dist2(i);
    if (d2 > HARD2) {
      // Soft edge pixel: fade it, but don't spread through it.
      const alpha = Math.round(((Math.sqrt(d2) - HARD) / (SOFT - HARD)) * 255);
      px[i * 4 + 3] = Math.min(px[i * 4 + 3], alpha);
      continue;
    }
    px[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (i >= w) visit(i - w);
    if (i < w * (h - 1)) visit(i + w);
  }
  ctx.putImageData(image, 0, 0);
  return trim(canvas, px, w, h);
}

function medianColor(px: Uint8ClampedArray, idx: number[]): [number, number, number] {
  const ch = (c: number) => {
    const v = idx.map((i) => px[i * 4 + c]).sort((a, b) => a - b);
    return v[v.length >> 1];
  };
  return [ch(0), ch(1), ch(2)];
}

function trim(canvas: HTMLCanvasElement, px: Uint8ClampedArray, w: number, h: number): HTMLCanvasElement {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return canvas;
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}
