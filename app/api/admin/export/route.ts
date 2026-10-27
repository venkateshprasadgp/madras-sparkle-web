import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { MANAGER_ROLES } from "@/lib/constants";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
  if (!profile || !MANAGER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "audit";
  const stamp = new Date().toISOString().slice(0, 10);
  let body: string;
  let filename: string;
  let contentType = "text/csv; charset=utf-8";

  if (type === "products") {
    const { data } = await supabase.from("products").select("*").order("sku_id");
    body = toCsv(data ?? []);
    filename = `madras-sparkle-catalogue-${stamp}.csv`;
  } else if (type === "tryons") {
    const { data } = await supabase.from("tryon_logs").select("*").order("created_at", { ascending: false });
    body = toCsv(data ?? []);
    filename = `madras-sparkle-tryons-${stamp}.csv`;
  } else if (type === "backup") {
    const [products, banners, settings] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("banners").select("*"),
      supabase.from("system_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    body = JSON.stringify(
      {
        app: "madras-sparkle-web",
        version: 1,
        exported_at: new Date().toISOString(),
        products: products.data ?? [],
        banners: banners.data ?? [],
        system_settings: settings.data,
      },
      null,
      2,
    );
    filename = `madras-sparkle-backup-${stamp}.json`;
    contentType = "application/json";
  } else {
    const { data } = await supabase
      .from("audit_logs")
      .select("created_at, actor_id, actor_role, action, details, profiles(full_name)")
      .order("created_at", { ascending: false });
    body = toCsv(
      (data ?? []).map((row) => {
        const { profiles, ...rest } = row as typeof row & { profiles: { full_name: string } | null };
        return { ...rest, actor_name: profiles?.full_name ?? "" };
      }),
      ["created_at", "actor_name", "actor_id", "actor_role", "action", "details"],
    );
    filename = `madras-sparkle-audit-${stamp}.csv`;
  }

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: type === "backup" ? "EXPORT_BACKUP" : `EXPORT_${type.toUpperCase()}_CSV`,
    details: { filename },
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
