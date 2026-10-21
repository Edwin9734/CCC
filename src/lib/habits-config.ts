import { addDays, dateInAppTimeZone, isoWeekday } from "@/lib/date-utils";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";
import type { ActivityRow, DailyHabitValues, IntakeRow, IntakeStatus } from "@/lib/supabase/habits";

// Metas generales de referencia. Para cambiarlas, edita solo estos números.
// No reemplazan la indicación del médico (por ejemplo, si limitó los líquidos).
export const WATER_GOAL_GLASSES = 6; // con 6 vasos o más la meta cuenta como cumplida
export const WATER_RANGE_TEXT = "6 a 8 vasos";
export const WATER_MAX_GLASSES = 30;
export const SLEEP_GOAL_HOURS = 7;
export const ACTIVITY_WEEKLY_GOAL_MINUTES = 150;

export const ACTIVITY_TYPES: { key: string; label: string }[] = [
  { key: "caminata", label: "Caminata" },
  { key: "bicicleta", label: "Bicicleta" },
  { key: "natacion", label: "Natación" },
  { key: "ejercicios_casa", label: "Ejercicios en casa" },
  { key: "estiramientos", label: "Estiramientos o movilidad" },
  { key: "baile", label: "Baile" },
  { key: "jardineria", label: "Jardinería" },
  { key: "otra", label: "Otra" }
];

export function activityLabel(key: string) {
  return ACTIVITY_TYPES.find((type) => type.key === key)?.label ?? key;
}

export function formatHours(hours: number) {
  return hours.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

export interface Dose {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  time: string; // "HH:MM"
  status: IntakeStatus | null;
  due: boolean; // true si la hora de la toma ya pasó
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

function scheduleDays(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) return ALL_DAYS;
  const days = raw.map((d) => Number(d)).filter((d) => d >= 1 && d <= 7);
  return days.length > 0 ? days : ALL_DAYS;
}

function createdLocalDate(createdAt: string | null | undefined): string {
  if (!createdAt) return "0000-00-00";
  const d = new Date(createdAt);
  return Number.isNaN(d.getTime()) ? "0000-00-00" : dateInAppTimeZone(d);
}

// Tomas programadas para un día, según los horarios registrados.
// No cuenta días anteriores a la fecha en que se registró el horario.
export function buildDoses(
  medications: MedicationWithSchedules[],
  intakes: IntakeRow[],
  date: string,
  today: string,
  nowMinutes: number
): Dose[] {
  const weekday = isoWeekday(date);
  const doses: Dose[] = [];

  for (const med of medications) {
    for (const schedule of med.medication_schedules) {
      if (!scheduleDays(schedule.repeat_days).includes(weekday)) continue;
      if (date < createdLocalDate(schedule.created_at)) continue;

      const time = schedule.time_of_day.slice(0, 5);
      const [hours, minutes] = time.split(":").map(Number);
      const intake = intakes.find((i) => i.schedule_id === schedule.id && i.intake_date === date);

      doses.push({
        scheduleId: schedule.id,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        time,
        status: intake ? intake.status : null,
        due: date < today || (date === today && hours * 60 + minutes <= nowMinutes)
      });
    }
  }

  return doses.sort(
    (a, b) => a.time.localeCompare(b.time) || a.medicationName.localeCompare(b.medicationName)
  );
}

export interface WeekSummary {
  doses: { scheduled: number; taken: number; skipped: number };
  water: { metDays: number; daysWithRecord: number };
  sleep: { average: number | null; daysWithRecord: number; metDays: number };
  activity: { totalMinutes: number; activeDays: number };
}

// Resumen de los últimos 7 días (incluido hoy).
export function computeWeekSummary({
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
}): WeekSummary {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));

  let scheduled = 0;
  let taken = 0;
  let skipped = 0;
  let waterMet = 0;
  let waterRecorded = 0;
  let sleepSum = 0;
  let sleepCount = 0;
  let sleepMet = 0;

  for (const day of days) {
    for (const dose of buildDoses(medications, intakes, day, today, nowMinutes)) {
      // Una toma cuenta si su hora ya pasó o si ya fue marcada.
      if (!(dose.due || dose.status !== null)) continue;
      scheduled += 1;
      if (dose.status === "taken") taken += 1;
      else if (dose.status === "skipped") skipped += 1;
    }

    const habit = habits[day];
    if (habit) {
      if (habit.water_glasses > 0) waterRecorded += 1;
      if (habit.water_glasses >= WATER_GOAL_GLASSES) waterMet += 1;
      if (habit.sleep_hours !== null) {
        sleepSum += habit.sleep_hours;
        sleepCount += 1;
        if (habit.sleep_hours >= SLEEP_GOAL_HOURS) sleepMet += 1;
      }
    }
  }

  const inWeek = activities.filter((a) => a.activity_date >= days[0] && a.activity_date <= today);
  const totalMinutes = inWeek.reduce((sum, a) => sum + a.minutes, 0);
  const activeDays = new Set(inWeek.map((a) => a.activity_date)).size;

  return {
    doses: { scheduled, taken, skipped },
    water: { metDays: waterMet, daysWithRecord: waterRecorded },
    sleep: {
      average: sleepCount > 0 ? sleepSum / sleepCount : null,
      daysWithRecord: sleepCount,
      metDays: sleepMet
    },
    activity: { totalMinutes, activeDays }
  };
}