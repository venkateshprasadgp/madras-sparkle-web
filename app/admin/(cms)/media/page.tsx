import { Trash2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import MediaUploader from "@/components/admin/MediaUploader";
import { deleteMedia } from "./actions";

const FOLDERS = ["products", "tryon", "videos", "banners", "library"];

export default async function MediaPage() {
  const { supabase } = await requireStaff();
  const listings = await Promise.all(
    FOLDERS.map(async (folder) => {
      const { data } = await supabase.storage
        .from("media")
        .list(folder, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      return (data ?? [])
        .filter((f) => f.id)
        .map((f) => {
          const path = `${folder}/${f.name}`;
          return { path, name: f.name, folder, url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl };
        });
    }),
  );
  const files = listings.flat();

  return (
    <>
      <PageHeader title="Media Library" description="All images, transparent try-on PNGs and videos (JPG, PNG, WEBP, MP4)." />
      <MediaUploader />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {files.map((f) => (
          <div key={f.path} className="card group overflow-hidden">
            <div className="flex aspect-square items-center justify-center bg-[repeating-conic-gradient(#222_0_25%,#1a1a1a_0_50%)] bg-[length:16px_16px]">
              {f.name.endsWith(".mp4") ? (
                <video src={f.url} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt={f.name} className="h-full w-full object-contain" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
              <a href={f.url} target="_blank" rel="noreferrer" className="truncate text-xs text-neutral-400 hover:text-gold" title={f.path}>
                {f.path}
              </a>
              <form action={deleteMedia}>
                <input type="hidden" name="path" value={f.path} />
                <ConfirmSubmit message={`Delete ${f.name}? Products using it will show a broken image.`} className="text-neutral-500 hover:text-red-300" aria-label="Delete file">
                  <Trash2 className="h-4 w-4" />
                </ConfirmSubmit>
              </form>
            </div>
          </div>
        ))}
      </div>
      {files.length === 0 && <p className="mt-8 text-center text-sm text-neutral-500">The media library is empty.</p>}
    </>
  );
}
