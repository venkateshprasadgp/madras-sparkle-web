"use server";

import { revalidatePath } from "next/cache";
import { logAudit, requireStaff } from "@/lib/auth";
import type { UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["SUPER_ADMINISTRATOR", "ADMINISTRATOR", "CONTENT_EDITOR", "REGISTERED_VISITOR"];

export async function updateRole(formData: FormData) {
  const ctx = await requireStaff(["SUPER_ADMINISTRATOR"]);
  const id = String(formData.get("id"));
  const role = String(formData.get("role")) as UserRole;
  if (!ROLES.includes(role) || id === ctx.profile.id) return;
  const { error } = await ctx.supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(ctx, "UPDATE_USER_ROLE", { profile_id: id, role });
  revalidatePath("/admin/users");
}
