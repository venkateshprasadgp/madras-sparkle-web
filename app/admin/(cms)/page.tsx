import Link from "next/link";
import { Crown, Package, Sparkles, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";

export default async function AdminDashboard({ searchParams }: { searchParams: { denied?: string } }) {
  const { supabase, profile } = await requireStaff();
  const head = { count: "exact" as const, head: true };
  const results = await Promise.all([
    supabase.from("products").select("*", head),
    supabase.from("products").select("*", head).eq("is_published", true),
    supabase.from("banners").select("*", head).eq("is_active", true),
    supabase.from("tryon_logs").select("*", head),
    supabase.from("profiles").select("*", head).eq("role", "REGISTERED_VISITOR"),
  ]);
  const [products, published, banners, tryons, visitors] = results.map((r) => r.count ?? 0);

  const stats = [
    { label: "Products", value: products, sub: `${published} published`, icon: Package, href: "/admin/products" },
    { label: "Active Banners", value: banners, icon: Crown, href: "/admin/banners" },
    { label: "Try-On Sessions", value: tryons, icon: Sparkles },
    { label: "Registered Visitors", value: visitors, icon: Users },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${profile.full_name.split(" ")[0]}`} description="Madras Sparkle content overview" />
      {searchParams.denied && (
        <p className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          Your role ({profile.role.replace(/_/g, " ")}) does not have access to that section.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon, href }) => {
          const body = (
            <div className="card h-full p-5 transition hover:border-gold/30">
              <Icon className="h-5 w-5 text-gold" />
              <p className="mt-4 text-3xl font-semibold text-neutral-100">{value}</p>
              <p className="text-sm text-neutral-400">{label}</p>
              {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
            </div>
          );
          return href ? <Link key={label} href={href}>{body}</Link> : <div key={label}>{body}</div>;
        })}
      </div>
    </>
  );
}
