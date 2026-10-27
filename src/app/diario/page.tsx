import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { FoodDiaryManager } from "@/components/diet/food-diary-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDiaryEntries, type FoodDiaryRow } from "@/lib/supabase/food-diary";
import { getAllergies, type AllergyRow } from "@/lib/supabase/allergies";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { DIARY_TABS, normalizeTab } from "@/lib/section-tabs";

export default async function DiarioPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, DIARY_TABS, "diario");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let entries: FoodDiaryRow[] = [];
  let allergies: AllergyRow[] = [];

  if (data.user) {
    try {
      entries = await getDiaryEntries(supabase);
    } catch (err) {
      console.error("Error loading diary entries:", err);
    }

    try {
      allergies = await getAllergies(supabase);
    } catch (err) {
      console.error("Error loading allergies:", err);
    }
  }

  const allergyMatches = findAllergenMatches(allergies.map((a) => a.allergy_name));

  return (
    <AppShell
      title="Diario de comidas"
      description="Anota lo que comes y mira cómo va tu semana."
      userEmail={data.user?.email ?? null}
    >
      {data.user ? (
        <FoodDiaryManager initialEntries={entries} allergyMatches={allergyMatches} initialTab={initialTab} />
      ) : (
        <SectionCard title="Inicia sesión" description="Necesitas una sesión activa para usar el diario.">
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