"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/constants";

export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireStaff(MANAGER_ROLES);
  const max = Number(formData.get("max_tryon_per_user"));
  const whatsapp = String(formData.get("whatsapp_business_number") ?? "").replace(/\D/g, "");
  if (!Number.isInteger(max) || max < 0 || max > 1000) return { error: "Quota must be a whole number between 0 and 1000." };
  if (whatsapp.length < 10 || whatsapp.length > 15) return { error: "Enter the WhatsApp number in international format, e.g. 919876543210." };

  const { error } = await supabase
    .from("system_settings")
    .update({ max_tryon_per_user: max, whatsapp_business_number: whatsapp })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
