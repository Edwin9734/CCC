import { addDays, isoWeekday } from "@/lib/date-utils";
import { DIET_ITEM_BY_ID, type TrafficLight } from "@/lib/diet-data";

// ---------------------------------------------------------------------------
// Reglas del módulo Racha. Para ajustarlas, cambia solo estas constantes.
// ---------------------------------------------------------------------------

// Comida saludable: al menos un alimento verde, ningún rojo y hasta este número de amarillos.
export const HEALTHY_MEAL_MAX_YELLOW = 1;
// Día saludable: al menos este número de comidas distintas (desayuno, refacción, almuerzo, cena)...
export const HEALTHY_DAY_MIN_MEALS = 3;
// ...y como máximo este número de alimentos rojos en todo el día.
export const HEALTHY_DAY_MAX_RED = 1;

const STREAK_GOALS = [3, 7, 14, 30, 60, 100];
const HEALTHY_DAY_GOALS = [1, 7, 14, 30, 90];
const ACTIVITY_GOALS = [1, 5, 10, 25, 50];
const MEASUREMENT_GOALS = [1, 5, 10, 25];

const WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];
const WEEKDAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ---------------------------------------------------------------------------
// Datos de entrada (solo las columnas que hacen falta)
// ---------------------------------------------------------------------------

export interface RachaHabitRow {
  habit_date: string;
  water_glasses: number;
  sleep_hours: number | null;
}

export interface RachaMealRow {
  eaten_on: string;
  meal_type: string;
  food_ids: string[];
}

export interface RachaActivityRow {
  activity_date: string;
  minutes: number;
}

export interface RachaMeasurementRow {
  measured_at: string;
}

export interface RachaRawData {
  habits: RachaHabitRow[];
  meals: RachaMealRow[];
  activities: RachaActivityRow[];
  measurements: RachaMeasurementRow[];
}

// ---------------------------------------------------------------------------
// Datos de salida (lo que dibuja la pantalla)
// ---------------------------------------------------------------------------

export type HeartStatus = "complete" | "grace" | "missed" | "pending" | "future";

export interface WeekHeart {
  date: string;
  letter: string;
  dayName: string;
  status: HeartStatus;
  isToday: boolean;
}

export interface StreakSummary {
  current: number;
  best: number;
  graceAvailable: boolean;
  week: WeekHeart[];
  today: { water: boolean; sleep: boolean; food: boolean; complete: boolean };
}

export type MedalGroupKey = "racha" | "comida" | "ejercicio" | "mediciones";
export type MedalTier = "bronze" | "silver" | "gold";

export interface Medal {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number; // nunca es mayor que goal
  unit: string;
  earnedOn: string | null;
  tier: MedalTier;
}

export interface MedalGroup {
  key: MedalGroupKey;
  title: string;
  description: string;
  medals: Medal[];
}

export type StatsMetric = "meals" | "water" | "sleep" | "activity" | "measurements";
export type StatsValues = Record<StatsMetric, number>;

export interface StatsDay {
  date: string;
  label: string;
  isToday: boolean;
  current: StatsValues | null; // null en los días de esta semana que aún no llegan
  previous: StatsValues; // el mismo día de la semana pasada
}

export interface FoodCounts {
  green: number;
  yellow: number;
  red: number;
  total: number;
}

export interface RachaView {
  today: string;
  streak: StreakSummary;
  waterGlassesToday: number;
  activityMinutesToday: number;
  mealsToday: number;
  medalGroups: MedalGroup[];
  earnedMedals: number;
  totalMedals: number;
  weekDays: StatsDay[];
  weekFoods: FoodCounts;
}

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

