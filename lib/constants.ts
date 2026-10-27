import type { JewelryCategory, UserRole } from "./types";

export const CITY_AREAS = [
  "Adyar",
  "Besant Nagar",
  "Velachery",
  "OMR",
  "Mylapore",
  "Mandaveli",
  "RA Puram",
] as const;

export const CATEGORIES: { value: JewelryCategory; label: string; slug: string }[] = [
  { value: "NECKLACE", label: "Necklaces", slug: "necklaces" },
  { value: "HARAM", label: "Harams", slug: "harams" },
  { value: "BANGLES_BRACELET", label: "Bangles & Bracelets", slug: "bangles-bracelets" },
  { value: "EARRINGS_JUMMIKI", label: "Earrings & Jummikis", slug: "earrings-jummikis" },
  { value: "PENDANT", label: "Pendants", slug: "pendants" },
  { value: "RINGS", label: "Rings", slug: "rings" },
  { value: "NOSE_PINS", label: "Nose Pins", slug: "nose-pins" },
];

export const JEWELRY_TYPES = [
  "Gold 22K BIS 916",
  "Gold 18K",
  "Natural Diamond",
  "Lab-Grown Diamond",
  "Silver",
] as const;

export const STAFF_ROLES: UserRole[] = ["SUPER_ADMINISTRATOR", "ADMINISTRATOR", "CONTENT_EDITOR"];
export const MANAGER_ROLES: UserRole[] = ["SUPER_ADMINISTRATOR", "ADMINISTRATOR"];

export const SKU_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export const DEFAULT_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "919876543210";

export const DEFAULT_MAX_TRYON = 3;

export const QUOTA_EXCEEDED_MESSAGE =
  "You have utilized your free try-on quota. Please request a private home appointment to view more designs!";

export function categoryLabel(value: JewelryCategory) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function categoryFromSlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
