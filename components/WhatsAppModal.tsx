"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { CITY_AREAS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { Product } from "@/lib/types";
import { useVisitor } from "./VisitorProvider";

const SLOTS = ["Morning (10am – 1pm)", "Afternoon (1pm – 4pm)", "Evening (4pm – 8pm)"];

interface Props {
  open: boolean;
  onClose: () => void;
  product: Pick<Product, "title" | "sku_id"> | null;
}

export default function WhatsAppModal({ open, onClose, product }: Props) {
  const { visitor, whatsappNumber } = useVisitor();
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(SLOTS[0]);

  useEffect(() => {
    if (open && visitor) {
      setName((n) => n || visitor.fullName);
      setLocality((l) => l || visitor.cityArea);
    }
  }, [open, visitor]);

  if (!open) return null;

  const valid = name.trim().length >= 2 && locality;
  const href = buildWhatsAppLink(whatsappNumber, product, {
    name: name.trim(),
    locality,
    preferredDate: date ? new Date(date).toLocaleDateString("en-IN", { dateStyle: "medium" }) : undefined,
    preferredSlot: slot,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="card relative w-full max-w-md space-y-5 p-6">
        <button onClick={onClose} className="absolute right-4 top-4 text-neutral-500 hover:text-gold" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div>
          <h2 className="font-heading text-2xl text-gold-gradient">Book a Home Appointment</h2>
          {product && (
            <p className="mt-1 text-sm text-neutral-400">
              {product.title} · <span className="font-mono text-gold">{product.sku_id}</span>
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="wa-name">Your Name</label>
          <input id="wa-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="wa-area">Locality</label>
          <select id="wa-area" className="input" value={locality} onChange={(e) => setLocality(e.target.value)}>
            <option value="" disabled>Select your area</option>
            {CITY_AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="wa-date">Preferred Date</label>
            <input
              id="wa-date"
              type="date"
              className="input [color-scheme:dark]"
              min={new Date().toISOString().slice(0, 10)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="wa-slot">Time Slot</label>
            <select id="wa-slot" className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
              {SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <a
          href={valid ? href : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!valid}
          onClick={(e) => {
            if (!valid) e.preventDefault();
            else onClose();
          }}
          className={`btn-gold w-full ${valid ? "" : "pointer-events-none opacity-50"}`}
        >
          <MessageCircle className="h-4 w-4" /> Continue on WhatsApp
        </a>
      </div>
    </div>
  );
}
