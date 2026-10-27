"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import MediaDropzone from "./MediaDropzone";
import { createBanner, type BannerFormState } from "@/app/admin/(cms)/banners/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-gold" disabled={pending}>
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Banner
    </button>
  );
}

export default function BannerForm() {
  const [state, action] = useFormState<BannerFormState, FormData>(createBanner, {});
  const [image, setImage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setImage("");
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="card grid gap-5 p-6 md:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="b-title">Title</label>
          <input id="b-title" name="title" className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="b-link">Target Link</label>
          <input id="b-link" name="target_link" className="input" placeholder="/collections/harams" />
        </div>
        <div>
          <label className="label" htmlFor="b-order">Display Order</label>
          <input id="b-order" name="display_order" type="number" defaultValue={0} className="input" />
        </div>
        {state.error && <p className="text-sm text-red-300">{state.error}</p>}
        <Submit />
      </div>
      <MediaDropzone
        name="image_url"
        label="Banner Image"
        folder="banners"
        accept={["image/jpeg", "image/png", "image/webp"]}
        value={image}
        onChange={setImage}
        required
        hint="Wide image, 1920×800 recommended"
      />
    </form>
  );
}
