"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";

export async function deleteMedia(formData: FormData) {
  const { supabase } = await requireStaff();
  const path = String(formData.get("path"));
  const { error } = await supabase.storage.from("media").remove([path]);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/media");
}
