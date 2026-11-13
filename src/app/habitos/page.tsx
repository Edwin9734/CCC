import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { HabitsManager } from "@/components/habits/habits-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildContacts, type ContactsInfo } from "@/lib/contacts";
import { minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildAdjustedPlan, loadAdjustmentData } from "@/lib/plan-adjustment";
import { HABIT_TABS, normalizeTab } from "@/lib/section-tabs";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";
import type { ExerciseProfile } from "@/lib/exercise-recommendations";
import { CONDITIONS, splitConditions } from "@/lib/health-conditions";
import { getLatestByMetric } from "@/lib/plan";

export default async function HabitosPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, HABIT_TABS, "medicamentos");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let medications: MedicationWithSchedules[] = [];
  let activityGoalMinutes: number | undefined;
  let waterNotice: string | null = null;
  let contacts: ContactsInfo | null = null;
  let exerciseProfile: ExerciseProfile | null = null;

  if (data.user) {
    const today = todayInAppTimeZone();
    const nowMinutes = minutesNowInAppTimeZone();

    const loaded = await loadAdjustmentData(supabase, data.user.id, today);
    medications = loaded.medications;

    // La meta de actividad se ajusta según tu semana anterior, y el agua según tus antecedentes (ver Mi plan).
    const { adjustment, extras } = buildAdjustedPlan(loaded, {
      blockedIds: new Set<string>(),
      today,
      nowMinutes
    });
    activityGoalMinutes = adjustment.activity.minutes;
    waterNotice = extras.liquidNotice;
    contacts = buildContacts(loaded.profile);

    // Perfil para las rutinas recomendadas: edad, sexo, peso, enfermedades y últimos valores.
    const latest = getLatestByMetric(loaded.measurements.filter((row) => row.measured_at <= today));
    const { checked } = splitConditions(loaded.conditionNames);
    const marked = CONDITIONS.filter((condition) => checked[condition.key]);
    const birth = loaded.profile?.birth_date;
    let age: number | null = null;
    if (birth) {
      const [by, bm, bd] = birth.split("-").map(Number);
      const [ty, tm, td] = today.split("-").map(Number);
      age = ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
    }
    exerciseProfile = {
      age,
      sex: loaded.profile?.sex ?? null,
      bmi: extras.bmi?.value ?? null,
      conditions: marked.map((condition) => condition.key),
      conditionLabels: marked.map((condition) => condition.label),
      ldl: latest.LDL?.status ?? null,
      tg: latest.TRIGLYCERIDES?.status ?? null,
      hdl: latest.HDL?.status ?? null,
      critical: Object.values(latest).some((row) => row?.status === "CRITICAL"),
      goalMinutes: adjustment.activity.minutes
    };
  }

  return (
    <AppShell
      title="Hábitos"
      description="Registra tus medicamentos, el agua, el sueño y la actividad física, y mira cómo va tu semana."
      userEmail={data.user?.email ?? null}
    >
      {data.user ? (
        <HabitsManager
          medications={medications}
          activityGoalMinutes={activityGoalMinutes}
          waterNotice={waterNotice}
          contacts={contacts}
          initialTab={initialTab}
          exerciseProfile={exerciseProfile}
        />
      ) : (
        <SectionCard title="Inicia sesión" description="Necesitas una sesión activa para usar esta sección.">
          <Link
            href="/login"
            className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft"
          >
            Ir a iniciar sesión
          </Link>
        </SectionCard>
      )}
    </AppShell>
  );
}