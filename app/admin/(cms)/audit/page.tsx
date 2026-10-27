import { Download, FileText } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { AuditLog } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import RestoreForm from "@/components/admin/RestoreForm";

function summarize(log: AuditLog) {
  const d = (log.details ?? {}) as { new?: Record<string, unknown>; old?: Record<string, unknown> } & Record<string, unknown>;
  const row = d.new ?? d.old;
  if (row) {
    const label = (row.sku_id ?? row.title ?? (row.max_tryon_per_user !== undefined ? `Quota ${row.max_tryon_per_user}` : "")) as string;
    if (log.action === "UPDATE_PRICE") {
      return `${label}: ${d.old?.indicative_price ?? "—"} → ${d.new?.indicative_price ?? "—"}`;
    }
    return label;
  }
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join(", ");
}

export default async function AuditPage({ searchParams }: { searchParams: { action?: string } }) {
  const { supabase, profile } = await requireStaff(MANAGER_ROLES);
  let query = supabase
    .from("audit_logs")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (searchParams.action) query = query.eq("action", searchParams.action);
  const { data } = await query;
  const logs = (data ?? []) as AuditLog[];

  return (
    <>
      <PageHeader
        title="Audit Trail & Backup"
        description="Who changed what and when, plus CSV exports and full JSON backups."
        actions={
          <>
            <a href="/api/admin/export?type=audit" className="btn-outline"><FileText className="h-4 w-4" /> Audit CSV</a>
            <a href="/api/admin/export?type=products" className="btn-outline"><FileText className="h-4 w-4" /> Catalogue CSV</a>
            <a href="/api/admin/export?type=tryons" className="btn-outline"><FileText className="h-4 w-4" /> Try-On Log CSV</a>
            <a href="/api/admin/export?type=backup" className="btn-gold"><Download className="h-4 w-4" /> Full Backup (JSON)</a>
          </>
        }
      />

      {profile.role === "SUPER_ADMINISTRATOR" && (
        <div className="card mb-8 p-6">
          <h2 className="font-heading text-lg text-gold">Restore from Backup</h2>
          <p className="mb-4 mt-1 text-sm text-neutral-400">
            Upload a JSON backup exported above. Records are upserted by ID; nothing is deleted.
          </p>
          <RestoreForm />
        </div>
      )}

      <form className="mb-4">
        <input name="action" defaultValue={searchParams.action} placeholder="Filter by action, e.g. UPDATE_PRICE" className="input max-w-sm font-mono uppercase" />
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="p-4">When</th>
              <th className="p-4">Who</th>
              <th className="p-4">Role</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-neutral-500">No activity recorded yet.</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-white/5 last:border-0 align-top">
                <td className="whitespace-nowrap p-4 text-neutral-400">{formatDateTime(log.created_at)}</td>
                <td className="p-4 text-neutral-100">{log.profiles?.full_name ?? "System"}</td>
                <td className="p-4 text-xs text-neutral-400">{log.actor_role.replace(/_/g, " ")}</td>
                <td className="p-4 font-mono text-xs text-gold">{log.action}</td>
                <td className="max-w-md truncate p-4 text-neutral-300" title={summarize(log)}>{summarize(log)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
