import Link from "next/link";
import { BadgeCheck, Gem, House, Sparkles } from "lucide-react";
import { getBanners, getProducts } from "@/lib/data";
import { CATEGORIES, CITY_AREAS } from "@/lib/constants";
import ProductCard from "@/components/ProductCard";
import MediaGallery, { type GalleryItem } from "@/components/MediaGallery";
import EnquireButton from "@/components/EnquireButton";

export const revalidate = 60;

const CATEGORY_ICONS: Record<string, string> = {
  NECKLACE: "/demo/necklace.svg",
  HARAM: "/demo/haram.svg",
  BANGLES_BRACELET: "/demo/bangles.svg",
  EARRINGS_JUMMIKI: "/demo/earrings.svg",
  PENDANT: "/demo/pendant.svg",
  RINGS: "/demo/ring.svg",
  NOSE_PINS: "/demo/nosepin.svg",
};

const OFFERS = [
  { tag: "HOME APPOINTMENT", big: "FREE", small: "across 7 South Chennai localities" },
  { tag: "VIRTUAL TRY-ON", big: "AI", small: "see any design on your own photo" },
  { tag: "GOLD PURITY", big: "BIS 916", small: "hallmarked on every gold piece" },
];

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center">
      <h2 className="font-heading text-3xl text-gold-gradient md:text-4xl">{children}</h2>
      {sub && <p className="mt-2 text-sm text-neutral-400">{sub}</p>}
      <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-gold">
        <span className="h-px w-12 bg-gold/60" />
        <Gem className="h-4 w-4" />
        <span className="h-px w-12 bg-gold/60" />
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [banners, featured, all] = await Promise.all([
    getBanners(),
    getProducts({ featured: true }),
    getProducts(),
  ]);
  const hero = banners[0];
  const heroImage = hero?.image_url ?? featured[0]?.featured_image_url ?? all[0]?.featured_image_url ?? "/demo/haram.svg";

  const gallery: GalleryItem[] = all.slice(0, 9).map((p) =>
    p.video_url
      ? { type: "video", src: p.video_url, poster: p.featured_image_url, caption: `${p.title} · ${p.sku_id}` }
      : { type: "image", src: p.featured_image_url, caption: `${p.title} · ${p.sku_id}` },
  );

  return (
    <>
      {/* Split hero: banner image + festive offers panel */}
      <section className="grid md:grid-cols-[2fr_3fr]">
        <Link href={hero?.target_link ?? "/collections"} className="relative block min-h-[320px] overflow-hidden bg-cream md:min-h-[540px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={hero?.title ?? "Madras Sparkle jewellery"}
            className={`absolute inset-0 h-full w-full ${hero ? "object-cover" : "object-contain p-10"}`}
          />
          <span className="absolute left-4 top-4 flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-[#f5c96a] bg-maroon-deep/90 text-center font-heading text-[10px] leading-tight text-[#f5c96a] shadow-lg">
            <span className="text-lg">916</span>HALLMARK
          </span>
        </Link>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#a3161f] via-[#d2401a] to-[#f08a3c] px-6 py-10 text-[#fff7e6] dark:from-[#3b0a12] dark:via-[#4e1020] dark:to-[#1a1a1a] md:px-12 md:py-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[24px] border-[#ffd27a]/15" />
          <div className="relative flex flex-col items-center text-center">
            <span className="rounded-full border border-[#ffe3a3]/70 px-4 py-1 text-[11px] uppercase tracking-[0.3em]">
              South Chennai&apos;s Home Jeweller
            </span>
            <h1 className="mt-5 max-w-2xl font-heading text-3xl leading-tight text-[#ffe9a8] drop-shadow md:text-5xl">
              {hero?.title ?? "Bespoke Gold & Diamond Jewellery, Brought to Your Home"}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[#fff1dc] md:text-base">
              Natural and lab-grown diamonds, designed for you and presented at private home appointments in{" "}
              {CITY_AREAS.slice(0, -1).join(", ")} and {CITY_AREAS[CITY_AREAS.length - 1]}.
            </p>

            <div className="mt-8 flex w-full items-center gap-3">
              <span className="h-px flex-1 bg-[#ffe3a3]/60" />
              <span className="rounded-md border border-[#ffe3a3]/80 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-[#ffe9a8]">
                OUR SPARKLING PROMISES
              </span>
              <span className="h-px flex-1 bg-[#ffe3a3]/60" />
            </div>
            <div className="mt-6 grid w-full gap-4 sm:grid-cols-3">
              {OFFERS.map((o) => (
                <div key={o.tag}>
                  <p className="mb-2 text-[11px] font-bold tracking-widest text-[#ffe9a8]">{o.tag}</p>
                  <div className="rounded-xl border-2 border-[#f5c96a] bg-[#fff8ec] px-3 py-3 text-[#7a1420] shadow-md">
                    <p className="font-heading text-2xl font-bold">{o.big}</p>
                    <p className="text-[11px] font-semibold uppercase leading-snug">{o.small}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/try-on" className="inline-flex items-center gap-2 rounded-full bg-[#fff8ec] px-6 py-2.5 text-sm font-semibold text-[#7a1420] shadow-md transition hover:brightness-95">
                <Sparkles className="h-4 w-4" /> Virtual Try-On Studio
              </Link>
              <EnquireButton
                product={null}
                label="Book Home Appointment"
                className="inline-flex items-center gap-2 rounded-full border border-[#fff8ec] px-6 py-2.5 text-sm font-semibold text-[#fff8ec] transition hover:bg-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionTitle sub="Explore our handcrafted collections">Shop by Category</SectionTitle>
        <div className="mt-10 grid grid-cols-3 gap-6 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map((c) => (
            <Link key={c.value} href={`/collections/${c.slug}`} className="group flex flex-col items-center gap-3 text-center">
              <span className="flex aspect-square w-full max-w-[120px] items-center justify-center rounded-full border-2 border-gold/40 bg-cream p-5 shadow-sm transition group-hover:border-maroon group-hover:shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={CATEGORY_ICONS[c.value]} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain transition group-hover:scale-110" />
              </span>
              <span className="text-sm font-medium text-neutral-200 group-hover:text-maroon">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-800 bg-cream">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { icon: House, title: "Private Home Appointments", text: "We bring the collection to your living room." },
            { icon: BadgeCheck, title: "BIS 916 Hallmarked", text: "Certified purity on every gold piece." },
            { icon: Gem, title: "Natural & Lab-Grown", text: "Certified diamonds for every budget." },
            { icon: Sparkles, title: "Virtual Try-On", text: "See each design on yourself before visiting." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-maroon text-royal">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-100">{title}</p>
                <p className="text-xs text-neutral-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionTitle sub="Handpicked pieces from our latest collection">Featured Designs</SectionTitle>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/collections" className="btn-outline">View All Jewellery</Link>
          </div>
        </section>
      )}

      <section className="bg-maroon-deep text-[#fdf3e7] dark:bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row">
          <div>
            <h2 className="font-heading text-2xl text-[#f5c96a] md:text-3xl">See It On You First</h2>
            <p className="mt-2 max-w-xl text-sm text-[#fdf3e7]/85">
              Upload a photo, place any piece by hand, or let our AI blend it photorealistically. Your photo never
              leaves your browser session.
            </p>
          </div>
          <Link href="/try-on" className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-8 py-3 text-sm font-semibold text-[#2a0b0f] shadow-lg">
            <Sparkles className="h-4 w-4" /> Open the Try-On Studio
          </Link>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionTitle sub="Images and videos from our ateliers">Media Gallery</SectionTitle>
          <div className="mt-10">
            <MediaGallery items={gallery} />
          </div>
        </section>
      )}
    </>
  );
}