export function mondayOf(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

function uniqueSorted(dates: string[], today: string): string[] {
  return Array.from(new Set(dates.filter((date) => date <= today))).sort();
}

function countFoods(foodIds: string[]) {
  const counts: Record<TrafficLight, number> = { green: 0, yellow: 0, red: 0 };
  let known = 0;
  for (const id of foodIds) {
    const item = DIET_ITEM_BY_ID.get(id);
    if (!item) continue;
    counts[item.level] += 1;
    known += 1;
  }
  return { ...counts, known };
}

export function isHealthyMeal(foodIds: string[]): boolean {
  const { green, yellow, red } = countFoods(foodIds);
  return green > 0 && red === 0 && yellow <= HEALTHY_MEAL_MAX_YELLOW;
}

// Un día saludable se decide con los alimentos marcados de la guía: las notas libres no tienen color.
export function isHealthyDay(meals: RachaMealRow[]): boolean {
  const withFoods = meals.filter((meal) => countFoods(meal.food_ids).known > 0);
  const mealTypes = new Set(withFoods.map((meal) => meal.meal_type));
  const red = withFoods.reduce((sum, meal) => sum + countFoods(meal.food_ids).red, 0);
  return mealTypes.size >= HEALTHY_DAY_MIN_MEALS && red <= HEALTHY_DAY_MAX_RED;
}

// Recorre fechas ordenadas y dice cuándo se alcanzó por primera vez cada largo de días seguidos.
function consecutiveRuns(sortedDates: string[]) {
  const reachedOn = new Map<number, string>();
  let run = 0;
  let best = 0;
  let previous: string | null = null;

  for (const date of sortedDates) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    if (!reachedOn.has(run)) reachedOn.set(run, date);
    previous = date;
  }

  return { best, reachedOn };
}

function tierFor(index: number, total: number): MedalTier {
  const position = (index + 1) / total;
  if (position <= 1 / 3) return "bronze";
  if (position <= 2 / 3) return "silver";
  return "gold";
}

function buildMedal(
  index: number,
  total: number,
  medal: Omit<Medal, "tier" | "progress"> & { progress: number }
): Medal {
  return { ...medal, progress: Math.min(medal.progress, medal.goal), tier: tierFor(index, total) };
}

// ---------------------------------------------------------------------------
// Racha
// ---------------------------------------------------------------------------

function computeStreak(completeDays: Set<string>, today: string) {
  const statusByDay = new Map<string, HeartStatus>();
  const reachedOn = new Map<number, string>();
  const sorted = Array.from(completeDays)
    .filter((date) => date <= today)
    .sort();

  let current = 0;
  let best = 0;
  let graceWeek: string | null = null;

  if (sorted.length > 0) {
    for (let day = sorted[0]; day <= today; day = addDays(day, 1)) {
      if (completeDays.has(day)) {
        current += 1;
        best = Math.max(best, current);
        if (!reachedOn.has(current)) reachedOn.set(current, day);
        statusByDay.set(day, "complete");
      } else if (day === today) {
        // Hoy todavía no termina: no suma, pero tampoco rompe la racha.
        statusByDay.set(day, "pending");
      } else if (current > 0 && graceWeek !== mondayOf(day)) {
        // Primer día sin registro de la semana: lo cubre el día de gracia (no suma, no rompe).
        graceWeek = mondayOf(day);
        statusByDay.set(day, "grace");
      } else {
        current = 0;
        statusByDay.set(day, "missed");
      }
    }
  }

  return {
    current,
    best,
    reachedOn,
    statusByDay,
    graceAvailable: graceWeek !== mondayOf(today)
  };
}

function buildWeekHearts(statusByDay: Map<string, HeartStatus>, today: string): WeekHeart[] {
  const monday = mondayOf(today);

  return WEEKDAY_LETTERS.map((letter, index) => {
    const date = addDays(monday, index);
    let status: HeartStatus;
    if (date > today) status = "future";
    else if (date === today) status = statusByDay.get(date) ?? "pending";
    else status = statusByDay.get(date) ?? "missed"; // días anteriores al primer registro completo

    return { date, letter, dayName: WEEKDAY_NAMES[index], status, isToday: date === today };
  });
}

// ---------------------------------------------------------------------------
// Medallas
// ---------------------------------------------------------------------------

