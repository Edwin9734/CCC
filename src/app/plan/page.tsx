import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { PlanView } from "@/components/plan/plan-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { addDays, minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildAdjustedPlan, loadAdjustmentData, type AdjustmentData, type PlanAdjustment } from "@/lib/plan-adjustment";
import { PLAN_TABS, normalizeTab } from "@/lib/section-tabs";
import type { ProfileExtras } from "@/lib/plan-profile";
import type { PlanData } from "@/lib/plan";
import type { PlanGoalCheck, PlanGoalRow, PlanMark } from "@/lib/plan-goals";
import { loadPlanGoals } from "@/lib/supabase/plan-goals";

export default async function PlanPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, PLAN_TABS, "metas");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  const today = todayInAppTimeZone();
  let plan: PlanData | null = null;
  let adjustment: PlanAdjustment | null = null;
  let extras: ProfileExtras | null = null;
  let allergyMatches: Record<string, string[]> = {};
  let loaded: AdjustmentData | null = null;
  let goals: PlanGoalRow[] = [];
  let checks: PlanGoalCheck[] = [];
  let marks: PlanMark[] = [];

  if (data.user) {
    const nowMinutes = minutesNowInAppTimeZone();

    loaded = await loadAdjustmentData(supabase, data.user.id, today);
    allergyMatches = findAllergenMatches(loaded.allergies.map((a) => a.allergy_name));
    const blockedIds = new Set(Object.keys(allergyMatches));

    const result = buildAdjustedPlan(loaded, { blockedIds, today, nowMinutes });
    plan = result.plan;
    adjustment = result.adjustment;
    extras = result.extras;

    try {
      ({ goals, checks, marks } = await loadPlanGoals(supabase, data.user.id, addDays(today, -120)));
    } catch (err) {
      console.error("Error loading plan goals:", err);
    }
  }

  return (
    <AppShell
      title="Mi plan"
      description="Tu nivel, tus metas y tu plan, que se ajustan según tu evolución y tu cumplimiento."
      userEmail={data.user?.email ?? null}
    >
      {data.user && plan && adjustment && extras && loaded ? (
        <PlanView
          plan={plan}
          adjustment={adjustment}
          extras={extras}
          allergyMatches={allergyMatches}
          initialTab={initialTab}
          today={today}
          measurements={loaded.measurements}
          initialActivities={loaded.activities}
          initialGoals={goals}
          initialChecks={checks}
          initialMarks={marks}
        />
      ) : (
        <SectionCard title="Inicia sesión" description="Necesitas una sesión activa para ver tu plan.">
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
