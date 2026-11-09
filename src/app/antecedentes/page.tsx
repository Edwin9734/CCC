import { AppShell } from "@/components/app-shell";
import { AntecedentesManager } from "@/components/antecedentes/antecedentes-manager";
import type { ConditionRow, ExamRow, MedicineRow } from "@/lib/antecedentes";
import { ANTECEDENTES_TABS, normalizeTab } from "@/lib/section-tabs";
import { listHistoryRows, type HistoryTable } from "@/lib/supabase/antecedentes";
import { getMedications } from "@/lib/supabase/medications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function loadRows<Row>(supabase: Client, table: HistoryTable): Promise<Row[]> {
  try {
    return await listHistoryRows<Row>(supabase, table);
  } catch (err) {
    console.error(`Error loading ${table}:`, err);
    return [];
  }
}

export default async function AntecedentesPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, ANTECEDENTES_TABS, "medicinas");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let medicines: MedicineRow[] = [];
  let conditions: ConditionRow[] = [];
  let exams: ExamRow[] = [];
  let knownMedications: string[] = [];

  if (data.user) {
    [medicines, conditions, exams] = await Promise.all([
      loadRows<MedicineRow>(supabase, "history_medicines"),
      loadRows<ConditionRow>(supabase, "history_conditions"),
      loadRows<ExamRow>(supabase, "history_exams")
    ]);

    try {
      knownMedications = (await getMedications(supabase)).map((item) => item.name);
    } catch (err) {
      console.error("Error loading medications:", err);
    }
  }

  return (
    <AppShell
      title="Antecedentes"
      description="Tus medicinas, enfermedades y exámenes de siempre, listos para contárselos a tu médico."
      userEmail={data.user?.email ?? null}
    >
      <AntecedentesManager
        initialTab={initialTab}
        medicines={medicines}
        conditions={conditions}
        exams={exams}
        knownMedications={knownMedications}
      />
    </AppShell>
  );
}
