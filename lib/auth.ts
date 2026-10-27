import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { STAFF_ROLES } from "./constants";
import type { Profile, UserRole } from "./types";

// Deduped per request so the CMS layout and page share one auth + profile lookup.
const getStaffSession = cache(async () => {
  const supabase = createServerSupabase();
  if (!supabase) redirect("/admin/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) redirect("/admin/login");
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile = data as Profile | null;
  if (!profile || !STAFF_ROLES.includes(profile.role)) redirect("/admin/login?error=unauthorized");
  return { supabase, user, profile };
});

export async function requireStaff(roles: UserRole[] = STAFF_ROLES) {
  const session = await getStaffSession();
  if (!roles.includes(session.profile.role)) redirect("/admin?denied=1");
  return session;
}

export async function logAudit(
  ctx: Awaited<ReturnType<typeof requireStaff>>,
  action: string,
  details: Record<string, unknown> = {},
) {
  await ctx.supabase.from("audit_logs").insert({
    actor_id: ctx.profile.id,
    actor_role: ctx.profile.role,
    action,
    details,
  });
}
