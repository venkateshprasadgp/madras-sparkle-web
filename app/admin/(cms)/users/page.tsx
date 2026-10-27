import { requireStaff } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { Profile } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import { updateRole } from "./actions";

const ROLE_OPTIONS = ["SUPER_ADMINISTRATOR", "ADMINISTRATOR", "CONTENT_EDITOR", "REGISTERED_VISITOR"];

export default async function UsersPage() {
  const { supabase, profile: me } = await requireStaff(MANAGER_ROLES);
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500);
  const profiles = (data ?? []) as Profile[];
  const canEdit = me.role === "SUPER_ADMINISTRATOR";

  return (
    <>
      <PageHeader title="Users & Roles" description="Registered visitors, try-on usage and CMS role assignments." />
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Area</th>
              <th className="p-4">Try-ons</th>
              <th className="p-4">Registered</th>
              <th className="p-4">Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0">
                <td className="p-4 text-neutral-100">{p.full_name}</td>
                <td className="p-4 font-mono text-neutral-300">{p.phone_number}</td>
                <td className="p-4 text-neutral-300">{p.city_area}</td>
                <td className="p-4 text-neutral-300">{p.tryon_count}</td>
                <td className="p-4 text-neutral-500">{formatDateTime(p.created_at)}</td>
                <td className="p-4">
                  {canEdit && p.id !== me.id ? (
                    <form action={updateRole} className="flex gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <select name="role" defaultValue={p.role} className="input py-1 text-xs">
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <button className="btn-outline px-3 py-1 text-xs">Save</button>
                    </form>
                  ) : (
                    <span className="text-xs text-gold">{p.role.replace(/_/g, " ")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
