import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { PlanView } from "@/components/plan/plan-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildAdjustedPlan, loadAdjustmentData, type PlanAdjustment } from "@/lib/plan-adjustment";
import { buildContacts, type ContactsInfo } from "@/lib/contacts";
import type { ProfileExtras } from "@/lib/plan-profile";
import type { PlanData } from "@/lib/plan";

export default async function PlanPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let plan: PlanData | null = null;
  let adjustment: PlanAdjustment | null = null;
  let extras: ProfileExtras | null = null;
  let contacts: ContactsInfo | null = null;
  let allergyMatches: Record<string, string[]> = {};

  if (data.user) {
    const today = todayInAppTimeZone();
    const nowMinutes = minutesNowInAppTimeZone();

    const loaded = await loadAdjustmentData(supabase, data.user.id, today);
    allergyMatches = findAllergenMatches(loaded.allergies.map((a) => a.allergy_name));
    const blockedIds = new Set(Object.keys(allergyMatches));

    const result = buildAdjustedPlan(loaded, { blockedIds, today, nowMinutes });
    plan = result.plan;
    adjustment = result.adjustment;
    extras = result.extras;
    contacts = buildContacts(loaded.profile);
  }

  return (
    <AppShell
      title="Mi plan"
      description="Tu nivel, tus metas y tu plan, que se ajustan según tu evolución y tu cumplimiento."
      userEmail={data.user?.email ?? null}
    >
      {data.user && plan && adjustment && extras ? (
        <PlanView
          plan={plan}
          adjustment={adjustment}
          extras={extras}
          contacts={contacts}
          allergyMatches={allergyMatches}
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