import { AppShell } from "@/components/app-shell";
import { SWAPS } from "@/components/diet/diet-guide";
import { GuideBuilder } from "@/components/reports/guide-builder";
import { loadShoppingIds } from "@/lib/supabase/plan-goals";
import { ReportsBoard } from "@/components/reports/reports-board";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getMedications, type MedicationWithSchedules } from "@/lib/supabase/medications";
import { getAllergies, getAllergyReactions, type AllergyReactionRow, type AllergyRow } from "@/lib/supabase/allergies";
import { getHabitsDataForUser, type ActivityRow, type DailyHabitRow, type IntakeRow } from "@/lib/supabase/habits";
import { listHistoryRows } from "@/lib/supabase/antecedentes";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { buildDietInsights } from "@/lib/diet-insights";
import { applyAllergyFilter, findAllergenMatches } from "@/lib/diet-allergens";
import { LIQUID_HIDDEN_IDS, buildProfileExtras } from "@/lib/plan-profile";
import { buildContacts } from "@/lib/contacts";
import { addDays, minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildDoses, computeWeekSummary } from "@/lib/habits-config";
import { RISK_LABELS, computeRiskLevel, getLatestByMetric } from "@/lib/plan";
import { durationText, type ConditionRow, type ExamRow } from "@/lib/antecedentes";
import { SEX_OPTIONS, type ProfileData } from "@/lib/profile";
import { REPORT_TABS, normalizeTab } from "@/lib/section-tabs";
import { TEMPLATES, type ReportData, type TemplateKey } from "@/lib/report-builder";

const DAY_LETTERS = ["L", "M", "Mi", "J", "V", "S", "D"];

async function safe<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error(`Error loading ${label}:`, err);
    return fallback;
  }
}

