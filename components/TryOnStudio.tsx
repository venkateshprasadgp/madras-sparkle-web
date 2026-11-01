"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, CircleAlert, ImagePlus, LoaderCircle, RotateCw, Sparkles, UserPlus } from "lucide-react";
import type { Product } from "@/lib/types";
import { CATEGORIES, QUOTA_EXCEEDED_MESSAGE } from "@/lib/constants";
import { downloadDataUrl, fileToDataUrl, loadImage } from "@/lib/photo";
import { removeBackground } from "@/lib/removeBackground";
import { usePhotoBuffer } from "@/lib/usePhotoBuffer";
import { useVisitor } from "./VisitorProvider";
import PhotoPrivacyControls from "./PhotoPrivacyControls";
import EnquireButton from "./EnquireButton";

type JewelryState = "loading" | "ready" | "failed";

// Background removal is CPU-heavy; keep each processed piece so re-selecting it is instant.
const jewelryCache = new Map<string, string | null>();

async function prepareJewelry(url: string): Promise<string | null> {
  if (jewelryCache.has(url)) return jewelryCache.get(url) ?? null;
  const img = await loadImage(url, true);
  let dataUrl: string | null;
  try {
    dataUrl = removeBackground(img).toDataURL("image/png");
  } catch {
    // Canvas tainted by host CORS settings: the server fetches the asset itself.
    dataUrl = null;
  }
  jewelryCache.set(url, dataUrl);
  return dataUrl;
}

