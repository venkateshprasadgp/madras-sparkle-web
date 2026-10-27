import type { Banner, Product, SystemSettings } from "./types";

const now = new Date().toISOString();

function demo(
  sku_id: string,
  title: string,
  category: Product["category"],
  asset: string,
  jewelry_type: string,
  indicative_price: number | null,
  description: string,
  is_featured = true,
): Product {
  return {
    id: sku_id,
    sku_id,
    title,
    category,
    jewelry_type,
    description,
    indicative_price,
    show_indicative_price: indicative_price !== null,
    featured_image_url: `/demo/${asset}-card.svg`,
    transparent_png_url: `/demo/${asset}.svg`,
    video_url: null,
    is_featured,
    is_published: true,
    created_at: now,
    updated_at: now,
  };
}

export const DEMO_PRODUCTS: Product[] = [
  demo("MS-NK-916-001", "Lakshmi Kasu Necklace", "NECKLACE", "necklace", "Gold 22K BIS 916", 285000,
    "Temple-inspired coin necklace with a ruby drop, handcrafted in 22K hallmarked gold."),
  demo("MS-HR-916-002", "Mylapore Triple-Layer Haram", "HARAM", "haram", "Gold 22K BIS 916", null,
    "Grand bridal haram with emerald, diamond and gold bead layers. Price on consultation."),
  demo("MS-BG-916-003", "Kapaleeshwarar Bangle Set", "BANGLES_BRACELET", "bangles", "Gold 22K BIS 916", 168000,
    "A trio of hand-finished bangles studded with rubies."),
  demo("MS-ER-ND-004", "Besant Nagar Diamond Jhumkas", "EARRINGS_JUMMIKI", "earrings", "Natural Diamond", 124000,
    "Classic jhumkas finished with natural diamond accents."),
  demo("MS-PD-LG-005", "Adyar Solitaire Pendant", "PENDANT", "pendant", "Lab-Grown Diamond", 58000,
    "Kite-cut lab-grown diamond pendant on a fine gold chain."),
  demo("MS-RG-LG-006", "Marina Solitaire Ring", "RINGS", "ring", "Lab-Grown Diamond", 46000,
    "Modern solitaire ring with a brilliant lab-grown diamond.", false),
  demo("MS-NP-ND-007", "Mandaveli Flower Nose Pin", "NOSE_PINS", "nosepin", "Natural Diamond", 18500,
    "Seven-stone floral nose pin with a ruby centre.", false),
];

export const DEMO_BANNERS: Banner[] = [];

export const DEMO_SETTINGS: SystemSettings = {
  id: 1,
  max_tryon_per_user: 3,
  whatsapp_business_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "919876543210",
  updated_at: now,
};
