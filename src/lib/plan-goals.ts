// Metas personales, sugerencias y contenido interactivo de Mi plan.
import { addDays, isoWeekday } from "@/lib/date-utils";
import type { LipidMetric } from "@/lib/ranges";
import type { ActivityRow } from "@/lib/supabase/habits";

export type GoalCategory = "food" | "activity" | "water" | "sleep" | "meds" | "mind" | "other";
export type MarkKind = "shopping" | "tip_fav" | "tip_tried" | "todo";

export interface PlanGoalInput {
  title: string;
  category: GoalCategory;
  days_per_week: number;
  suggestion_key: string | null;
  done_at: string | null;
}

export interface PlanGoalRow extends PlanGoalInput {
  id: string;
  user_id: string;
  created_at: string;
}

export interface PlanGoalCheck {
  goal_id: string;
  check_date: string;
}

export interface PlanMark {
  kind: MarkKind;
  item_key: string;
}

export interface NewActivity {
  activity_date: string;
  activity_type: string;
  minutes: number;
  notes: string | null;
}

export interface PlanApi {
  saveGoal: (input: PlanGoalInput, id?: string) => Promise<PlanGoalRow>;
  deleteGoal: (id: string) => Promise<void>;
  setCheck: (goalId: string, date: string, on: boolean) => Promise<void>;
  setMark: (kind: MarkKind, key: string, on: boolean) => Promise<void>;
  addActivity: (input: NewActivity) => Promise<ActivityRow>;
}

export const GOAL_CATEGORY_OPTIONS: { value: GoalCategory; label: string }[] = [
  { value: "food", label: "Comida" },
  { value: "activity", label: "Movimiento" },
  { value: "water", label: "Agua" },
  { value: "sleep", label: "Sueño" },
  { value: "meds", label: "Medicinas" },
  { value: "mind", label: "Calma" },
  { value: "other", label: "Otra" }
];

export interface GoalSuggestion {
  key: string;
  title: string;
  category: GoalCategory;
  days: number;
  metrics: LipidMetric[];
}

export const GOAL_SUGGESTIONS: GoalSuggestion[] = [
  { key: "avena", title: "Desayunar avena o frijoles", category: "food", days: 5, metrics: ["LDL"] },
  { key: "sin-frituras", title: "Cocinar al horno o a la plancha", category: "food", days: 5, metrics: ["LDL"] },
  { key: "sin-gaseosas", title: "Un día sin gaseosas ni dulces", category: "food", days: 6, metrics: ["TRIGLYCERIDES"] },
  { key: "pescado", title: "Comer pescado", category: "food", days: 2, metrics: ["TRIGLYCERIDES", "HDL"] },
  { key: "caminar", title: "Caminar 20 minutos", category: "activity", days: 5, metrics: ["HDL", "TRIGLYCERIDES"] },
  { key: "verduras", title: "Medio plato de verduras", category: "food", days: 5, metrics: ["LDL", "TRIGLYCERIDES"] },
  { key: "medicinas", title: "Tomar mis medicinas a la hora", category: "meds", days: 7, metrics: [] },
  { key: "dormir", title: "Dormir 7 horas o más", category: "sleep", days: 5, metrics: [] },
  { key: "agua", title: "Un vaso de agua en cada comida", category: "water", days: 6, metrics: [] },
  { key: "calma", title: "10 minutos de calma o respiración", category: "mind", days: 4, metrics: [] }
];

export function suggestionsFor(needs: LipidMetric[], goals: PlanGoalRow[], waterRestricted: boolean) {
  const used = new Set(goals.filter((goal) => !goal.done_at).map((goal) => goal.suggestion_key));
  const score = (item: GoalSuggestion) => item.metrics.filter((metric) => needs.includes(metric)).length;
  return GOAL_SUGGESTIONS.filter((item) => !used.has(item.key) && !(waterRestricted && item.category === "water")).sort(
    (a, b) => score(b) - score(a)
  );
}

export const WEEK_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];
export const WEEK_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function weekDates(today: string) {
  const monday = addDays(today, 1 - isoWeekday(today));
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

// Semanas seguidas (terminando en la pasada, o en esta si ya se cumplió) con los días pedidos.
export function weeksInARow(goal: PlanGoalRow, dates: Set<string>, today: string) {
  const countWeek = (monday: string) =>
    Array.from({ length: 7 }, (_, index) => addDays(monday, index)).filter((day) => dates.has(day)).length;

  const thisMonday = weekDates(today)[0];
  let streak = countWeek(thisMonday) >= goal.days_per_week ? 1 : 0;
  let monday = addDays(thisMonday, -7);
  while (streak < 60 && countWeek(monday) >= goal.days_per_week) {
    streak += 1;
    monday = addDays(monday, -7);
  }
  return streak;
}

export function shortHash(text: string) {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 33) ^ text.charCodeAt(index);
  return (hash >>> 0).toString(36);
}

