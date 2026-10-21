import type { SupabaseClient } from "@supabase/supabase-js";
import { DIET_ITEMS } from "@/lib/diet-data";
import { addDays, formatDate } from "@/lib/date-utils";
import {
  HDL_GOAL,
  LDL_GOAL,
  TRIGLYCERIDES_GOAL,
  buildPlan,
  computeRiskLevel,
  getLatestByMetric,
  getRoutineForLevel,
  type PlanData,
  type RiskLevel
} from "@/lib/plan";
import { METRIC_LABELS, isAlertStatus, type LipidMetric } from "@/lib/ranges";
import { SLEEP_GOAL_HOURS, WATER_GOAL_GLASSES, computeWeekSummary, formatHours } from "@/lib/habits-config";
import { getAllergies, type AllergyRow } from "@/lib/supabase/allergies";
import { getDiaryEntries, type FoodDiaryRow } from "@/lib/supabase/food-diary";
import {
  getHabitsDataForUser,
  type ActivityRow,
  type DailyHabitRow,
  type DailyHabitValues,
  type IntakeRow
} from "@/lib/supabase/habits";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getMedications, type MedicationWithSchedules } from "@/lib/supabase/medications";

// ---------------------------------------------------------------------------
// Reglas del ajuste. Para cambiarlas, edita solo estos números.
// Son orientativas y conviene que un profesional de salud las revise.
// ---------------------------------------------------------------------------
export const STABLE_CHANGE_PERCENT = 5; // cambios menores a esto se consideran "estable"
export const NEXT_STEP_PERCENT = 0.1; // paso intermedio de la meta del próximo control (10%)
export const MIN_RECORDED_DAYS = 3; // días con registro (de 7) para evaluar el cumplimiento
export const MEDICATION_GOAL_RATIO = 0.8; // 80% de las tomas
export const WATER_GOAL_DAYS = 5; // días de 7 con la meta de agua cumplida
export const ACTIVITY_RAISE_FACTOR = 1.1; // sube 10%
export const ACTIVITY_LOWER_FACTOR = 0.8; // baja 20%
export const ACTIVITY_MAX_MINUTES = 150;
export const ACTIVITY_MIN_MINUTES = 60;

export const ADJUSTMENT_DISCLAIMER =
  "Estos ajustes se calculan con reglas fijas y sencillas (no con inteligencia artificial) a partir de tus mediciones y de lo que registras. Son orientativos y no reemplazan la indicación de tu médico. Nunca cambies ni suspendas un medicamento por tu cuenta.";

const METRICS: LipidMetric[] = ["LDL", "TRIGLYCERIDES", "HDL"];

const LEVEL_BY_FOOD_ID = new Map(DIET_ITEMS.map((item) => [item.id, item.level]));

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type TrendDirection = "improving" | "stable" | "worsening" | "insufficient";

export interface MetricTrend {
  metric: LipidMetric;
  label: string;
  direction: TrendDirection;
  directionLabel: string;
  detail: string;
}

export interface NextControlGoal {
  metric: LipidMetric;
  label: string;
  targetText: string;
  reason: string;
}

export interface ActivityGoalAdjustment {
  baseMinutes: number;
  minutes: number;
  change: "raised" | "kept" | "lowered" | "base";
  reason: string;
  previousWeekMinutes: number;
}

export type AreaStatus = "met" | "not_met" | "no_data";

export interface ComplianceArea {
  key: "meds" | "water" | "sleep" | "activity" | "food";
  label: string;
  status: AreaStatus;
  value: string;
  goal: string;
}

export type ComplianceLevel = "high" | "medium" | "low" | "unknown";

export interface Compliance {
  evaluable: boolean;
  recordedDays: number;
  level: ComplianceLevel;
  levelLabel: string;
  levelMessage: string;
  areas: ComplianceArea[];
  metCount: number;
  dataCount: number;
}

export interface PlanChange {
  title: string;
  detail: string;
}

