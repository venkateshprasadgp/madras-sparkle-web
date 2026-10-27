"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  CircleAlert,
  ImagePlus,
  LoaderCircle,
  Move,
  RotateCw,
  Sparkles,
  UserPlus,
  WandSparkles,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { CATEGORIES, QUOTA_EXCEEDED_MESSAGE } from "@/lib/constants";
import { DEFAULT_PLACEMENT } from "@/lib/tryon";
import { downloadDataUrl, fileToDataUrl, loadImage } from "@/lib/photo";
import { removeBackground } from "@/lib/removeBackground";
import { usePhotoBuffer } from "@/lib/usePhotoBuffer";
import { useVisitor } from "./VisitorProvider";
import PhotoPrivacyControls from "./PhotoPrivacyControls";
import EnquireButton from "./EnquireButton";

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

type PointerInfo = { x: number; y: number };

// Background removal is CPU-heavy; keep each processed piece so re-selecting it is instant.
const jewelryCache = new Map<string, HTMLCanvasElement>();

function defaultTransform(product: Product | null): Transform {
  return { x: 0.5, y: product ? DEFAULT_PLACEMENT[product.category].y : 0.6, scale: 1, rotation: 0 };
}

export default function TryOnStudio({ products }: { products: Product[] }) {
  const initialSku = useSearchParams().get("sku") ?? undefined;
  const { ready, visitor, maxTryons, requestRegistration, consumeTryon } = useVisitor();
  const { photo, save: savePhoto, clear: clearPhoto } = usePhotoBuffer();

  const [category, setCategory] = useState<string>("ALL");
  const [selected, setSelected] = useState<Product | null>(
    () => products.find((p) => p.sku_id === initialSku) ?? null,
  );
  const [transform, setTransform] = useState<Transform>(() => defaultTransform(selected));
  const [allowedSkus, setAllowedSkus] = useState<Set<string>>(new Set());
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [showAi, setShowAi] = useState(false);
  const [blending, setBlending] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoImg = useRef<HTMLImageElement | null>(null);
  const jewelryImg = useRef<HTMLCanvasElement | null>(null);
  const pointers = useRef<Map<number, PointerInfo>>(new Map());
  const gesture = useRef<{ dist: number; angle: number; scale: number; rotation: number } | null>(null);
  const [assetsVersion, setAssetsVersion] = useState(0);

  const visibleProducts = useMemo(
    () => (category === "ALL" ? products : products.filter((p) => p.category === category)),
    [products, category],
  );
  const overlayActive = Boolean(selected && allowedSkus.has(selected.sku_id));

  // Load the visitor photo into an <img> for canvas drawing.
  useEffect(() => {
    if (!photo) {
      photoImg.current = null;
      setAssetsVersion((v) => v + 1);
      return;
    }
    loadImage(photo).then((img) => {
      photoImg.current = img;
      setAssetsVersion((v) => v + 1);
    });
  }, [photo]);

  // Load the selected jewelry asset.
  useEffect(() => {
    jewelryImg.current = null;
    if (!selected) {
      setAssetsVersion((v) => v + 1);
      return;
    }
    const url = selected.transparent_png_url;
    const cached = jewelryCache.get(url);
    if (cached) {
      jewelryImg.current = cached;
      setAssetsVersion((v) => v + 1);
      return;
    }
    setAssetsVersion((v) => v + 1);
    let cancelled = false;
    loadImage(url, true)
      .then((img) => {
        let processed: HTMLCanvasElement;
        try {
          processed = removeBackground(img);
        } catch {
          // Canvas tainted by host CORS settings: fall back to the original image.
          processed = document.createElement("canvas");
          processed.width = img.naturalWidth;
          processed.height = img.naturalHeight;
          processed.getContext("2d")!.drawImage(img, 0, 0);
        }
        jewelryCache.set(url, processed);
        if (cancelled) return;
        jewelryImg.current = processed;
        setAssetsVersion((v) => v + 1);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this jewellery image.");
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Quota check whenever a photo + product pair is ready.
  useEffect(() => {
    if (!visitor || !photo || !selected || allowedSkus.has(selected.sku_id)) return;
    let cancelled = false;
    setCheckingQuota(true);
    setQuotaBlocked(false);
    consumeTryon(selected.sku_id).then((result) => {
      if (cancelled) return;
      setCheckingQuota(false);
      if (result.allowed) {
        setAllowedSkus((prev) => new Set(prev).add(selected.sku_id));
      } else if (result.reason === "QUOTA_EXCEEDED") {
        setQuotaBlocked(true);
      } else if (result.reason === "NOT_REGISTERED" || result.reason === "CONSENT_REQUIRED") {
        requestRegistration();
      } else {
        setError("We couldn't start this try-on. Please try again.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visitor, photo, selected, allowedSkus, consumeTryon, requestRegistration]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const base = photoImg.current;
    if (!canvas || !base) return;
    // Resizing reallocates the canvas buffer, so only do it when the photo changes.
    if (canvas.width !== base.naturalWidth || canvas.height !== base.naturalHeight) {
      canvas.width = base.naturalWidth;
      canvas.height = base.naturalHeight;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(base, 0, 0);
    const jewel = jewelryImg.current;
    if (!jewel || !selected || !overlayActive) return;
    const w = canvas.width * DEFAULT_PLACEMENT[selected.category].width * transform.scale;
    const h = w * (jewel.height / jewel.width);
    ctx.save();
    ctx.translate(transform.x * canvas.width, transform.y * canvas.height);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = w * 0.02;
    ctx.shadowOffsetY = w * 0.01;
    ctx.drawImage(jewel, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [selected, transform, overlayActive]);

  useEffect(draw, [draw, assetsVersion]);

  // Mouse-wheel zoom (non-passive so the page doesn't scroll).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setTransform((t) => ({ ...t, scale: clamp(t.scale * (e.deltaY < 0 ? 1.05 : 0.95), 0.2, 3) }));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [photo]);

  function toCanvasRatio(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!overlayActive) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, toCanvasRatio(e));
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      gesture.current = {
        dist: Math.hypot(b.x - a.x, b.y - a.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        scale: transform.scale,
        rotation: transform.rotation,
      };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = toCanvasRatio(e);
    pointers.current.set(e.pointerId, next);
    if (pointers.current.size === 1) {
      setTransform((t) => ({
        ...t,
        x: clamp(t.x + next.x - prev.x, 0, 1),
        y: clamp(t.y + next.y - prev.y, 0, 1),
      }));
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = Array.from(pointers.current.values());
      const g = gesture.current;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      setTransform((t) => ({
        ...t,
        scale: clamp((g.scale * dist) / g.dist, 0.2, 3),
        rotation: normalizeAngle(g.rotation + ((angle - g.angle) * 180) / Math.PI),
      }));
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  }

  async function onPhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    setAiResult(null);
    setShowAi(false);
    savePhoto(await fileToDataUrl(file));
  }

  function selectProduct(product: Product) {
    setSelected(product);
    setTransform(defaultTransform(product));
    setQuotaBlocked(false);
    setAiResult(null);
    setShowAi(false);
    setError(null);
  }

  function rasterizeJewelry(): string | null {
    const c = jewelryImg.current;
    if (!c) return null;
    try {
      return c.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  async function aiBlend() {
    if (!photo || !selected) return;
    setBlending(true);
    setError(null);
    try {
      const res = await fetch("/api/tryon/blend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, sku: selected.sku_id, overlay: rasterizeJewelry() }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.reason === "QUOTA_EXCEEDED") setQuotaBlocked(true);
        throw new Error(json.reason === "QUOTA_EXCEEDED" ? QUOTA_EXCEEDED_MESSAGE : json.error);
      }
      setAiResult(json.image);
      setShowAi(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI blend failed.");
    } finally {
      setBlending(false);
    }
  }

  function downloadComposite() {
    const name = `madras-sparkle-${selected?.sku_id ?? "try-on"}.jpg`;
    if (showAi && aiResult) return downloadDataUrl(aiResult, name.replace(".jpg", "-ai.png"));
    try {
      const url = canvasRef.current?.toDataURL("image/jpeg", 0.92);
      if (url) downloadDataUrl(url, name);
    } catch {
      setError("This jewellery image cannot be exported due to its hosting settings.");
    }
  }

  function deletePhoto() {
    clearPhoto();
    photoImg.current = null;
    setAiResult(null);
    setShowAi(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  if (!ready) {
    return <div className="card flex h-96 items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  if (!visitor) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <UserPlus className="h-10 w-10 text-gold" />
        <h2 className="font-heading text-2xl text-neutral-100">Register to Start Your Try-On</h2>
        <p className="max-w-md text-sm text-neutral-400">
          A quick one-time registration with your consent lets you try up to {maxTryons} designs virtually.
        </p>
        <button className="btn-gold" onClick={() => requestRegistration()}>
          <UserPlus className="h-4 w-4" /> Register Now
        </button>
      </div>
    );
  }

  const remaining = Math.max(0, maxTryons - visitor.tryonCount);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="card relative flex min-h-[420px] items-center justify-center overflow-hidden p-2">
          {!photo ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center sm:p-12">
              <ImagePlus className="h-12 w-12 text-gold" />
              <span className="font-heading text-xl text-neutral-100">Add Your Photo</span>
              <span className="text-sm text-neutral-400">Front-facing, good lighting, neck and ears visible</span>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <label className="btn-gold touch-only cursor-pointer">
                  <Camera className="h-4 w-4" /> Take Photo
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => onPhotoSelected(e.target.files?.[0])}
                  />
                </label>
                <label className="btn-gold cursor-pointer">
                  <ImagePlus className="h-4 w-4" /> Upload Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => onPhotoSelected(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`max-h-[70vh] w-auto max-w-full touch-none rounded-xl ${showAi ? "hidden" : ""} ${overlayActive ? "cursor-move" : ""}`}
              />
              {showAi && aiResult && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={aiResult} alt="AI blended try-on" className="max-h-[70vh] rounded-xl" />
              )}
              {(checkingQuota || blending) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <LoaderCircle className="h-8 w-8 animate-spin text-gold" />
                  <p className="text-sm text-neutral-200">{blending ? "Creating your photorealistic blend…" : "Preparing try-on…"}</p>
                </div>
              )}
            </>
          )}
        </div>

        {photo && aiResult && (
          <div className="inline-flex rounded-full border border-white/10 p-1 text-sm">
            <button onClick={() => setShowAi(false)} className={`rounded-full px-4 py-1.5 ${!showAi ? "bg-gold text-royal" : "text-neutral-400"}`}>Manual Overlay</button>
            <button onClick={() => setShowAi(true)} className={`rounded-full px-4 py-1.5 ${showAi ? "bg-gold text-royal" : "text-neutral-400"}`}>AI Blend</button>
          </div>
        )}

        {quotaBlocked && (
          <div className="card flex flex-col gap-3 border-gold/40 p-5 sm:flex-row sm:items-center">
            <CircleAlert className="h-6 w-6 shrink-0 text-gold" />
            <p className="flex-1 text-sm text-neutral-200">{QUOTA_EXCEEDED_MESSAGE}</p>
            <EnquireButton product={selected} className="btn-gold" label="Request Home Appointment" />
          </div>
        )}
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <PhotoPrivacyControls disabled={!photo} onDownload={downloadComposite} onDelete={deletePhoto} />
      </div>

      <aside className="space-y-4">
        <div className="card p-4 text-sm">
          <p className="text-neutral-300">
            Hi <span className="text-gold">{visitor.fullName.split(" ")[0]}</span>, you have{" "}
            <span className="font-semibold text-gold">{remaining}</span> of {maxTryons} free try-ons left.
          </p>
        </div>

        <div className="card p-4">
          <p className="label">Choose a Design</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {[{ value: "ALL", label: "All" }, ...CATEGORIES].map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full border px-3 py-1 text-xs ${category === c.value ? "border-gold text-gold" : "border-white/10 text-neutral-400"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {visibleProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProduct(p)}
                title={`${p.title} (${p.sku_id})`}
                className={`overflow-hidden rounded-lg border-2 ${selected?.id === p.id ? "border-gold" : "border-transparent hover:border-gold/40"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.featured_image_url} alt={p.title} loading="lazy" decoding="async" className="aspect-square w-full object-cover" />
              </button>
            ))}
          </div>
          {selected && (
            <p className="mt-3 text-sm text-neutral-200">
              {selected.title} <span className="font-mono text-xs text-gold">{selected.sku_id}</span>
            </p>
          )}
        </div>

        <div className={`card space-y-4 p-4 ${overlayActive && !showAi ? "" : "pointer-events-none opacity-50"}`}>
          <p className="label flex items-center gap-2"><Move className="h-3.5 w-3.5" /> Manual Controls</p>
          <p className="text-xs text-neutral-500">Drag to move, pinch or scroll to resize, two-finger twist to rotate.</p>
          <Slider label="Scale" min={0.2} max={3} step={0.01} value={transform.scale} display={`${Math.round(transform.scale * 100)}%`}
            onChange={(v) => setTransform((t) => ({ ...t, scale: v }))} />
          <Slider label="Rotation" min={-180} max={180} step={1} value={transform.rotation} display={`${Math.round(transform.rotation)}°`}
            onChange={(v) => setTransform((t) => ({ ...t, rotation: v }))} />
          <Slider label="Vertical Position" min={0} max={1} step={0.001} value={transform.y} display={`${Math.round(transform.y * 100)}%`}
            onChange={(v) => setTransform((t) => ({ ...t, y: v }))} />
          <button className="btn-outline w-full" onClick={() => setTransform(defaultTransform(selected))}>
            <RotateCw className="h-4 w-4" /> Reset Position
          </button>
        </div>

        <button className="btn-gold w-full py-3" disabled={!overlayActive || blending} onClick={aiBlend}>
          {blending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
          AI Photorealistic Blend
        </button>
        <p className="flex items-start gap-2 text-xs text-neutral-500">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          Powered by Google Gemini. Your photo is sent securely for this one request and is not stored.
        </p>
      </aside>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs text-neutral-400">
      <span className="flex justify-between"><span>{label}</span><span className="text-gold">{display}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[#D4AF37]" />
    </label>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function normalizeAngle(deg: number) {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}
