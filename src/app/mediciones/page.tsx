import { AppShell } from "@/components/app-shell";
import { MeasurementsManager } from "@/components/measurements/measurements-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { buildContacts, type ContactsInfo } from "@/lib/contacts";
import { todayInAppTimeZone } from "@/lib/date-utils";
import type { Sex } from "@/lib/profile";
import { MEASUREMENT_TABS, normalizeTab } from "@/lib/section-tabs";

export default async function MeasurementsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, MEASUREMENT_TABS, "registrar");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let contacts: ContactsInfo | null = null;
  let sex: Sex | null = null;
  let measurements: MeasurementWithStatus[] = [];

  if (data.user) {
    const { profile } = await loadProfileForShell(supabase);
    contacts = buildContacts(profile);
    sex = profile?.sex ?? null;

    try {
      measurements = await getMeasurements(supabase, { limit: 500 });
    } catch (err) {
      console.error("Error loading measurements:", err);
    }
  }

  return (
    <AppShell
      title="Mediciones"
      description="Anota tus análisis y mira cómo van tu colesterol y tus triglicéridos."
      userEmail={data.user?.email ?? null}
    >
      <MeasurementsManager
        initialMeasurements={measurements}
        contacts={contacts}
        sex={sex}
        today={todayInAppTimeZone()}
        initialTab={initialTab}
      />
    </AppShell>
  );
}