// ---------- Por qué cada alimento te conviene ----------
export const FOOD_BENEFITS: Record<string, LipidMetric[]> = {
  avena: ["LDL"],
  frijoles: ["LDL"],
  lentejas: ["LDL"],
  manzana: ["LDL"],
  naranja: ["LDL"],
  pera: ["LDL"],
  lechuga: ["LDL", "TRIGLYCERIDES"],
  ayote: ["LDL", "TRIGLYCERIDES"],
  salmon: ["TRIGLYCERIDES", "HDL"],
  sardina: ["TRIGLYCERIDES", "HDL"],
  agua: ["TRIGLYCERIDES"],
  "te-verde": ["LDL"],
  mani: ["LDL", "HDL"],
  almendras: ["LDL", "HDL"],
  "aceite-oliva": ["LDL", "HDL"],
  aguacate: ["LDL", "HDL"]
};

export const BENEFIT_LABEL: Record<LipidMetric, string> = {
  LDL: "Ayuda a bajar LDL",
  TRIGLYCERIDES: "Ayuda con triglicéridos",
  HDL: "Ayuda a subir HDL"
};

export const PLATE_GROUPS: { key: string; label: string; share: string; ids: string[] }[] = [
  { key: "veg", label: "Verduras y frutas", share: "½ plato", ids: ["lechuga", "ayote", "manzana", "naranja", "pera"] },
  { key: "protein", label: "Proteína buena", share: "¼ plato", ids: ["frijoles", "lentejas", "salmon", "sardina"] },
  { key: "energy", label: "Energía sana", share: "¼ plato", ids: ["avena", "aguacate", "aceite-oliva", "mani", "almendras"] }
];

// ---------- Consejos ----------
export const TIP_DETAILS: Record<string, { short: string; steps: string[]; href?: string; linkLabel?: string }> = {
  alimentacion: {
    short: "Más fibra y grasas buenas",
    steps: ["Cocina con aceite de oliva", "Agrega avena o frijoles", "Llena medio plato de verduras"],
    href: "/dietas?tab=guia",
    linkLabel: "Ver la guía"
  },
  "azucar-alcohol": {
    short: "Menos gaseosas y dulces",
    steps: ["Cambia la gaseosa por agua", "Deja el postre para ocasiones", "Evita el alcohol entre semana"],
    href: "/diario",
    linkLabel: "Anotar comidas"
  },
  actividad: {
    short: "Muévete casi todos los días",
    steps: ["Empieza con 10 minutos", "Elige una hora fija", "Suma unos minutos cada semana"],
    href: "/habitos?tab=actividad",
    linkLabel: "Registrar actividad"
  },
  peso: {
    short: "Poco a poco también cuenta",
    steps: ["Sírvete en plato pequeño", "Come sin prisa", "Pésate una vez por semana"]
  },
  tabaco: {
    short: "Tu corazón te lo agradece",
    steps: ["Elige una fecha para dejarlo", "Cuéntale a tu familia", "Pide ayuda a tu médico"]
  },
  agua: {
    short: "Agua en lugar de bebidas dulces",
    steps: ["Deja un vaso a la vista", "Toma uno en cada comida", "Lleva agua al salir"],
    href: "/habitos?tab=agua",
    linkLabel: "Registrar agua"
  },
  sueno: {
    short: "Horarios regulares",
    steps: ["Acuéstate a la misma hora", "Evita el café por la tarde", "Deja el celular antes de dormir"],
    href: "/habitos?tab=agua",
    linkLabel: "Registrar sueño"
  },
  estres: {
    short: "Unos minutos para ti",
    steps: ["Respira profundo 5 veces", "Sal a caminar un rato", "Conversa con alguien de confianza"]
  },
  medicamentos: {
    short: "A la hora, sin suspenderlos",
    steps: ["Pon una alarma", "Déjalos en un lugar visible", "Pregunta a tu médico tus dudas"],
    href: "/habitos?tab=medicamentos",
    linkLabel: "Mis tomas"
  },
  controles: {
    short: "Tus análisis al día",
    steps: ["Anota tu próxima cita", "Lleva tu reporte", "Apunta tus preguntas"],
    href: "/reportes",
    linkLabel: "Ir a Reportes"
  }
};

export const QUIZ: { question: string; answer: boolean; note: string }[] = [
  { question: "El HDL es el colesterol «malo».", answer: false, note: "El HDL es el bueno. El LDL es el que conviene bajar." },
  { question: "La avena ayuda a bajar el LDL.", answer: true, note: "Su fibra soluble ayuda a reducirlo." },
  { question: "Las gaseosas y el alcohol suben los triglicéridos.", answer: true, note: "Por eso conviene reducirlos." },
  { question: "Caminar ayuda a subir el HDL.", answer: true, note: "Moverte seguido también ayuda a bajar los triglicéridos." },
  { question: "Si me siento bien, puedo dejar mi medicina sin avisar.", answer: false, note: "Nunca la suspendas sin hablar con tu médico." }
];

// Tipo de actividad (de Hábitos) que corresponde a cada día de la rutina.
export function activityTypeFor(text: string) {
  const value = text.toLowerCase();
  if (value.startsWith("estiramientos")) return "estiramientos";
  if (value.includes("fuerza") || value.includes("silla")) return "ejercicios_casa";
  if (value.includes("caminata") || value.includes("paseo")) return "caminata";
  return "otra";
}
