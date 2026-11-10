import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AllergyManager } from "@/components/allergies/allergy-manager";
import { DietBoard } from "@/components/diet/diet-board";
import { DietRecipes } from "@/components/diet/recipes-section";
import { todayInAppTimeZone } from "@/lib/date-utils";
import type { MealType } from "@/lib/diet-menu-data";
import { getDiaryEntries } from "@/lib/supabase/food-diary";
import { loadShoppingIds } from "@/lib/supabase/plan-goals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getMedications, type MedicationWithSchedules } from "@/lib/supabase/medications";
import { getAllergies, getAllergyReactions, type AllergyReactionRow, type AllergyRow } from "@/lib/supabase/allergies";
import { buildDietInsights } from "@/lib/diet-insights";
import { applyAllergyFilter, findAllergenMatches } from "@/lib/diet-allergens";
import { buildContacts } from "@/lib/contacts";
import { LIQUID_HIDDEN_IDS, buildProfileExtras } from "@/lib/plan-profile";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { DIET_TABS, normalizeTab } from "@/lib/section-tabs";

export default async function DietasPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, DIET_TABS, "guia");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let measurements: MeasurementWithStatus[] = [];
  let medications: MedicationWithSchedules[] = [];
  let allergies: AllergyRow[] = [];
  let reactions: AllergyReactionRow[] = [];
  let shoppingIds: string[] = [];
  let loggedToday: MealType[] = [];
  const today = todayInAppTimeZone();

  if (data.user) {
    try {
      shoppingIds = await loadShoppingIds(supabase, data.user.id);
    } catch (err) {
      console.error("Error loading shopping list:", err);
    }

    try {
      const entries = await getDiaryEntries(supabase, 60);
      loggedToday = entries.filter((entry) => entry.eaten_on === today).map((entry) => entry.meal_type);
    } catch (err) {
      console.error("Error loading diary entries:", err);
    }

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

    try {
      reactions = await getAllergyReactions(supabase);
    } catch (err) {
      console.error("Error loading allergy reactions:", err);
    }
  }

  const allergyNames = allergies.map((a) => a.allergy_name);
  const allergyMatches = findAllergenMatches(allergyNames);
  const blockedIds = new Set(Object.keys(allergyMatches));

  // Con restricción de líquidos (enfermedad renal o insuficiencia cardíaca) no se sugiere agua ni té verde.
  const shell = data.user ? await loadProfileForShell(supabase) : null;
  const extras = shell ? buildProfileExtras(shell.profile, shell.conditions) : null;
  const contacts = shell ? buildContacts(shell.profile) : null;
  const hiddenLiquidIds = extras?.waterRestricted ? LIQUID_HIDDEN_IDS : [];

  const insights = applyAllergyFilter(
    buildDietInsights(measurements, medications),
    new Set([...Array.from(blockedIds), ...hiddenLiquidIds])
  );

  return (
    <AppShell
      title="Dietas"
      description="Alimentos y bebidas que ayudan a cuidar tu colesterol, y los que conviene evitar."
      userEmail={data.user?.email ?? null}
    >
      <div className="space-y-6">
        {extras?.liquidNotice ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{extras.liquidNotice}</p>
          </div>
        ) : null}

        <DietBoard
          initialTab={initialTab}
          allergiesPanel={<AllergyManager initialAllergies={allergies} initialReactions={reactions} contacts={contacts} />}
          recipesPanel={<DietRecipes allergyNames={allergyNames} waterRestricted={Boolean(extras?.waterRestricted)} />}
          insights={insights}
          allergyMatches={allergyMatches}
          allergyNames={allergyNames}
          initialShopping={shoppingIds}
          initialLogged={loggedToday}
          today={today}
        />
      </div>
    </AppShell>
  );
}