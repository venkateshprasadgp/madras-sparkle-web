import type { Product } from "./types";

export interface AppointmentDetails {
  name: string;
  locality: string;
  preferredDate?: string;
  preferredSlot?: string;
}

export function buildWhatsAppLink(number: string, product: Pick<Product, "title" | "sku_id"> | null, d: AppointmentDetails) {
  const lines = [
    "Hello Madras Sparkle,",
    "",
    product
      ? `I'm interested in *${product.title}* (SKU: ${product.sku_id}).`
      : "I'd like to explore your collection.",
    `Name: ${d.name}`,
    `Locality: ${d.locality}`,
    `Request: Private home appointment${d.preferredDate ? ` on ${d.preferredDate}` : ""}${d.preferredSlot ? ` (${d.preferredSlot})` : ""}.`,
    "",
    "Please confirm availability. Thank you!",
  ];
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`;
}
