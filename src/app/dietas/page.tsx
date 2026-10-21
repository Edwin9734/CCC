import { AppShell } from "@/components/app-shell";
import { AllergyManager } from "@/components/allergies/allergy-manager";
import { DietBrowser } from "@/components/diet/diet-browser";
import { DietInsightsPanel } from "@/components/diet/diet-insights-panel";
import { DietMenu } from "@/components/diet/diet-menu";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getMedications, type MedicationWithSchedules } from "@/lib/supabase/medications";
import { getAllergies, type AllergyRow } from "@/lib/supabase/allergies";
import { buildDietInsights } from "@/lib/diet-insights";
import { applyAllergyFilter, findAllergenMatches } from "@/lib/diet-allergens";

export default async function DietasPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let measurements: MeasurementWithStatus[] = [];
  let medications: MedicationWithSchedules[] = [];
  let allergies: AllergyRow[] = [];

  if (data.user) {
    try {
      measurements = await getMeasurements(supabase, { limit: 50 });
    } catch (err) {
      console.error("Error loading measurements:", err);
    }

    try {
      medications = await getMedications(supabase);
    } catch (err) {
      console.error("Error loading medications:", err);
    }

    try {
      allergies = await getAllergies(supabase);
    } catch (err) {
      console.error("Error loading allergies:", err);
    }
  }

  const allergyNames = allergies.map((a) => a.allergy_name);
  const allergyMatches = findAllergenMatches(allergyNames);
  const blockedIds = new Set(Object.keys(allergyMatches));
  const insights = applyAllergyFilter(buildDietInsights(measurements, medications), blockedIds);

  return (
    <AppShell
      title="Dietas"
      description="Alimentos y bebidas que ayudan a cuidar tu colesterol, y los que conviene evitar."
      userEmail={data.user?.email ?? null}
    >
      <div className="space-y-6">
        <DietInsightsPanel insights={insights} />
        <AllergyManager initialAllergies={allergies} />
        <DietBrowser focusIds={insights.focusIds} allergyMatches={allergyMatches} />
        <DietMenu allergyNames={allergyNames} />
      </div>
    </AppShell>
  );
}