export interface PlanAdjustment {
  trends: MetricTrend[];
  nextGoals: NextControlGoal[];
  activity: ActivityGoalAdjustment;
  dietEscalated: boolean;
  dietNote: string | null;
  compliance: Compliance;
  changes: PlanChange[];
  recommendations: string[];
}

export interface AdjustmentData {
  measurements: MeasurementWithStatus[];
  medications: MedicationWithSchedules[];
  habitRows: DailyHabitRow[];
  activities: ActivityRow[];
  intakes: IntakeRow[];
  diaryEntries: FoodDiaryRow[];
  allergies: AllergyRow[];
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function roundTo5(n: number) {
  return Math.round(n / 5) * 5;
}

function isOutOfRange(status: string) {
  return status === "LOW" || isAlertStatus(status);
}

function sortRecent(list: MeasurementWithStatus[]) {
  return [...list].sort((a, b) =>
    a.measured_at === b.measured_at
      ? b.created_at.localeCompare(a.created_at)
      : b.measured_at.localeCompare(a.measured_at)
  );
}

// ---------------------------------------------------------------------------
// Evolución de los valores de colesterol
// ---------------------------------------------------------------------------

interface TrendInternal {
  metric: LipidMetric;
  latest?: MeasurementWithStatus;
  previous?: MeasurementWithStatus;
  direction: TrendDirection;
  change: number;
  pct: number;
}

function computeTrend(metric: LipidMetric, measurements: MeasurementWithStatus[]): TrendInternal {
  const list = sortRecent(measurements.filter((m) => m.metric === metric));
  const latest = list[0];
  const previous = list[1];

  if (!latest || !previous) {
    return { metric, latest, previous, direction: "insufficient", change: 0, pct: 0 };
  }

  const change = Number(latest.value) - Number(previous.value);
  const previousValue = Number(previous.value);
  const pct = previousValue === 0 ? (change === 0 ? 0 : change > 0 ? 100 : -100) : (change / previousValue) * 100;

  if (Math.abs(pct) < STABLE_CHANGE_PERCENT) {
    return { metric, latest, previous, direction: "stable", change, pct };
  }

  // Para LDL y triglicéridos es mejor que bajen; para el HDL, que suba.
  const better = metric === "HDL" ? change > 0 : change < 0;
  return { metric, latest, previous, direction: better ? "improving" : "worsening", change, pct };
}

const DIRECTION_LABELS: Record<TrendDirection, string> = {
  improving: "Mejorando",
  stable: "Estable",
  worsening: "Empeorando",
  insufficient: "Sin comparar"
};

function trendDetail(t: TrendInternal): string {
  if (!t.latest) return "Aún no tienes mediciones de este indicador.";
  if (!t.previous) return "Necesitas al menos 2 mediciones de este indicador para ver tu evolución.";

  const from = fmt(Number(t.previous.value));
  const to = fmt(Number(t.latest.value));
  const dates = `entre el ${formatDate(t.previous.measured_at)} y el ${formatDate(t.latest.measured_at)}`;
  const percent = fmt(Math.abs(t.pct));

  if (t.direction === "stable") {
    return `Casi sin cambios (${percent}%): de ${from} a ${to} mg/dL ${dates}.`;
  }

  const verb = t.change > 0 ? "Subió" : "Bajó";
  const stillInRange =
    t.direction === "worsening" && (t.latest.status === "NORMAL" || t.latest.status === "PROTECTIVE");

  return `${verb} ${fmt(Math.abs(t.change))} mg/dL (${percent}%): de ${from} a ${to} mg/dL ${dates}.${
    stillInRange ? " Sigue dentro del rango." : ""
  }`;
}

// ---------------------------------------------------------------------------
// Meta del próximo control (un paso intermedio hacia la meta final)
// ---------------------------------------------------------------------------

function buildNextGoal(t: TrendInternal): NextControlGoal | null {
  const { metric, latest, previous } = t;
  if (!latest) return null;

  const latestValue = Number(latest.value);
  const label = METRIC_LABELS[metric];
  const criticalNote =
    latest.status === "CRITICAL" ? " Con un valor crítico, lo primero es consultar a tu médico." : "";
  const worsening = t.direction === "worsening" && previous !== undefined;
  const previousValue = previous ? Number(previous.value) : 0;
  const previousText = previous ? `${fmt(previousValue)} mg/dL, ${formatDate(previous.measured_at)}` : "";

  if (metric === "HDL") {
    if (latestValue >= HDL_GOAL) return null;

    if (worsening) {
      if (previousValue >= HDL_GOAL) {
        return {
          metric,
          label,
          targetText: `${HDL_GOAL} mg/dL o más`,
          reason: `Tu medición anterior estaba dentro de la meta; la idea es volver a ese nivel.${criticalNote}`
        };
      }
      return {
        metric,
        label,
        targetText: `${fmt(previousValue)} mg/dL o más`,
        reason: `Volver al valor de tu medición anterior (${previousText}) antes de seguir subiendo.${criticalNote}`
      };
    }

    const target = Math.min(HDL_GOAL, Math.ceil(latestValue * (1 + NEXT_STEP_PERCENT)));
    return {
      metric,
      label,
      targetText: `${fmt(target)} mg/dL o más`,
      reason:
        (target === HDL_GOAL
          ? "Estás cerca de tu meta final."
          : `Un paso intermedio: subir cerca de 10% desde tu valor actual (${fmt(latestValue)} mg/dL) hasta llegar a ${HDL_GOAL}.`) +
        criticalNote
    };
  }

  // LDL y triglicéridos: menos es mejor.
  const goal = metric === "LDL" ? LDL_GOAL : TRIGLYCERIDES_GOAL;
  if (latestValue < goal) return null;

  if (worsening) {
    if (previousValue < goal) {
      return {
        metric,
        label,
        targetText: `Menos de ${goal} mg/dL`,
        reason: `Tu medición anterior estaba dentro de la meta; la idea es volver a ese nivel.${criticalNote}`
      };
    }
    return {
      metric,
      label,
      targetText: `${fmt(previousValue)} mg/dL o menos`,
      reason: `Volver al valor de tu medición anterior (${previousText}) antes de seguir bajando.${criticalNote}`
    };
  }

  const target = Math.max(goal, Math.floor(latestValue * (1 - NEXT_STEP_PERCENT)));
  return {
    metric,
    label,
    targetText: `Menos de ${fmt(target)} mg/dL`,
    reason:
      (target === goal
        ? "Estás cerca de tu meta final."
        : `Un paso intermedio: bajar cerca de 10% desde tu valor actual (${fmt(latestValue)} mg/dL) hasta llegar a ${goal}.`) +
      criticalNote
  };
}

// ---------------------------------------------------------------------------
// Meta de actividad (según cómo te fue la semana anterior)
// ---------------------------------------------------------------------------

function computeActivityAdjustment(
  baseMinutes: number,
  previousWeekMinutes: number,
  previousRecordedDays: number
): ActivityGoalAdjustment {
  if (previousRecordedDays < MIN_RECORDED_DAYS) {
    return {
      baseMinutes,
      minutes: baseMinutes,
      change: "base",
      previousWeekMinutes,
      reason: `Aún no hay suficientes registros de la semana anterior (${previousRecordedDays} de 7 días con registro; se necesitan ${MIN_RECORDED_DAYS}). Tu meta es la base de tu nivel.`
    };
  }

  const ratio = previousWeekMinutes / baseMinutes;

  if (ratio >= 1) {
    const raised = Math.min(ACTIVITY_MAX_MINUTES, roundTo5(baseMinutes * ACTIVITY_RAISE_FACTOR));
    if (raised > baseMinutes) {
      return {
        baseMinutes,
        minutes: raised,
        change: "raised",
        previousWeekMinutes,
        reason: `La semana pasada hiciste ${previousWeekMinutes} min y cumpliste tu meta base de ${baseMinutes} min, así que la subimos 10%.`
      };
    }
    return {
      baseMinutes,
      minutes: baseMinutes,
      change: "kept",
      previousWeekMinutes,
      reason: `La semana pasada hiciste ${previousWeekMinutes} min y cumpliste tu meta base de ${baseMinutes} min. Ya estás en el máximo de ${ACTIVITY_MAX_MINUTES} min, así que se mantiene.`
    };
  }

  if (ratio >= 0.5) {
    return {
      baseMinutes,
      minutes: baseMinutes,
      change: "kept",
      previousWeekMinutes,
      reason: `La semana pasada hiciste ${previousWeekMinutes} de ${baseMinutes} min (${Math.round(ratio * 100)}%). Se mantiene tu meta para que sigas avanzando.`
    };
  }

  const lowered = Math.max(ACTIVITY_MIN_MINUTES, roundTo5(baseMinutes * ACTIVITY_LOWER_FACTOR));
  return {
    baseMinutes,
    minutes: lowered,
    change: "lowered",
    previousWeekMinutes,
    reason: `La semana pasada hiciste ${previousWeekMinutes} de ${baseMinutes} min, menos de la mitad. Bajamos la meta 20% para que sea más fácil de cumplir; lo importante es avanzar poco a poco.`
  };
}

// ---------------------------------------------------------------------------
// Días con registro y cumplimiento
// ---------------------------------------------------------------------------

function countRecordedDays(data: AdjustmentData, from: string, to: string): number {
  const days = new Set<string>();
  const inRange = (day: string) => day >= from && day <= to;

  for (const row of data.habitRows) {
    if (inRange(row.habit_date) && (row.water_glasses > 0 || row.sleep_hours !== null)) {
      days.add(row.habit_date);
    }
  }
  for (const activity of data.activities) {
    if (inRange(activity.activity_date)) days.add(activity.activity_date);
  }
  for (const intake of data.intakes) {
    if (inRange(intake.intake_date)) days.add(intake.intake_date);
  }
  for (const entry of data.diaryEntries) {
    if (inRange(entry.eaten_on)) days.add(entry.eaten_on);
  }

  return days.size;
}

const LEVEL_TEXT: Record<ComplianceLevel, { label: string; message: string }> = {
  high: { label: "Alto", message: "Vas muy bien con tus hábitos esta semana. Sigue así." },
  medium: { label: "Medio", message: "Vas por buen camino; hay algunas áreas por mejorar." },
  low: {
    label: "Bajo",
    message: "Esta semana costó cumplir varias áreas. Elige una sola para mejorar primero."
  },
  unknown: { label: "Sin evaluar", message: "" }
};

interface ComplianceResult {
  compliance: Compliance;
  weekSummary: ReturnType<typeof computeWeekSummary>;
  food: { green: number; red: number };
}

function buildCompliance(
  data: AdjustmentData,
  context: { today: string; nowMinutes: number; weekFrom: string; goalMinutes: number }
): ComplianceResult {
  const { today, nowMinutes, weekFrom, goalMinutes } = context;

  const habitsByDay: Record<string, DailyHabitValues> = {};
  for (const row of data.habitRows) {
    habitsByDay[row.habit_date] = { water_glasses: row.water_glasses, sleep_hours: row.sleep_hours };
  }

  const summary = computeWeekSummary({
    today,
    nowMinutes,
    medications: data.medications,
    habits: habitsByDay,
    activities: data.activities,
    intakes: data.intakes
  });

  // Alimentos verdes y rojos del diario (últimos 7 días)
  let green = 0;
  let red = 0;
  for (const entry of data.diaryEntries) {
    if (entry.eaten_on < weekFrom || entry.eaten_on > today) continue;
    for (const id of entry.food_ids) {
      const level = LEVEL_BY_FOOD_ID.get(id);
      if (level === "green") green += 1;
      else if (level === "red") red += 1;
    }
  }

  const areas: ComplianceArea[] = [];

  // Medicamentos
  const { scheduled, taken } = summary.doses;
  const medsGoal = `${Math.round(MEDICATION_GOAL_RATIO * 100)}% de las tomas o más`;
  areas.push(
    scheduled > 0
      ? {
          key: "meds",
          label: "Medicamentos",
          status: taken / scheduled >= MEDICATION_GOAL_RATIO ? "met" : "not_met",
          value: `${taken} de ${scheduled} tomas`,
          goal: medsGoal
        }
      : { key: "meds", label: "Medicamentos", status: "no_data", value: "Sin tomas programadas", goal: medsGoal }
  );

  // Agua
  const waterGoal = `${WATER_GOAL_DAYS} de 7 días con ${WATER_GOAL_GLASSES} vasos o más`;
  areas.push(
    summary.water.daysWithRecord > 0
      ? {
          key: "water",
          label: "Agua",
          status: summary.water.metDays >= WATER_GOAL_DAYS ? "met" : "not_met",
          value: `${summary.water.metDays} de 7 días`,
          goal: waterGoal
        }
      : { key: "water", label: "Agua", status: "no_data", value: "Sin registro", goal: waterGoal }
  );

  // Sueño
  const sleepGoal = `${SLEEP_GOAL_HOURS} horas o más de promedio`;
  areas.push(
    summary.sleep.average !== null
      ? {
          key: "sleep",
          label: "Sueño",
          status: summary.sleep.average >= SLEEP_GOAL_HOURS ? "met" : "not_met",
          value: `${formatHours(summary.sleep.average)} h de promedio`,
          goal: sleepGoal
        }
      : { key: "sleep", label: "Sueño", status: "no_data", value: "Sin registro", goal: sleepGoal }
  );

  // Actividad física
  areas.push({
    key: "activity",
    label: "Actividad física",
    status: summary.activity.totalMinutes >= goalMinutes ? "met" : "not_met",
    value: `${summary.activity.totalMinutes} min`,
    goal: `${goalMinutes} min por semana`
  });

  // Alimentación (diario)
  const foodGoal = "Más alimentos verdes que rojos";
  areas.push(
    green + red > 0
      ? {
          key: "food",
          label: "Alimentación",
          status: green > red ? "met" : "not_met",
          value: `${green} verde(s) y ${red} rojo(s)`,
          goal: foodGoal
        }
      : { key: "food", label: "Alimentación", status: "no_data", value: "Sin alimentos de la guía en el diario", goal: foodGoal }
  );

  const recordedDays = countRecordedDays(data, weekFrom, today);
  const evaluable = recordedDays >= MIN_RECORDED_DAYS;

  const withData = areas.filter((area) => area.status !== "no_data");
  const metCount = withData.filter((area) => area.status === "met").length;
  const dataCount = withData.length;

  let level: ComplianceLevel = "unknown";
  if (evaluable && dataCount > 0) {
    const ratio = metCount / dataCount;
    level = ratio >= 0.75 ? "high" : ratio >= 0.4 ? "medium" : "low";
  }

  const levelText =
    level === "unknown"
      ? {
          label: LEVEL_TEXT.unknown.label,
          message: `Llevas ${recordedDays} de 7 días con registro. Registra algo en Hábitos o en el Diario al menos ${MIN_RECORDED_DAYS} días para que el plan se ajuste a tu cumplimiento.`
        }
      : LEVEL_TEXT[level];

  return {
    compliance: {
      evaluable,
      recordedDays,
      level,
      levelLabel: levelText.label,
      levelMessage: levelText.message,
      areas,
      metCount,
      dataCount
    },
    weekSummary: summary,
    food: { green, red }
  };
}

// ---------------------------------------------------------------------------
// Plan ajustado
// ---------------------------------------------------------------------------

export function buildAdjustedPlan(
  data: AdjustmentData,
  context: { blockedIds: Set<string>; today: string; nowMinutes: number }
): { plan: PlanData; adjustment: PlanAdjustment } {
  const { blockedIds, today, nowMinutes } = context;

  const latest = getLatestByMetric(data.measurements);
  const level = computeRiskLevel(latest);
  const baseMinutes = getRoutineForLevel(level).weeklyMinutes;

  const weekFrom = addDays(today, -6);
  const previousFrom = addDays(today, -13);
  const previousTo = addDays(today, -7);

  // 1) Evolución de tus valores
  const internalTrends = METRICS.map((metric) => computeTrend(metric, data.measurements));

  const trends: MetricTrend[] = internalTrends.map((t) => ({
    metric: t.metric,
    label: METRIC_LABELS[t.metric],
    direction: t.direction,
    directionLabel: DIRECTION_LABELS[t.direction],
    detail: trendDetail(t)
  }));

  const nextGoals = internalTrends.flatMap((t) => {
    const goal = buildNextGoal(t);
    return goal ? [goal] : [];
  });

  // 2) Alimentación: nunca se relaja sola. Si estás en nivel Moderado y un valor fuera de
  //    rango empeora, el plan usa las reglas del nivel Alto.
  const worsening = internalTrends.filter(
    (t) => t.direction === "worsening" && t.latest !== undefined && isOutOfRange(t.latest.status)
  );
  const dietEscalated = level === "MODERATE" && worsening.length > 0;
  const dietLevel: RiskLevel | undefined = dietEscalated ? "HIGH" : undefined;
  const dietNote = dietEscalated
    ? `Estás en nivel Moderado, pero ${worsening
        .map((t) => METRIC_LABELS[t.metric])
        .join(" y ")} empeoró y sigue fuera de rango. Por eso tu alimentación usa las reglas del nivel Alto, hasta que mejore.`
    : null;

  // 3) Meta de actividad según la semana anterior
  const previousWeekMinutes = data.activities
    .filter((a) => a.activity_date >= previousFrom && a.activity_date <= previousTo)
    .reduce((sum, a) => sum + a.minutes, 0);
  const previousRecordedDays = countRecordedDays(data, previousFrom, previousTo);
  const activity = computeActivityAdjustment(baseMinutes, previousWeekMinutes, previousRecordedDays);

  // 4) Plan base con los ajustes aplicados
  const plan = buildPlan(data.measurements, blockedIds, {
    dietLevel,
    activityGoalMinutes: activity.minutes
  });

  // 5) Cumplimiento de los últimos 7 días
  const { compliance, weekSummary, food } = buildCompliance(data, {
    today,
    nowMinutes,
    weekFrom,
    goalMinutes: activity.minutes
  });

  // 6) Qué cambió en tu plan
  const changes: PlanChange[] = [];

  if (dietEscalated && dietNote) {
    changes.push({ title: "Plan de alimentación más estricto", detail: dietNote });
  }

  const activityTitles: Record<ActivityGoalAdjustment["change"], string> = {
    raised: `Meta de actividad: sube a ${activity.minutes} min por semana`,
    kept: `Meta de actividad: se mantiene en ${activity.minutes} min por semana`,
    lowered: `Meta de actividad: baja a ${activity.minutes} min por semana`,
    base: `Meta de actividad: ${activity.minutes} min por semana (base de tu nivel)`
  };
  changes.push({ title: activityTitles[activity.change], detail: activity.reason });

  for (const goal of nextGoals) {
    changes.push({
      title: `Meta del próximo control: ${goal.label}`,
      detail: `${goal.targetText}. ${goal.reason}`
    });
  }

  // 7) Qué hacer esta semana
  const recommendations: string[] = [];

  if (METRICS.some((metric) => latest[metric]?.status === "CRITICAL")) {
    recommendations.push(
      "Tienes un valor crítico: consulta a un médico lo antes posible. Lo demás de este plan es solo un apoyo."
    );
  }

  for (const t of internalTrends) {
    if (!t.latest || !t.previous) continue;
    const label = METRIC_LABELS[t.metric];
    if (t.direction === "worsening") {
      recommendations.push(
        `${label}: empeoró entre tus dos últimas mediciones. Comenta este cambio con tu médico en tu próxima consulta.`
      );
    } else if (t.direction === "improving") {
      recommendations.push(`${label}: mejoró entre tus dos últimas mediciones. Sigue con lo que estás haciendo.`);
    }
  }

  if (compliance.evaluable) {
    for (const area of compliance.areas) {
      if (area.status !== "not_met") continue;

      if (area.key === "meds") {
        recommendations.push(
          `Medicamentos: marcaste ${weekSummary.doses.taken} de ${weekSummary.doses.scheduled} tomas como tomadas. Si las tomaste y no las anotaste, regístralas en Hábitos; si se te olvidan, prueba poner una alarma a la hora de cada una y coméntalo con tu médico. No cambies ni suspendas dosis por tu cuenta.`
        );
      } else if (area.key === "water") {
        recommendations.push(
          `Agua: alcanzaste tu meta ${weekSummary.water.metDays} de 7 días. Deja un vaso a la vista y toma uno en cada comida (si tu médico no limitó tus líquidos).`
        );
      } else if (area.key === "sleep" && weekSummary.sleep.average !== null) {
        recommendations.push(
          `Sueño: dormiste ${formatHours(weekSummary.sleep.average)} h en promedio. Intenta acostarte a la misma hora todos los días y evitar la cafeína por la tarde.`
        );
      } else if (area.key === "activity") {
        recommendations.push(
          `Actividad: hiciste ${weekSummary.activity.totalMinutes} de ${activity.minutes} min. Agrega caminatas cortas de 10 minutos repartidas en el día.`
        );
      } else if (area.key === "food") {
        recommendations.push(
          `Alimentación: en tu diario hay ${food.red} alimento(s) en rojo y ${food.green} en verde. Cambia alguno de los rojos por una opción verde de la guía.`
        );
      }
    }

    if (compliance.dataCount > 0 && compliance.metCount === compliance.dataCount) {
      recommendations.push("¡Buen trabajo! Cumpliste todas las áreas esta semana. Mantén tus hábitos.");
    }

    if (compliance.level === "low") {
      recommendations.push("Elige una sola área para mejorar primero esta semana; no hace falta cambiar todo a la vez.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Registra tus mediciones y tus hábitos para recibir recomendaciones ajustadas a ti.");
  }

  return {
    plan,
    adjustment: {
      trends,
      nextGoals,
      activity,
      dietEscalated,
      dietNote,
      compliance,
      changes,
      recommendations
    }
  };
}

// ---------------------------------------------------------------------------
// Carga de datos (para usar en el servidor)
// ---------------------------------------------------------------------------

async function safe<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error(`Error loading ${label}:`, err);
    return fallback;
  }
}

export async function loadAdjustmentData(
  supabase: SupabaseClient,
  userId: string,
  today: string
): Promise<AdjustmentData> {
  const from = addDays(today, -13);

  const [measurements, medications, habitsData, diary, allergies] = await Promise.all([
    safe(getMeasurements(supabase, { limit: 100 }), [] as MeasurementWithStatus[], "measurements"),
    safe(getMedications(supabase), [] as MedicationWithSchedules[], "medications"),
    safe(
      getHabitsDataForUser(supabase, userId, from, today),
      { habits: [] as DailyHabitRow[], activities: [] as ActivityRow[], intakes: [] as IntakeRow[] },
      "habits"
    ),
    safe(getDiaryEntries(supabase, 300), [] as FoodDiaryRow[], "diary entries"),
    safe(getAllergies(supabase), [] as AllergyRow[], "allergies")
  ]);

  return {
    measurements,
    medications,
    habitRows: habitsData.habits,
    activities: habitsData.activities,
    intakes: habitsData.intakes,
    diaryEntries: diary.filter((entry) => entry.eaten_on >= from && entry.eaten_on <= today),
    allergies
  };
}