import { addDays, isoWeekday } from "@/lib/date-utils";
import {
  SLEEP_GOAL_HOURS,
  WATER_GOAL_GLASSES,
  buildDoses,
  type Dose,
  type WeekSummary
} from "@/lib/habits-config";
import type { ActivityRow, DailyHabitValues, IntakeRow } from "@/lib/supabase/habits";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";

export const WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];
export const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ---------------------------------------------------------------------------
// Tomas de medicamentos
// ---------------------------------------------------------------------------

export type DayPeriod = "manana" | "tarde" | "noche";

export const PERIOD_LABELS: Record<DayPeriod, string> = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche"
};

const PERIOD_ORDER: DayPeriod[] = ["manana", "tarde", "noche"];

export function periodOf(time: string): DayPeriod {
  const hour = Number(time.slice(0, 2));
  if (hour >= 5 && hour < 12) return "manana";
  if (hour >= 12 && hour < 18) return "tarde";
  return "noche";
}

export function groupDosesByPeriod(doses: Dose[]): { period: DayPeriod; doses: Dose[] }[] {
  return PERIOD_ORDER.map((period) => ({
    period,
    doses: doses.filter((dose) => periodOf(dose.time) === period)
  })).filter((group) => group.doses.length > 0);
}

// La siguiente toma de hoy que todavía no llega y no se ha marcado.
export function nextPendingDose(doses: Dose[]): Dose | null {
  return doses.find((dose) => !dose.due && dose.status === null) ?? null;
}

export function minutesUntil(time: string, nowMinutes: number): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes - nowMinutes;
}

export function formatCountdown(totalMinutes: number): string {
  if (totalMinutes <= 0) return "Ahora";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `En ${minutes} min`;
  if (minutes === 0) return `En ${hours} h`;
  return `En ${hours} h ${minutes} min`;
}

export type DoseDayState = "all" | "partial" | "none" | "pending" | "empty";

export const DOSE_STATE_TEXT: Record<DoseDayState, string> = {
  all: "todas las tomas registradas como tomadas",
  partial: "algunas tomas tomadas",
  none: "ninguna toma tomada",
  pending: "todavía quedan tomas por llegar",
  empty: "sin tomas programadas"
};

export function doseDayState(doses: Dose[]): DoseDayState {
  if (doses.length === 0) return "empty";

  const counted = doses.filter((dose) => dose.due || dose.status !== null);
  if (counted.length === 0) return "pending";

  const taken = counted.filter((dose) => dose.status === "taken").length;
  if (taken === counted.length) return counted.length === doses.length ? "all" : "pending";
  return taken > 0 ? "partial" : "none";
}

// ---------------------------------------------------------------------------
// Últimos 7 días
// ---------------------------------------------------------------------------

export interface HabitDay {
  date: string;
  letter: string;
  dayName: string;
  doseState: DoseDayState;
  water: number;
  sleep: number | null;
  activityMinutes: number;
}

export function buildHabitDays({
  today,
  nowMinutes,
  medications,
  habits,
  activities,
  intakes
}: {
  today: string;
  nowMinutes: number;
  medications: MedicationWithSchedules[];
  habits: Record<string, DailyHabitValues>;
  activities: ActivityRow[];
  intakes: IntakeRow[];
}): HabitDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const weekday = isoWeekday(date) - 1;
    const habit = habits[date];

    return {
      date,
      letter: WEEKDAY_LETTERS[weekday],
      dayName: WEEKDAY_NAMES[weekday],
      doseState: doseDayState(buildDoses(medications, intakes, date, today, nowMinutes)),
      water: habit?.water_glasses ?? 0,
      sleep: habit?.sleep_hours ?? null,
      activityMinutes: activities
        .filter((activity) => activity.activity_date === date)
        .reduce((sum, activity) => sum + activity.minutes, 0)
    };
  });
}

// ---------------------------------------------------------------------------
// Sueño
// ---------------------------------------------------------------------------

