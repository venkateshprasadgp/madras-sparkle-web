import Link from "next/link";
import { Crown, Database, Gem, House, Image as ImageIcon, LogOut, Package, Settings, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/constants";
import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: House, managerOnly: false },
  { href: "/admin/products", label: "Products & SKUs", icon: Package, managerOnly: false },
  { href: "/admin/banners", label: "Banners", icon: Crown, managerOnly: false },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon, managerOnly: false },
  { href: "/admin/settings", label: "Quota & Settings", icon: Settings, managerOnly: true },
  { href: "/admin/users", label: "Users & Roles", icon: Users, managerOnly: true },
  { href: "/admin/audit", label: "Audit & Backup", icon: Database, managerOnly: true },
];

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  const isManager = MANAGER_ROLES.includes(profile.role);

  return (
    <div className="flex min-h-screen bg-royal">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-card md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-6 py-5">
          <Gem className="h-5 w-5 text-gold" />
          <span className="font-heading tracking-widest text-gold-gradient">SPARKLE CMS</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.filter((n) => isManager || !n.managerOnly).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-gold"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/5 p-4 text-xs">
          <p className="font-medium text-neutral-200">{profile.full_name}</p>
          <p className="mt-0.5 text-gold">{profile.role.replace(/_/g, " ")}</p>
          <form action={signOut} className="mt-3">
            <button className="flex items-center gap-2 text-neutral-400 hover:text-gold">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex-1 overflow-x-hidden">
        <nav className="flex gap-4 overflow-x-auto border-b border-white/5 bg-card px-4 py-3 text-sm md:hidden">
          {NAV.filter((n) => isManager || !n.managerOnly).map(({ href, label }) => (
            <Link key={href} href={href} className="whitespace-nowrap text-neutral-300 hover:text-gold">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mx-auto max-w-6xl p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