function ageFrom(birth: string | null, today: string) {
  if (!birth) return null;
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

function scheduleText(med: MedicationWithSchedules) {
  return [...med.medication_schedules]
    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
    .map((item) => {
      const days = item.repeat_days?.length && item.repeat_days.length < 7 ? ` (${[...item.repeat_days].map(Number).sort((a, b) => a - b).map((day) => DAY_LETTERS[day - 1]).join(", ")})` : "";
      return `${item.time_of_day.slice(0, 5)}${days}`;
    })
    .join(", ");
}

export default async function ReportesPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[]; plantilla?: string | string[] }>;
}) {
  const { tab, plantilla } = await searchParams;
  const initialTab = normalizeTab(tab, REPORT_TABS, "reporte");
  const rawTemplate = Array.isArray(plantilla) ? plantilla[0] : plantilla;
  const initialTemplate: TemplateKey = TEMPLATES.some((item) => item.key === rawTemplate) ? (rawTemplate as TemplateKey) : "medico";

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const today = todayInAppTimeZone();
  const nowMinutes = minutesNowInAppTimeZone();

  let measurements: MeasurementWithStatus[] = [];
  let medications: MedicationWithSchedules[] = [];
  let allergies: AllergyRow[] = [];
  let reactions: AllergyReactionRow[] = [];
  let profile: ProfileData | null = null;
  let conditionNames: string[] = [];
  let historyConditions: ConditionRow[] = [];
  let exams: ExamRow[] = [];
  let shoppingIds: string[] = [];
  let habitsData = { habits: [] as DailyHabitRow[], activities: [] as ActivityRow[], intakes: [] as IntakeRow[] };

  if (data.user) {
    [measurements, medications, allergies, reactions, historyConditions, exams, habitsData] = await Promise.all([
      safe(getMeasurements(supabase, { limit: 500 }), [] as MeasurementWithStatus[], "measurements"),
      safe(getMedications(supabase), [] as MedicationWithSchedules[], "medications"),
      safe(getAllergies(supabase), [] as AllergyRow[], "allergies"),
      safe(getAllergyReactions(supabase), [] as AllergyReactionRow[], "allergy reactions"),
      safe(listHistoryRows<ConditionRow>(supabase, "history_conditions"), [] as ConditionRow[], "history conditions"),
      safe(listHistoryRows<ExamRow>(supabase, "history_exams"), [] as ExamRow[], "history exams"),
      safe(getHabitsDataForUser(supabase, data.user.id, addDays(today, -29), today), habitsData, "habits")
    ]);

    shoppingIds = await safe(loadShoppingIds(supabase, data.user.id), [] as string[], "shopping list");
    const shell = await loadProfileForShell(supabase);
    profile = shell.profile;
    conditionNames = shell.conditions;
  }

  const allergyNames = allergies.map((a) => a.allergy_name);
  const allergyMatches = findAllergenMatches(allergyNames);
  const blockedIds = new Set(Object.keys(allergyMatches));

  // Con restricción de líquidos (enfermedad renal o insuficiencia cardíaca) la guía no sugiere agua ni té verde.
  const extras = buildProfileExtras(profile, conditionNames);
  const hiddenLiquidIds: string[] = extras.waterRestricted ? LIQUID_HIDDEN_IDS : [];
  const insights = applyAllergyFilter(buildDietInsights(measurements, medications), new Set([...Array.from(blockedIds), ...hiddenLiquidIds]));

  // Constancia de los últimos 30 días y resumen de la semana.
  let taken = 0;
  let total = 0;
  for (let back = 0; back < 30; back += 1) {
    for (const dose of buildDoses(medications, habitsData.intakes, addDays(today, -back), today, nowMinutes)) {
      if (!(dose.due || dose.status !== null)) continue;
      total += 1;
      if (dose.status === "taken") taken += 1;
    }
  }
  const habitsByDay = Object.fromEntries(habitsData.habits.map((row) => [row.habit_date, { water_glasses: row.water_glasses, sleep_hours: row.sleep_hours }]));
  const week = computeWeekSummary({ today, nowMinutes, medications, habits: habitsByDay, activities: habitsData.activities, intakes: habitsData.intakes });

  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();

  const reportData: ReportData = {
    today,
    patient: {
      name: name || null,
      age: ageFrom(profile?.birth_date ?? null, today),
      sex: SEX_OPTIONS.find((option) => option.value === profile?.sex)?.label ?? null,
      weightLb: profile?.weight_lb ?? null,
      heightCm: profile?.height_cm ?? null,
      bmi: extras.bmi ? `${extras.bmi.value.toLocaleString("es-ES", { maximumFractionDigits: 1 })} (${extras.bmi.category})` : null
    },
    contacts: buildContacts(profile),
    conditions: [...extras.antecedents.map((item) => item.label), ...extras.otherConditions],
    riskLabel: RISK_LABELS[computeRiskLevel(getLatestByMetric(measurements.filter((row) => row.measured_at <= today)))],
    hdlMinimum: extras.hdlMinimum,
    measurements,
    medications: medications.map((med) => ({ id: med.id, name: med.name, dosage: med.dosage, instructions: med.instructions, schedule: scheduleText(med) })),
    adherence: { taken, total },
    allergies: allergies.map((item) => ({ name: item.allergy_name, notes: item.notes })),
    reactions,
    historyConditions: historyConditions.map((row) => ({
      name: row.name,
      kind: row.kind,
      duration: durationText(row, today),
      symptoms: row.symptoms,
      howCured: row.how_cured,
      year: row.ended_year,
      genetic: row.causes.includes("Genética o de familia")
    })),
    exams: [...exams]
      .sort((a, b) => (b.exam_date ?? "").localeCompare(a.exam_date ?? ""))
      .map((row) => ({ type: row.exam_type, date: row.exam_date, place: row.place, status: row.result_status, result: row.result_text })),
    week: {
      waterDays: week.water.metDays,
      waterRestricted: extras.waterRestricted,
      sleepAverage: week.sleep.average,
      activityMinutes: week.activity.totalMinutes,
      activeDays: week.activity.activeDays,
      dosesTaken: week.doses.taken,
      dosesScheduled: week.doses.scheduled
    }
  };

  return (
    <AppShell title="Reportes" description="Arma reportes para tu médico, tu tarjeta de bolsillo y tu guía de alimentación." userEmail={data.user?.email ?? null}>
      <ReportsBoard
        data={reportData}
        initialTab={initialTab}
        initialTemplate={initialTemplate}
        guidePanel={
          <GuideBuilder
            data={{ today, patientName: reportData.patient.name, insights, allergyMatches, allergyNames, hiddenIds: hiddenLiquidIds, liquidNotice: extras.liquidNotice, shoppingIds, swaps: SWAPS }}
          />
        }
      />
    </AppShell>
  );
}
