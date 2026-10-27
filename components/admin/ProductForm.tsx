"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { CATEGORIES, JEWELRY_TYPES } from "@/lib/constants";
import type { Product } from "@/lib/types";
import MediaDropzone from "./MediaDropzone";
import { saveProduct, type ProductFormState } from "@/app/admin/(cms)/products/actions";

function Submit({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn-gold" disabled={pending}>
      {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {editing ? "Save Changes" : "Create Product"}
    </button>
  );
}

export default function ProductForm({ product }: { product?: Product }) {
  const [state, action] = useFormState<ProductFormState, FormData>(saveProduct, {});
  const [featured, setFeatured] = useState(product?.featured_image_url ?? "");
  const [png, setPng] = useState(product?.transparent_png_url ?? "");
  const [video, setVideo] = useState(product?.video_url ?? "");
  const [showPrice, setShowPrice] = useState(product?.show_indicative_price ?? true);

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="show_indicative_price" value={String(showPrice)} />

      <div className="card grid gap-5 p-6 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="sku_id">Alphanumeric SKU ID <span className="text-gold">*</span></label>
          <input
            id="sku_id"
            name="sku_id"
            className="input font-mono uppercase"
            placeholder="MS-NK-916-001"
            defaultValue={product?.sku_id}
            pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*"
            title="Alphanumeric segments separated by hyphens, e.g. MS-NK-916-001"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="title">Title <span className="text-gold">*</span></label>
          <input id="title" name="title" className="input" defaultValue={product?.title} required />
        </div>
        <div>
          <label className="label" htmlFor="category">Category <span className="text-gold">*</span></label>
          <select id="category" name="category" className="input" defaultValue={product?.category ?? ""} required>
            <option value="" disabled>Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="jewelry_type">Jewelry Type</label>
          <select id="jewelry_type" name="jewelry_type" className="input" defaultValue={product?.jewelry_type ?? JEWELRY_TYPES[0]}>
            {JEWELRY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} className="input" defaultValue={product?.description ?? ""} />
        </div>
        <div>
          <label className="label" htmlFor="indicative_price">Indicative Price (₹)</label>
          <input
            id="indicative_price"
            name="indicative_price"
            type="number"
            min="0"
            step="0.01"
            className="input"
            defaultValue={product?.indicative_price ?? ""}
          />
        </div>
        <div>
          <span className="label">Price Display</span>
          <div className="inline-flex rounded-full border border-white/10 p-1">
            <button
              type="button"
              onClick={() => setShowPrice(true)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ${showPrice ? "bg-gold text-royal" : "text-neutral-400"}`}
            >
              <Eye className="h-4 w-4" /> Show Indicative Price
            </button>
            <button
              type="button"
              onClick={() => setShowPrice(false)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ${!showPrice ? "bg-gold text-royal" : "text-neutral-400"}`}
            >
              <EyeOff className="h-4 w-4" /> Hide Price
            </button>
          </div>
        </div>
      </div>

      <div className="card grid gap-5 p-6 md:grid-cols-3">
        <MediaDropzone
          name="featured_image_url"
          label="Featured Image"
          folder="products"
          accept={["image/jpeg", "image/png", "image/webp"]}
          value={featured}
          onChange={setFeatured}
          required
        />
        <MediaDropzone
          name="transparent_png_url"
          label="Transparent Try-On PNG"
          folder="tryon"
          accept={["image/png", "image/webp"]}
          value={png}
          onChange={setPng}
          required
          hint="PNG/WEBP with alpha cut-out"
        />
        <MediaDropzone
          name="video_url"
          label="Product Video"
          folder="videos"
          accept={["video/mp4"]}
          value={video}
          onChange={setVideo}
          hint="MP4 (optional)"
        />
      </div>

      <div className="card flex flex-wrap gap-6 p-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_published" defaultChecked={product?.is_published ?? true} className="accent-[#D4AF37]" />
          Published on website
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="accent-[#D4AF37]" />
          Featured on homepage
        </label>
      </div>

      {state.error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
      <Submit editing={Boolean(product)} />
    </form>
  );
}
