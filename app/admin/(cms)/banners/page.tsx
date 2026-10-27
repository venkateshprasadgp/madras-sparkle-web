import { Trash2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import type { Banner } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import BannerForm from "@/components/admin/BannerForm";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteBanner, toggleBanner } from "./actions";

export default async function BannersPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("banners").select("*").order("display_order");
  const banners = (data ?? []) as Banner[];

  return (
    <>
      <PageHeader title="Banners & Promotions" description="Homepage hero banners and promotional material." />
      <BannerForm />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.image_url} alt={b.title} className="aspect-[12/5] w-full object-cover" />
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-neutral-100">{b.title}</p>
                <p className="text-xs text-neutral-500">Order {b.display_order} · {b.target_link ?? "No link"}</p>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="next" value={String(!b.is_active)} />
                  <button className={`rounded-full px-3 py-1 text-xs ${b.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-neutral-500/10 text-neutral-400"}`}>
                    {b.is_active ? "Active" : "Inactive"}
                  </button>
                </form>
                <form action={deleteBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmSubmit message="Delete this banner?" className="rounded-lg p-2 text-neutral-400 hover:text-red-300" aria-label="Delete banner">
                    <Trash2 className="h-4 w-4" />
                  </ConfirmSubmit>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
