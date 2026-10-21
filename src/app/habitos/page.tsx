import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { HabitsManager } from "@/components/habits/habits-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildAdjustedPlan, loadAdjustmentData } from "@/lib/plan-adjustment";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";

export default async function HabitosPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let medications: MedicationWithSchedules[] = [];
  let activityGoalMinutes: number | undefined;

  if (data.user) {
    const today = todayInAppTimeZone();
    const nowMinutes = minutesNowInAppTimeZone();

    const loaded = await loadAdjustmentData(supabase, data.user.id, today);
    medications = loaded.medications;

    // La meta semanal de actividad se ajusta según tu semana anterior (ver Mi plan).
    const { adjustment } = buildAdjustedPlan(loaded, { blockedIds: new Set<string>(), today, nowMinutes });
    activityGoalMinutes = adjustment.activity.minutes;
  }

  return (
    <AppShell
      title="Hábitos"
      description="Registra tus medicamentos, el agua, el sueño y la actividad física, y mira cómo va tu semana."
      userEmail={data.user?.email ?? null}
    >
      {data.user ? (
        <HabitsManager medications={medications} activityGoalMinutes={activityGoalMinutes} />
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