// Horas dormidas entre dos horas "HH:MM". Si la de levantarse es menor, cruzó la medianoche.
export function sleepHoursBetween(bedTime: string, wakeTime: string): number | null {
  const parse = (value: string) => {
    const match = /^(\d{2}):(\d{2})/.exec(value);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };

  const bed = parse(bedTime);
  const wake = parse(wakeTime);
  if (bed === null || wake === null || bed === wake) return null;

  const minutes = (wake - bed + 1440) % 1440;
  return Math.round((minutes / 60) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Comparación entre semanas
// ---------------------------------------------------------------------------

export type WeekTrend = "up" | "down" | "same" | "none";

export interface WeekComparison {
  key: "medicamentos" | "agua" | "sueno" | "actividad";
  label: string;
  trend: WeekTrend;
  text: string;
}

function trendOf(current: number, previous: number): WeekTrend {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "same";
}

function trendWord(trend: WeekTrend) {
  if (trend === "up") return "Subió";
  if (trend === "down") return "Bajó";
  return "Igual";
}

function dayCount(count: number) {
  return `${count} ${count === 1 ? "día" : "días"}`;
}

const NO_PREVIOUS = "Sin datos de la semana pasada.";

export function compareWeeks(current: WeekSummary, previous: WeekSummary, waterRestricted: boolean): WeekComparison[] {
  const rows: WeekComparison[] = [];

  const percent = (doses: WeekSummary["doses"]) => Math.round((doses.taken / doses.scheduled) * 100);
  if (current.doses.scheduled > 0 && previous.doses.scheduled > 0) {
    const now = percent(current.doses);
    const before = percent(previous.doses);
    const trend = trendOf(now, before);
    rows.push({
      key: "medicamentos",
      label: "Medicamentos",
      trend,
      text: `${trendWord(trend)}: ${now}% de tomas (antes ${before}%).`
    });
  } else {
    rows.push({ key: "medicamentos", label: "Medicamentos", trend: "none", text: NO_PREVIOUS });
  }

  if (!waterRestricted) {
    if (previous.water.daysWithRecord > 0) {
      const trend = trendOf(current.water.metDays, previous.water.metDays);
      rows.push({
        key: "agua",
        label: "Agua",
        trend,
        text: `${trendWord(trend)}: ${dayCount(current.water.metDays)} con la meta (antes ${previous.water.metDays}).`
      });
    } else {
      rows.push({ key: "agua", label: "Agua", trend: "none", text: NO_PREVIOUS });
    }
  }

  if (previous.sleep.daysWithRecord > 0) {
    const trend = trendOf(current.sleep.metDays, previous.sleep.metDays);
    rows.push({
      key: "sueno",
      label: "Sueño",
      trend,
      text: `${trendWord(trend)}: ${dayCount(current.sleep.metDays)} con la meta (antes ${previous.sleep.metDays}).`
    });
  } else {
    rows.push({ key: "sueno", label: "Sueño", trend: "none", text: NO_PREVIOUS });
  }

  if (previous.activity.activeDays > 0) {
    const trend = trendOf(current.activity.totalMinutes, previous.activity.totalMinutes);
    rows.push({
      key: "actividad",
      label: "Actividad",
      trend,
      text: `${trendWord(trend)}: ${current.activity.totalMinutes} min (antes ${previous.activity.totalMinutes}).`
    });
  } else {
    rows.push({ key: "actividad", label: "Actividad", trend: "none", text: NO_PREVIOUS });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Consejo de la semana
// ---------------------------------------------------------------------------

export interface WeekTip {
  title: string;
  text: string;
  action: { tab: string; label: string } | null;
}

export function buildWeekTip(summary: WeekSummary, activityGoalMinutes: number, waterRestricted: boolean): WeekTip {
  const { doses, water, sleep, activity } = summary;

  const hasRecords =
    doses.taken + doses.skipped > 0 ||
    water.daysWithRecord > 0 ||
    sleep.daysWithRecord > 0 ||
    activity.activeDays > 0;

  if (!hasRecords) {
    return {
      title: "Empieza con algo pequeño",
      text: "Registra hoy tus vasos de agua. Con un solo dato ya podrás ver cómo va tu semana.",
      action: { tab: "agua", label: "Registrar agua" }
    };
  }

  const areas: { score: number; tip: WeekTip }[] = [];

  if (doses.scheduled > 0) {
    areas.push({
      score: doses.taken / doses.scheduled,
      tip: {
        title: "Tus medicamentos",
        text: "Te faltaron tomas esta semana. Dejar las medicinas a la vista puede ayudarte a recordarlas. Si se te olvidan seguido, coméntalo con tu médico.",
        action: { tab: "medicamentos", label: "Ver mis tomas" }
      }
    });
  }

  if (!waterRestricted) {
    areas.push({
      score: water.metDays / 7,
      tip: {
        title: "Tu agua",
        text: `Pocos días llegaste a ${WATER_GOAL_GLASSES} vasos. Prueba tomar un vaso al despertar y otro con cada comida.`,
        action: { tab: "agua", label: "Registrar agua" }
      }
    });
  }

  areas.push({
    score: sleep.metDays / 7,
    tip: {
      title: "Tu descanso",
      text: `Pocos días dormiste ${SLEEP_GOAL_HOURS} horas o más. Intenta acostarte a la misma hora todos los días.`,
      action: { tab: "agua", label: "Registrar sueño" }
    }
  });

  if (activityGoalMinutes > 0) {
    areas.push({
      score: activity.totalMinutes / activityGoalMinutes,
      tip: {
        title: "Tu actividad",
        text: "Aún no llegas a tu meta de la semana. Una caminata corta suma. Consulta a tu médico antes de aumentar la actividad.",
        action: { tab: "actividad", label: "Registrar actividad" }
      }
    });
  }

  const weakest = areas.reduce((lowest, area) => (area.score < lowest.score ? area : lowest));

  if (weakest.score >= 1) {
    return {
      title: "¡Semana completa!",
      text: "Cumpliste todas tus metas de estos 7 días. Sigue así.",
      action: null
    };
  }

  return weakest.tip;
}