function streakMedals(best: number, reachedOn: Map<number, string>): Medal[] {
  const names: Record<number, string> = {
    3: "3 días de racha",
    7: "Una semana de racha",
    14: "Dos semanas de racha",
    30: "Un mes de racha",
    60: "Dos meses de racha",
    100: "100 días de racha"
  };

  return STREAK_GOALS.map((goal, index) =>
    buildMedal(index, STREAK_GOALS.length, {
      id: `racha-${goal}`,
      title: names[goal],
      description: `Mantén tu racha durante ${goal} días.`,
      goal,
      progress: best,
      unit: "días",
      earnedOn: reachedOn.get(goal) ?? null
    })
  );
}

function foodMedals(meals: RachaMealRow[], today: string): Medal[] {
  const past = meals.filter((meal) => meal.eaten_on <= today);

  const healthyMeals = past.filter((meal) => isHealthyMeal(meal.food_ids));
  const firstHealthyMeal = healthyMeals.map((meal) => meal.eaten_on).sort()[0] ?? null;

  const byDay = new Map<string, RachaMealRow[]>();
  for (const meal of past) {
    byDay.set(meal.eaten_on, [...(byDay.get(meal.eaten_on) ?? []), meal]);
  }
  const healthyDays = Array.from(byDay.entries())
    .filter(([, list]) => isHealthyDay(list))
    .map(([date]) => date)
    .sort();
  const { best, reachedOn } = consecutiveRuns(healthyDays);

  const names: Record<number, { title: string; description: string }> = {
    1: { title: "Un día saludable", description: "Completa un día con comidas saludables." },
    7: { title: "Una semana saludable", description: "Come saludable 7 días seguidos." },
    14: { title: "Dos semanas saludables", description: "Come saludable 14 días seguidos." },
    30: { title: "Un mes saludable", description: "Come saludable 30 días seguidos." },
    90: { title: "Tres meses saludables", description: "Come saludable 90 días seguidos." }
  };

  const total = HEALTHY_DAY_GOALS.length + 1;

  return [
    buildMedal(0, total, {
      id: "comida-primera",
      title: "Una comida saludable",
      description: "Registra una comida con alimentos verdes y sin alimentos rojos.",
      goal: 1,
      progress: healthyMeals.length,
      unit: "comida",
      earnedOn: firstHealthyMeal
    }),
    ...HEALTHY_DAY_GOALS.map((goal, index) =>
      buildMedal(index + 1, total, {
        id: `comida-dias-${goal}`,
        title: names[goal].title,
        description: names[goal].description,
        goal,
        progress: best,
        unit: goal === 1 ? "día" : "días",
        earnedOn: reachedOn.get(goal) ?? null
      })
    )
  ];
}

function countMedals({
  dates,
  goals,
  idPrefix,
  firstTitle,
  title,
  description,
  unit
}: {
  dates: string[];
  goals: number[];
  idPrefix: string;
  firstTitle: string;
  title: (goal: number) => string;
  description: (goal: number) => string;
  unit: string;
}): Medal[] {
  return goals.map((goal, index) =>
    buildMedal(index, goals.length, {
      id: `${idPrefix}-${goal}`,
      title: index === 0 ? firstTitle : title(goal),
      description: description(goal),
      goal,
      progress: dates.length,
      unit,
      earnedOn: dates[goal - 1] ?? null
    })
  );
}

// ---------------------------------------------------------------------------
// Vista completa
// ---------------------------------------------------------------------------

