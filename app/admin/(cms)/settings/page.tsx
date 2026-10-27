import { requireStaff } from "@/lib/auth";
import { MANAGER_ROLES } from "@/lib/constants";
import type { SystemSettings } from "@/lib/types";
import PageHeader from "@/components/admin/PageHeader";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const { supabase } = await requireStaff(MANAGER_ROLES);
  const { data } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();
  const settings = (data ?? {
    id: 1,
    max_tryon_per_user: 3,
    whatsapp_business_number: "919876543210",
    updated_at: new Date().toISOString(),
  }) as SystemSettings;

  return (
    <>
      <PageHeader title="Quota & System Settings" description="Control try-on limits and the WhatsApp enquiry number." />
      <SettingsForm settings={settings} />
    </>
  );
}
