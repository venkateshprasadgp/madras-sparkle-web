"use client";

import { useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import type { Product } from "@/lib/types";
import WhatsAppModal from "./WhatsAppModal";

export default function EnquireButton({
  product,
  className = "btn-outline",
  label = "Enquire on WhatsApp",
  icon = <MessageCircle className="h-4 w-4" />,
}: {
  product: Pick<Product, "title" | "sku_id"> | null;
  className?: string;
  label?: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {icon} {label}
      </button>
      {open && <WhatsAppModal open onClose={() => setOpen(false)} product={product} />}
    </>
  );
}
