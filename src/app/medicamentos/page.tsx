import { AppShell } from "@/components/app-shell";
import { MedicationManager } from "@/components/medications/medication-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addDays, minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { getHabitsDataForUser, type IntakeRow } from "@/lib/supabase/habits";
import { getMedications, type MedicationWithSchedules } from "@/lib/supabase/medications";
import { MEDICATION_TABS, normalizeTab } from "@/lib/section-tabs";

export default async function MedicationsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, MEDICATION_TABS, "hoy");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const today = todayInAppTimeZone();

  let medications: MedicationWithSchedules[] = [];
  let intakes: IntakeRow[] = [];

  if (data.user) {
    try {
      medications = await getMedications(supabase);
      intakes = (await getHabitsDataForUser(supabase, data.user.id, addDays(today, -70), today)).intakes;
    } catch (err) {
      console.error("Error loading medications:", err);
    }
  }

  return (
    <AppShell
      title="Medicamentos"
      description="Lo que te toca hoy, tus medicinas y tu constancia."
      userEmail={data.user?.email ?? null}
    >
      <MedicationManager
        initialMedications={medications}
        initialIntakes={intakes}
        initialToday={today}
        initialMinutes={minutesNowInAppTimeZone()}
        initialTab={initialTab}
      />
    </AppShell>
  );
}
