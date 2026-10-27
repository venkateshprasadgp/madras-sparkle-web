import Link from "next/link";
import { BadgeCheck, Gem, House, Sparkles } from "lucide-react";
import { getBanners, getProducts } from "@/lib/data";
import { CATEGORIES, CITY_AREAS } from "@/lib/constants";
import ProductCard from "@/components/ProductCard";
import MediaGallery, { type GalleryItem } from "@/components/MediaGallery";
import EnquireButton from "@/components/EnquireButton";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, string> = {
  NECKLACE: "/demo/necklace.svg",
  HARAM: "/demo/haram.svg",
  BANGLES_BRACELET: "/demo/bangles.svg",
  EARRINGS_JUMMIKI: "/demo/earrings.svg",
  PENDANT: "/demo/pendant.svg",
  RINGS: "/demo/ring.svg",
  NOSE_PINS: "/demo/nosepin.svg",
};

export default async function HomePage() {
  const [banners, featured, all] = await Promise.all([
    getBanners(),
    getProducts({ featured: true }),
    getProducts(),
  ]);
  const hero = banners[0];

  const gallery: GalleryItem[] = all.slice(0, 9).map((p) =>
    p.video_url
      ? { type: "video", src: p.video_url, poster: p.featured_image_url, caption: `${p.title} · ${p.sku_id}` }
      : { type: "image", src: p.featured_image_url, caption: `${p.title} · ${p.sku_id}` },
  );

  return (
    <>
      <section className="relative overflow-hidden">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.image_url} alt={hero.title} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.18),transparent_60%)]" />
        )}
        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 md:py-36">
          <p className="rounded-full border border-gold/40 px-4 py-1 text-xs uppercase tracking-[0.3em] text-gold">
            South Chennai&apos;s Home Jeweller
          </p>
          <h1 className="max-w-3xl font-heading text-4xl leading-tight text-neutral-50 md:text-6xl">
            {hero?.title ?? (
              <>
                Bespoke <span className="text-gold-gradient">Gold &amp; Diamond</span> Jewellery, Brought to Your Home
              </>
            )}
          </h1>
          <p className="max-w-2xl text-neutral-300">
            BIS 916 hallmarked gold, certified natural diamonds and lab-grown diamonds, designed for you and
            presented at private home appointments across {CITY_AREAS.slice(0, -1).join(", ")} and{" "}
            {CITY_AREAS[CITY_AREAS.length - 1]}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={hero?.target_link ?? "/try-on"} className="btn-gold">
              <Sparkles className="h-4 w-4" /> {hero?.target_link ? "Explore" : "Virtual Try-On Studio"}
            </Link>
            <EnquireButton product={null} label="Book Home Appointment" />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { icon: House, title: "Private Home Appointments", text: "We bring the collection to your living room." },
            { icon: BadgeCheck, title: "BIS 916 Hallmarked", text: "Certified purity on every gold piece." },
            { icon: Gem, title: "Natural & Lab-Grown", text: "Certified diamonds for every budget." },
            { icon: Sparkles, title: "Virtual Try-On", text: "See each design on yourself before visiting." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon className="h-6 w-6 shrink-0 text-gold" />
              <div>
                <p className="text-sm font-semibold text-neutral-100">{title}</p>
                <p className="text-xs text-neutral-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-heading text-3xl text-gold-gradient">Shop by Category</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/collections/${c.slug}`}
              className="card group flex flex-col items-center gap-3 p-5 text-center transition hover:border-gold/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CATEGORY_ICONS[c.value]} alt="" className="h-16 w-16 object-contain transition group-hover:scale-110" />
              <span className="text-sm text-neutral-200 group-hover:text-gold">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="font-heading text-3xl text-gold-gradient">Featured Designs</h2>
            <Link href="/collections" className="text-sm text-gold hover:underline">View all →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <h2 className="mb-8 font-heading text-3xl text-gold-gradient">Media Gallery</h2>
          <MediaGallery items={gallery} />
        </section>
      )}

      <section className="border-t border-white/5 bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="font-heading text-3xl text-neutral-50">See It On You First</h2>
          <p className="max-w-xl text-neutral-400">
            Upload a photo, place any piece by hand, or let our AI blend it photorealistically.
            Your photo never leaves your browser session.
          </p>
          <Link href="/try-on" className="btn-gold"><Sparkles className="h-4 w-4" /> Open the Try-On Studio</Link>
        </div>
      </section>
    </>
  );
}
