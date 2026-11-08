import { addDays, isoWeekday, parseDateOnly } from "@/lib/date-utils";
import { WEEKDAY_LETTERS, WEEKDAY_NAMES } from "@/lib/habits-insights";

export const ROUTINE_MAX_AMOUNT = 1440;

export type RoutineKind = "healthy" | "vice";

export interface RoutineItem {
  key: string;
  kind: RoutineKind;
  label: string;
  unit: string; // en plural
  unitOne: string; // en singular
  step: number; // cuánto suma cada toque
  showHours?: boolean; // agrega botones de una hora y muestra el total en horas
}

export interface ViceInfo {
  why: string;
  tips: string[];
}

const minutes = { unit: "min", unitOne: "min", step: 15 };

export const HEALTHY_ITEMS: RoutineItem[] = [
  { key: "lectura", kind: "healthy", label: "Lectura", ...minutes },
  { key: "meditacion", kind: "healthy", label: "Meditación", ...minutes },
  { key: "escritura", kind: "healthy", label: "Escribir", ...minutes },
  { key: "trabajo", kind: "healthy", label: "Trabajo", ...minutes, showHours: true },
  { key: "oracion", kind: "healthy", label: "Oración", ...minutes },
  { key: "musica", kind: "healthy", label: "Música", ...minutes },
  { key: "manualidades", kind: "healthy", label: "Manualidades", ...minutes },
  { key: "juegos_mente", kind: "healthy", label: "Juegos de mente", ...minutes },
  { key: "familia", kind: "healthy", label: "Familia y amigos", ...minutes },
  { key: "aire_libre", kind: "healthy", label: "Aire libre", ...minutes },
  { key: "voluntariado", kind: "healthy", label: "Ayudar a otros", ...minutes },
  { key: "aprender", kind: "healthy", label: "Aprender algo", ...minutes }
];

const times = { unit: "veces", unitOne: "vez", step: 1 };

export const VICE_ITEMS: RoutineItem[] = [
  { key: "fumar", kind: "vice", label: "Fumar", unit: "cigarros", unitOne: "cigarro", step: 1 },
  { key: "alcohol", kind: "vice", label: "Alcohol", unit: "tragos", unitOne: "trago", step: 1 },
  { key: "drogas", kind: "vice", label: "Drogas", ...times },
  { key: "energizantes", kind: "vice", label: "Energizantes", unit: "latas", unitOne: "lata", step: 1 },
  { key: "celular", kind: "vice", label: "Revisar el celular", ...minutes },
  { key: "television", kind: "vice", label: "Televisión en exceso", ...minutes },
  { key: "cafe", kind: "vice", label: "Mucho café", unit: "tazas", unitOne: "taza", step: 1 },
  { key: "dulces", kind: "vice", label: "Dulces y antojos", unit: "porciones", unitOne: "porción", step: 1 },
  { key: "azar", kind: "vice", label: "Juegos de azar", ...times },
  { key: "automedicacion", kind: "vice", label: "Medicina sin receta", ...times }
];

export const VICE_INFO: Record<string, ViceInfo> = {
  fumar: {
    why: "Fumar baja el colesterol bueno (HDL) y daña las arterias.",
    tips: ["Aleja cigarros y encendedores de la vista.", "Cuando den ganas, espera 5 minutos y toma agua."]
  },
  alcohol: {
    why: "El alcohol sube los triglicéridos y puede interferir con tus medicinas.",
    tips: ["Decide antes cuánto vas a tomar.", "Cambia la bebida por agua con limón."]
  },
  drogas: {
    why: "Las drogas pueden dañar el corazón y ser peligrosas junto con tus medicinas.",
    tips: ["Cuéntale a alguien de confianza.", "Pide ayuda a tu médico: no tienes que hacerlo sin apoyo."]
  },
  energizantes: {
    why: "Tienen mucha cafeína y azúcar, y pueden acelerar el corazón y subir la presión.",
    tips: ["Cámbialos por agua o una fruta.", "Si estás cansado, prueba una caminata corta o dormir mejor."]
  },
  celular: {
    why: "Revisarlo sin parar cansa la vista, roba descanso y tiempo con los demás.",
    tips: ["Déjalo en otro cuarto a la hora de comer.", "Apágalo una hora antes de dormir."]
  },
  television: {
    why: "Muchas horas sentado reducen tu movimiento diario.",
    tips: ["Elige un programa y apaga al terminar.", "Levántate y camina en los comerciales."]
  },
  cafe: {
    why: "Demasiado café puede quitar el sueño y acelerar el corazón.",
    tips: ["Evita el café por la tarde.", "Alterna con té sin azúcar o agua."]
  },
  dulces: {
    why: "El exceso de azúcar sube los triglicéridos.",
    tips: ["Ten fruta a la mano para el antojo.", "No guardes dulces a la vista."]
  },
  azar: {
    why: "Puede traer deudas, angustia y problemas con la familia.",
    tips: ["Deja el dinero extra en casa.", "Habla con alguien de confianza sobre lo que sientes."]
  },
  automedicacion: {
    why: "Tomar medicinas sin receta puede chocar con las tuyas y hacerte daño.",
    tips: ["Pregunta a tu médico o farmacéutico antes de tomar algo nuevo.", "Guarda solo las medicinas que te recetaron."]
  }
};

export const ROUTINE_ITEMS = [...HEALTHY_ITEMS, ...VICE_ITEMS];
const ITEM_BY_KEY = new Map(ROUTINE_ITEMS.map((item) => [item.key, item]));

