// Tipos, listas de sugerencias y cálculos del módulo Antecedentes.

export interface RowStore<Row, Input> {
  rows: Row[];
  save: (input: Input, id?: string) => Promise<Row>;
  patch: (id: string, changes: Partial<Input>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

interface RowBase {
  id: string;
  user_id: string;
  created_at: string;
}

// ---------- Medicinas ----------
export type MedicineKind = "medicine" | "natural" | "remedy";
export type UseStatus = "current" | "past";

export interface MedicineInput {
  kind: MedicineKind;
  name: string;
  status: UseStatus;
  purpose: string | null;
  help_level: number | null;
  is_best: boolean;
  has_side_effects: boolean | null;
  side_effects: string[];
  side_effect_notes: string | null;
  ingredients: string[];
  preparation: string | null;
  application: string | null;
}
export type MedicineRow = MedicineInput & RowBase;

export const HELP_LABEL: Record<number, string> = {
  3: "Ayuda mucho",
  2: "Ayuda algo",
  1: "No ayudó"
};

export const SIDE_EFFECT_OPTIONS = [
  "Dolor de estómago",
  "Náuseas o vómito",
  "Mareos",
  "Mucho sueño",
  "Dolor muscular",
  "Dolor de cabeza",
  "Diarrea",
  "Estreñimiento",
  "Comezón o ronchas",
  "Boca seca",
  "Cansancio",
  "Falta de apetito",
  "Palpitaciones",
  "Hinchazón"
];

export const NATURAL_SUGGESTIONS = [
  "Manzanilla",
  "Jengibre",
  "Cúrcuma",
  "Sábila",
  "Valeriana",
  "Eucalipto",
  "Moringa",
  "Linaza",
  "Hierbabuena",
  "Té de limón"
];

export const REMEDY_INGREDIENTS = [
  "Miel",
  "Limón",
  "Ajo",
  "Jengibre",
  "Canela",
  "Manzanilla",
  "Sábila",
  "Cebolla",
  "Bicarbonato",
  "Sal",
  "Aceite de oliva",
  "Eucalipto",
  "Agua caliente",
  "Vinagre de manzana"
];

export const APPLICATION_SUGGESTIONS = [
  "Se toma como té",
  "Se toma en cucharadas",
  "Se unta en la piel",
  "Se hacen gárgaras",
  "Se inhala el vapor",
  "Se pone como compresa"
];

// ---------- Enfermedades ----------
export type ConditionKind = "current" | "past";
export type DurationUnit = "days" | "weeks" | "months" | "years";
export type Trend = "better" | "same" | "worse";

export interface ConditionInput {
  kind: ConditionKind;
  name: string;
  symptoms: string[];
  affected_areas: string[];
  affected_notes: string | null;
  duration_value: number | null;
  duration_unit: DurationUnit | null;
  duration_as_of: string | null;
  trend: Trend | null;
  how_cured: string | null;
  causes: string[];
  cause_notes: string | null;
  ended_year: number | null;
}
export type ConditionRow = ConditionInput & RowBase;

export const CONDITION_SUGGESTIONS: Record<ConditionKind, string[]> = {
  current: ["Diabetes", "Presión alta", "Colesterol alto", "Triglicéridos altos", "Artritis", "Gastritis", "Tiroides", "Asma"],
  past: ["Neumonía", "Dengue", "COVID-19", "Hepatitis", "Anemia", "Infección urinaria", "Cálculos renales", "Apendicitis"]
};

export const SYMPTOM_OPTIONS = [
  "Falta de energía",
  "Falta de apetito",
  "Cansancio",
  "Dolor de cabeza",
  "Mareos",
  "Náuseas o vómito",
  "Dolor de cuerpo",
  "Dolor de articulaciones",
  "Dolor de pecho",
  "Falta de aire",
  "Tos",
  "Fiebre",
  "Hinchazón",
  "Palpitaciones",
  "Visión borrosa",
  "Mucha sed",
  "Orinar seguido",
  "Pérdida de peso",
  "Aumento de peso",
  "Problemas para dormir",
  "Tristeza",
  "Ansiedad",
  "Olvidos",
  "Hormigueo"
];

export const AFFECTED_AREA_OPTIONS = [
  "Dormir",
  "Comer",
  "Caminar",
  "Trabajar",
  "Tareas de la casa",
  "Ánimo",
  "Memoria y concentración",
  "Vida familiar",
  "Amistades y paseos",
  "Dinero y gastos",
  "Vista",
  "Fuerza"
];

export const GENETIC_CAUSE = "Genética o de familia";

export const CAUSE_OPTIONS = [
  GENETIC_CAUSE,
  "Infección o contagio",
  "Alimentación",
  "Agua o comida contaminada",
  "Trabajo o mucho esfuerzo",
  "Accidente o golpe",
  "Estrés o preocupaciones",
  "Tabaco o alcohol",
  "La edad",
  "Clima",
  "Una medicina",
  "No lo sé"
];

export const HOW_CURED_SUGGESTIONS = [
  "Con medicinas",
  "Con una operación",
  "Con reposo",
  "Cambiando la alimentación",
  "Con remedios naturales",
  "Se me quitó sin tratamiento"
];

const UNIT_WORDS: Record<DurationUnit, [string, string]> = {
  days: ["día", "días"],
  weeks: ["semana", "semanas"],
  months: ["mes", "meses"],
  years: ["año", "años"]
};

const DAYS_PER_UNIT: Record<DurationUnit, number> = { days: 1, weeks: 7, months: 30.44, years: 365.25 };

export const UNIT_OPTIONS: { value: DurationUnit; label: string }[] = [
  { value: "days", label: "Días" },
  { value: "weeks", label: "Semanas" },
  { value: "months", label: "Meses" },
  { value: "years", label: "Años" }
];

export function formatDuration(value: number, unit: DurationUnit) {
  return `${value} ${UNIT_WORDS[unit][value === 1 ? 0 : 1]}`;
}

// En una enfermedad actual, suma el tiempo pasado desde el día en que se anotó.
export function agedDuration(row: Pick<ConditionInput, "kind" | "duration_value" | "duration_unit" | "duration_as_of">, today: string | null) {
  const { duration_value: value, duration_unit: unit, duration_as_of: asOf, kind } = row;
  if (value === null || unit === null) return null;
  if (kind !== "current" || !asOf || !today) return value;

  const elapsedDays = Math.max(0, (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${asOf}T00:00:00Z`)) / 86400000);
  return value + Math.floor(elapsedDays / DAYS_PER_UNIT[unit]);
}

export function durationText(row: ConditionInput, today: string | null) {
  const value = agedDuration(row, today);
  if (value === null || row.duration_unit === null) return null;
  const text = formatDuration(value, row.duration_unit);
  return row.kind === "current" ? `Desde hace ${text}` : `Duró ${text}`;
}

// ---------- Exámenes ----------
export type ResultStatus = "normal" | "attention" | "unknown";

export interface ExamInput {
  exam_type: string;
  exam_date: string | null;
  place: string | null;
  reason: string | null;
  result_text: string | null;
  result_status: ResultStatus | null;
}
export type ExamRow = ExamInput & RowBase;

export const EXAM_REASON_SUGGESTIONS = [
  "Control de rutina",
  "Me lo pidió mi médico",
  "Tenía molestias",
  "Seguimiento de una enfermedad",
  "Antes de una operación",
  "Para un trabajo o trámite"
];

// ---------- Utilidades ----------
export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function formatLongDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

export function localToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function cleanText(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesSearch(query: string, fields: (string | null | undefined)[]) {
  const needle = normalize(query.trim());
  if (needle === "") return true;
  return fields.some((field) => field && normalize(field).includes(needle));
}

export function sameText(a: string, b: string) {
  return normalize(a.trim()) === normalize(b.trim());
}