export function buildRachaView(raw: RachaRawData, today: string): RachaView {
  const habitByDay = new Map(raw.habits.map((habit) => [habit.habit_date, habit]));
  const mealDays = new Set(raw.meals.map((meal) => meal.eaten_on));

  // Un día cuenta para la racha con agua, sueño y al menos una comida registrados.
  const completeDays = new Set<string>();
  for (const habit of raw.habits) {
    if (habit.water_glasses > 0 && habit.sleep_hours !== null && mealDays.has(habit.habit_date)) {
      completeDays.add(habit.habit_date);
    }
  }

  const streak = computeStreak(completeDays, today);
  const todayHabit = habitByDay.get(today);
  const todayWater = (todayHabit?.water_glasses ?? 0) > 0;
  const todaySleep = todayHabit !== undefined && todayHabit.sleep_hours !== null;
  const todayFood = mealDays.has(today);

  const medalGroups: MedalGroup[] = [
    {
      key: "racha",
      title: "Racha",
      description: "Por registrar agua, sueño y comida día tras día.",
      medals: streakMedals(streak.best, streak.reachedOn)
    },
    {
      key: "comida",
      title: "Comida saludable",
      description: "Por elegir alimentos saludables en tu Diario.",
      medals: foodMedals(raw.meals, today)
    },
    {
      key: "ejercicio",
      title: "Ejercicio",
      description: "Por los días con actividad física. No hace falta que sean seguidos.",
      medals: countMedals({
        dates: uniqueSorted(raw.activities.map((activity) => activity.activity_date), today),
        goals: ACTIVITY_GOALS,
        idPrefix: "ejercicio",
        firstTitle: "Primer día activo",
        title: (goal) => `${goal} días activos`,
        description: (goal) =>
          goal === 1 ? "Registra tu primera actividad física." : `Registra actividad física en ${goal} días distintos.`,
        unit: "días"
      })
    },
    {
      key: "mediciones",
      title: "Mediciones",
      description: "Por llevar el control de tus análisis.",
      medals: countMedals({
        dates: uniqueSorted(raw.measurements.map((measurement) => measurement.measured_at), today),
        goals: MEASUREMENT_GOALS,
        idPrefix: "mediciones",
        firstTitle: "Primera medición",
        title: (goal) => `${goal} fechas de medición`,
        description: (goal) =>
          goal === 1 ? "Registra tu primera medición." : `Registra mediciones en ${goal} fechas distintas.`,
        unit: "fechas"
      })
    }
  ];

  const allMedals = medalGroups.flatMap((group) => group.medals);

  const valuesFor = (date: string): StatsValues => {
    const habit = habitByDay.get(date);
    return {
      meals: raw.meals.filter((meal) => meal.eaten_on === date).length,
      water: habit?.water_glasses ?? 0,
      sleep: habit?.sleep_hours ?? 0,
      activity: raw.activities
        .filter((activity) => activity.activity_date === date)
        .reduce((sum, activity) => sum + activity.minutes, 0),
      measurements: raw.measurements.filter((measurement) => measurement.measured_at === date).length
    };
  };

  // La semana completa, de lunes a domingo, junto al mismo día de la semana pasada.
  const monday = mondayOf(today);
  const weekDays: StatsDay[] = WEEKDAY_SHORT.map((label, index) => {
    const date = addDays(monday, index);
    return {
      date,
      label,
      isToday: date === today,
      current: date <= today ? valuesFor(date) : null,
      previous: valuesFor(addDays(date, -7))
    };
  });

  const weekFoods: FoodCounts = { green: 0, yellow: 0, red: 0, total: 0 };
  for (const meal of raw.meals) {
    if (meal.eaten_on < monday || meal.eaten_on > today) continue;
    const { green, yellow, red, known } = countFoods(meal.food_ids);
    weekFoods.green += green;
    weekFoods.yellow += yellow;
    weekFoods.red += red;
    weekFoods.total += known;
  }

  return {
    today,
    streak: {
      current: streak.current,
      best: streak.best,
      graceAvailable: streak.graceAvailable,
      week: buildWeekHearts(streak.statusByDay, today),
      today: {
        water: todayWater,
        sleep: todaySleep,
        food: todayFood,
        complete: completeDays.has(today)
      }
    },
    waterGlassesToday: todayHabit?.water_glasses ?? 0,
    activityMinutesToday: raw.activities
      .filter((activity) => activity.activity_date === today)
      .reduce((sum, activity) => sum + activity.minutes, 0),
    mealsToday: raw.meals.filter((meal) => meal.eaten_on === today).length,
    medalGroups,
    earnedMedals: allMedals.filter((medal) => medal.earnedOn !== null).length,
    totalMedals: allMedals.length,
    weekDays,
    weekFoods
  };
}