export function routineItem(key: string): RoutineItem | undefined {
  return ITEM_BY_KEY.get(key);
}

export function formatAmount(item: RoutineItem, amount: number) {
  if (item.showHours && amount >= 60) {
    const hours = Math.floor(amount / 60);
    const rest = amount % 60;
    return rest > 0 ? `${hours} h ${rest} min` : `${hours} h`;
  }
  return `${amount} ${amount === 1 ? item.unitOne : item.unit}`;
}

// entries[fecha][clave] = cantidad registrada
export type RoutineEntries = Record<string, Record<string, number>>;

export type GoalMode = "quit" | "reduce";

export interface RoutineGoal {
  id: string;
  item_key: string;
  mode: GoalMode;
  daily_limit: number | null;
  replacement_key: string | null;
  started_on: string;
}

export function amountOn(entries: RoutineEntries, date: string, key: string) {
  return entries[date]?.[key] ?? 0;
}

function dayDifference(from: string, to: string) {
  return Math.round((parseDateOnly(to).getTime() - parseDateOnly(from).getTime()) / 86400000);
}

// Días completos sin consumo desde que empezó el plan o desde la última vez que se registró.
// `lastUseBefore` es la última vez anterior a los días cargados en `entries`.
export function daysFree(
  goal: RoutineGoal,
  today: string,
  entries: RoutineEntries,
  lastUseBefore: string | null
): number {
  let lastUse = lastUseBefore;

  for (const [date, values] of Object.entries(entries)) {
    if (date <= today && (values[goal.item_key] ?? 0) > 0 && (!lastUse || date > lastUse)) {
      lastUse = date;
    }
  }

  if (lastUse === today) return 0;
  const from = lastUse && addDays(lastUse, 1) > goal.started_on ? addDays(lastUse, 1) : goal.started_on;
  return Math.max(0, dayDifference(from, today));
}

export type GoalDayState = "ok" | "over" | "none";

export interface GoalDay {
  date: string;
  letter: string;
  dayName: string;
  state: GoalDayState;
}

export function goalWeek(goal: RoutineGoal, today: string, entries: RoutineEntries): GoalDay[] {
  const limit = goal.mode === "quit" ? 0 : (goal.daily_limit ?? 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const weekday = isoWeekday(date) - 1;
    let state: GoalDayState = "none";
    if (date >= goal.started_on) {
      state = amountOn(entries, date, goal.item_key) > limit ? "over" : "ok";
    }
    return { date, letter: WEEKDAY_LETTERS[weekday], dayName: WEEKDAY_NAMES[weekday], state };
  });
}

// Tamaño de la planta del plan: 0 semilla, 1 brote, 2 hojas, 3 flor.
export function plantStage(goal: RoutineGoal, days: number, week: GoalDay[]): 0 | 1 | 2 | 3 {
  if (goal.mode === "reduce") {
    const okDays = week.filter((day) => day.state === "ok").length;
    if (okDays >= 7) return 3;
    if (okDays >= 4) return 2;
    return okDays >= 1 ? 1 : 0;
  }

  if (days >= 30) return 3;
  if (days >= 7) return 2;
  return days >= 1 ? 1 : 0;
}

export function encouragementFor(days: number) {
  if (days === 0) return "Hoy es un buen día para empezar. Un tropiezo no borra tu esfuerzo.";
  if (days < 3) return "Los primeros días son los más difíciles. Vas muy bien.";
  if (days < 7) return "Cada día te acerca a sentirte mejor. Sigue así.";
  if (days < 30) return "¡Más de una semana! Tu cuerpo te lo agradece.";
  return "¡Qué gran logro! Eres un ejemplo de constancia.";
}

const PHRASES = [
  "Unas páginas al día abren ventanas nuevas.",
  "Cada pequeño hábito cuida tu corazón.",
  "Nunca es tarde para aprender algo nuevo.",
  "Respirar con calma también es cuidarte.",
  "Hoy puedes hacer algo bueno por ti.",
  "Compartir tiempo con otros alegra el alma.",
  "Lo que haces a diario construye tu bienestar.",
  "Un paso pequeño sigue siendo un paso."
];

export function phraseOfDay(date: string) {
  return PHRASES[Number(date.replaceAll("-", "")) % PHRASES.length];
}

// Propone una actividad positiva: primero las que reemplazan un vicio, luego la Lectura,
// y si no, la que menos se ha hecho en la semana.
export function suggestPositive(
  entries: RoutineEntries,
  date: string,
  today: string,
  goals: RoutineGoal[]
): RoutineItem {
  const replacement = goals
    .map((goal) => (goal.replacement_key ? routineItem(goal.replacement_key) : undefined))
    .find((item) => item && amountOn(entries, date, item.key) === 0);
  if (replacement) return replacement;

  const lectura = HEALTHY_ITEMS[0];
  if (amountOn(entries, date, lectura.key) === 0) return lectura;

  const weekTotal = (item: RoutineItem) =>
    Array.from({ length: 7 }, (_, index) => amountOn(entries, addDays(today, -index), item.key)).reduce(
      (sum, value) => sum + value,
      0
    );

  return HEALTHY_ITEMS.reduce((least, item) => (weekTotal(item) < weekTotal(least) ? item : least));
}

export function healthyMinutesOn(entries: RoutineEntries, date: string) {
  return HEALTHY_ITEMS.reduce((sum, item) => sum + amountOn(entries, date, item.key), 0);
}
