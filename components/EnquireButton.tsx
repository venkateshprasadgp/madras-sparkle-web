"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Product } from "@/lib/types";
import WhatsAppModal from "./WhatsAppModal";

export default function EnquireButton({
  product,
  className = "btn-outline",
  label = "Enquire on WhatsApp",
}: {
  product: Pick<Product, "title" | "sku_id"> | null;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        <MessageCircle className="h-4 w-4" /> {label}
      </button>
      <WhatsAppModal open={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
}
