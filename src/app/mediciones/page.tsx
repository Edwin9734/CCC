import { AppShell } from "@/components/app-shell";
import { MeasurementsManager } from "@/components/measurements/measurements-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { buildContacts, type ContactsInfo } from "@/lib/contacts";

export default async function MeasurementsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let contacts: ContactsInfo | null = null;

  if (data.user) {
    const { profile } = await loadProfileForShell(supabase);
    contacts = buildContacts(profile);
  }

  return (
    <AppShell
      title="Mediciones"
      description="Captura manual de HDL, LDL y triglicéridos con validación y cálculo de rangos."
      userEmail={data.user?.email ?? null}
    >
      <MeasurementsManager contacts={contacts} />
    </AppShell>
  );
}