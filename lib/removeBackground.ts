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

  const bg = medianColor(px, border);
  const dist = (i: number) => {
    const o = i * 4;
    return Math.hypot(px[o] - bg[0], px[o + 1] - bg[1], px[o + 2] - bg[2]);
  };

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  for (const i of border) {
    if (!visited[i] && dist(i) < SOFT) {
      visited[i] = 1;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop()!;
    const d = dist(i);
    const alpha = d <= HARD ? 0 : Math.round(((d - HARD) / (SOFT - HARD)) * 255);
    px[i * 4 + 3] = Math.min(px[i * 4 + 3], alpha);
    if (d > HARD) continue; // soft edge pixel: keep it, don't spread through it
    const x = i % w;
    const y = (i - x) / w;
    const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (const n of next) {
      if (n >= 0 && !visited[n] && dist(n) < SOFT) {
        visited[n] = 1;
        stack.push(n);
      }
    }
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