export default function TryOnStudio({ products }: { products: Product[] }) {
  const initialSku = useSearchParams().get("sku") ?? undefined;
  const { ready, visitor, maxTryons, requestRegistration, consumeTryon } = useVisitor();
  const { photo, save: savePhoto, clear: clearPhoto } = usePhotoBuffer();

  const [category, setCategory] = useState<string>("ALL");
  const [selected, setSelected] = useState<Product | null>(
    () => products.find((p) => p.sku_id === initialSku) ?? null,
  );
  const [allowedSkus, setAllowedSkus] = useState<Set<string>>(new Set());
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jewelry, setJewelry] = useState<{ sku: string; state: JewelryState; overlay: string | null } | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [blendingSku, setBlendingSku] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const attempted = useRef<Set<string>>(new Set());

  const visibleProducts = useMemo(
    () => (category === "ALL" ? products : products.filter((p) => p.category === category)),
    [products, category],
  );
  const sku = selected?.sku_id ?? null;
  const result = sku ? results[sku] : undefined;
  const allowed = Boolean(sku && allowedSkus.has(sku));
  const jewelryReady = Boolean(sku && jewelry?.sku === sku && jewelry.state !== "loading");
  const blending = Boolean(sku && blendingSku === sku);
  const failed = Boolean(sku && photo && allowed && jewelryReady && !result && !blendingSku && attempted.current.has(sku));

  // Prepare the selected jewellery asset (background removed) to send alongside the photo.
  useEffect(() => {
    if (!selected) return;
    const { sku_id, transparent_png_url } = selected;
    setJewelry({ sku: sku_id, state: "loading", overlay: null });
    let cancelled = false;
    prepareJewelry(transparent_png_url)
      .then((overlay) => !cancelled && setJewelry({ sku: sku_id, state: "ready", overlay }))
      .catch(() => !cancelled && setJewelry({ sku: sku_id, state: "failed", overlay: null }));
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
    consumeTryon(selected.sku_id).then((res) => {
      if (cancelled) return;
      setCheckingQuota(false);
      if (res.allowed) {
        setAllowedSkus((prev) => new Set(prev).add(selected.sku_id));
      } else if (res.reason === "QUOTA_EXCEEDED") {
        setQuotaBlocked(true);
      } else if (res.reason === "NOT_REGISTERED" || res.reason === "CONSENT_REQUIRED") {
        requestRegistration();
      } else {
        setError("We couldn't start this try-on. Please try again.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visitor, photo, selected, allowedSkus, consumeTryon, requestRegistration]);

  // Automatically fit the selected piece onto the photo as soon as everything is ready.
  useEffect(() => {
    if (!photo || !sku || !allowed || !jewelryReady || result || blendingSku || attempted.current.has(sku)) return;
    attempted.current.add(sku);
    const overlay = jewelry?.sku === sku ? jewelry.overlay : null;
    setBlendingSku(sku);
    setError(null);
    fetch("/api/tryon/blend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo, sku, overlay }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (json.reason === "QUOTA_EXCEEDED") setQuotaBlocked(true);
          throw new Error(json.reason === "QUOTA_EXCEEDED" ? QUOTA_EXCEEDED_MESSAGE : json.error || "AI try-on failed.");
        }
        setResults((prev) => ({ ...prev, [sku]: json.image }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "AI try-on failed."))
      .finally(() => setBlendingSku(null));
  }, [photo, sku, allowed, jewelryReady, jewelry, result, blendingSku, retryCount]);

  function resetResults() {
    attempted.current.clear();
    setResults({});
  }

  async function onPhotoSelected(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    setError(null);
    resetResults();
    savePhoto(await fileToDataUrl(file));
  }

  function selectProduct(product: Product) {
    setSelected(product);
    setQuotaBlocked(false);
    setError(null);
  }

  function retry() {
    if (!sku) return;
    attempted.current.delete(sku);
    setError(null);
    setRetryCount((n) => n + 1);
  }

  function downloadResult() {
    if (result) downloadDataUrl(result, `madras-sparkle-${sku ?? "try-on"}.png`);
  }

  function deletePhoto() {
    clearPhoto();
    resetResults();
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
  const busy = Boolean(photo && selected && !quotaBlocked && (checkingQuota || blending || (allowed && !jewelryReady)));

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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result ?? photo}
                alt={result ? `You wearing ${selected?.title ?? "the selected design"}` : "Your photo"}
                className="max-h-[70vh] w-auto max-w-full rounded-xl"
              />
              {busy && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <LoaderCircle className="h-8 w-8 animate-spin text-gold" />
                  <p className="text-sm text-neutral-200">
                    {blending ? "Fitting the jewellery and creating your photo…" : "Preparing try-on…"}
                  </p>
                </div>
              )}
              {!selected && (
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-neutral-100">
                  Choose a design to see it on you
                </p>
              )}
            </>
          )}
        </div>

        {quotaBlocked && (
          <div className="card flex flex-col gap-3 border-gold/40 p-5 sm:flex-row sm:items-center">
            <CircleAlert className="h-6 w-6 shrink-0 text-gold" />
            <p className="flex-1 text-sm text-neutral-200">{QUOTA_EXCEEDED_MESSAGE}</p>
            <EnquireButton product={selected} className="btn-gold" label="Request Home Appointment" />
          </div>
        )}
        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            <p className="flex-1">{error}</p>
            {failed && !quotaBlocked && (
              <button className="btn-outline" onClick={retry}>
                <RotateCw className="h-4 w-4" /> Try Again
              </button>
            )}
          </div>
        )}

        <PhotoPrivacyControls
          disabled={!photo}
          downloadDisabled={!result}
          onDownload={downloadResult}
          onDelete={deletePhoto}
        />
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
          <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {visibleProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProduct(p)}
                disabled={blending}
                title={`${p.title} (${p.sku_id})`}
                className={`overflow-hidden rounded-lg border-2 disabled:cursor-wait ${selected?.id === p.id ? "border-gold" : "border-transparent hover:border-gold/40"}`}
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

        <p className="flex items-start gap-2 text-xs text-neutral-500">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          Our AI automatically fits the selected piece onto your photo. Your photo is sent securely for this one
          request and is not stored.
        </p>
      </aside>
    </div>
  );
}
