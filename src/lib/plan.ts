import { METRIC_LABELS, getStatusLabel, type LipidMetric } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import { SLEEP_GOAL_HOURS, WATER_GOAL_GLASSES, WATER_RANGE_TEXT } from "@/lib/habits-config";
import { formatDate } from "@/lib/date-utils";

// ---------------------------------------------------------------------------
// Nivel de riesgo
// ---------------------------------------------------------------------------

export type RiskLevel = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export const RISK_LABELS: Record<RiskLevel, string> = {
  NONE: "Sin datos",
  LOW: "Bajo",
  MODERATE: "Moderado",
  HIGH: "Alto",
  CRITICAL: "Crítico"
};

export const RISK_MESSAGES: Record<RiskLevel, string> = {
  NONE: "Aún no tienes mediciones registradas, así que no podemos calcular tu nivel. Mientras tanto, te mostramos un plan general y prudente.",
  LOW: "Tus últimas mediciones están en rango. Mantén tus hábitos y sigue haciéndote tus controles.",
  MODERATE:
    "Algún valor está en alerta o por debajo de lo recomendado. Con cambios en tus hábitos puedes mejorarlo; coméntalo en tu próxima consulta.",
  HIGH: "Algún valor está alto o muy alto. Sigue las indicaciones de tu médico y revisa este plan; si aún no lo has consultado, programa una cita pronto.",
  CRITICAL:
    "Tienes al menos un valor crítico. Lo más importante ahora es consultar a un médico lo antes posible; este plan es solo un apoyo."
};

export const RISK_DISCLAIMER =
  "Este nivel solo toma en cuenta tu colesterol (HDL, LDL y triglicéridos). No es un cálculo médico de riesgo cardiovascular, porque no considera tu edad, tu presión arterial, si tienes diabetes ni si fumas. Es orientativo: solo tu médico puede evaluar tu riesgo real.";

// Metas de colesterol (mismo criterio que usa el sistema para marcar "Normal").
export const LDL_GOAL = 100;
export const TRIGLYCERIDES_GOAL = 150;
export const HDL_GOAL = 40;

const METRIC_ORDER: LipidMetric[] = ["LDL", "TRIGLYCERIDES", "HDL"];

type LatestByMetric = Partial<Record<LipidMetric, MeasurementWithStatus>>;

export function getLatestByMetric(measurements: MeasurementWithStatus[]): LatestByMetric {
  const result: LatestByMetric = {};
  for (const m of measurements) {
    const current = result[m.metric];
    if (
      !current ||
      m.measured_at > current.measured_at ||
      (m.measured_at === current.measured_at && m.created_at > current.created_at)
    ) {
      result[m.metric] = m;
    }
  }
  return result;
}

// 0 = en rango, 1 = en alerta o bajo, 2 = alto o muy alto, 3 = crítico
function severityOf(status: string): number {
  switch (status) {
    case "CRITICAL":
      return 3;
    case "HIGH":
    case "VERY_HIGH":
      return 2;
    case "BORDERLINE":
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

export function computeRiskLevel(latest: LatestByMetric): RiskLevel {
  const severities = METRIC_ORDER.flatMap((metric) => {
    const m = latest[metric];
    return m ? [severityOf(m.status)] : [];
  });

  if (severities.length === 0) return "NONE";

  const max = Math.max(...severities);
  if (max >= 3) return "CRITICAL";
  if (max === 2) return "HIGH";
  if (max === 1) return "MODERATE";
  return "LOW";
}

export function getRiskLevel(measurements: MeasurementWithStatus[]): RiskLevel {
  return computeRiskLevel(getLatestByMetric(measurements));
}

// ---------------------------------------------------------------------------
// Metas
// ---------------------------------------------------------------------------

export interface CholesterolGoal {
  metric: LipidMetric;
  label: string;
  targetText: string;
  status: string | null;
  statusLabel: string | null;
  valueText: string | null;
  dateText: string | null;
  met: boolean | null;
  gapText: string;
}

export interface HabitGoal {
  key: "water" | "sleep" | "activity";
  label: string;
  target: string;
  note: string;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function buildGoal(metric: LipidMetric, latest: LatestByMetric): CholesterolGoal {
  const targetText =
    metric === "HDL"
      ? `${HDL_GOAL} mg/dL o más`
      : `Menos de ${metric === "LDL" ? LDL_GOAL : TRIGLYCERIDES_GOAL} mg/dL`;
  const base = { metric, label: METRIC_LABELS[metric], targetText };

  const m = latest[metric];
  if (!m) {
    return {
      ...base,
      status: null,
      statusLabel: null,
      valueText: null,
      dateText: null,
      met: null,
      gapText: "Aún no tienes una medición de este indicador."
    };
  }

  const value = Number(m.value);
  let met: boolean;
  let gapText: string;

  if (metric === "HDL") {
    met = value >= HDL_GOAL;
    gapText = met ? "Meta cumplida" : `Te faltan ${fmt(round1(HDL_GOAL - value))} mg/dL por subir`;
  } else {
    const goal = metric === "LDL" ? LDL_GOAL : TRIGLYCERIDES_GOAL;
    met = value < goal;
    const gap = round1(value - goal);
    gapText = met
      ? "Meta cumplida"
      : gap > 0
        ? `Te faltan ${fmt(gap)} mg/dL por bajar`
        : "Estás justo en el límite: baja un poco más";
  }

  return {
    ...base,
    status: m.status,
    statusLabel: getStatusLabel(m.status),
    valueText: fmt(value),
    dateText: formatDate(m.measured_at),
    met,
    gapText
  };
}

// ---------------------------------------------------------------------------
// Rutinas de ejercicio
// ---------------------------------------------------------------------------

export interface RoutineDay {
  day: string;
  activity: string;
  minutes: number; // 0 = descanso
}

export interface Routine {
  key: "gentle" | "active";
  name: string;
  intro: string;
  days: RoutineDay[];
  weeklyMinutes: number;
}

function makeRoutine(base: Omit<Routine, "weeklyMinutes">): Routine {
  return { ...base, weeklyMinutes: base.days.reduce((sum, d) => sum + d.minutes, 0) };
}

const GENTLE_ROUTINE = makeRoutine({
  key: "gentle",
  name: "Inicio suave",
  intro:
    "Para empezar poco a poco. Ve a tu ritmo, descansa cuando lo necesites y, si te sientes bien, aumenta unos minutos cada semana.",
  days: [
    { day: "Lunes", activity: "Caminata suave", minutes: 15 },
    { day: "Martes", activity: "Estiramientos y movilidad de hombros, cadera y tobillos", minutes: 15 },
    { day: "Miércoles", activity: "Caminata suave", minutes: 15 },
    { day: "Jueves", activity: "Descanso", minutes: 0 },
    { day: "Viernes", activity: "Caminata suave, un poco más larga", minutes: 20 },
    {
      day: "Sábado",
      activity: "Ejercicios en casa con apoyo de una silla: sentarte y levantarte, y subir los brazos",
      minutes: 15
    },
    { day: "Domingo", activity: "Paseo tranquilo", minutes: 10 }
  ]
});

const ACTIVE_ROUTINE = makeRoutine({
  key: "active",
  name: "Activa",
  intro:
    "Para mantenerte activo. Debes poder conversar mientras te mueves; si te falta el aire para hablar, baja el ritmo.",
  days: [
    { day: "Lunes", activity: "Caminata a paso ligero", minutes: 30 },
    {
      day: "Martes",
      activity: "Ejercicios de fuerza suaves en casa (con el peso de tu cuerpo o bandas elásticas)",
      minutes: 20
    },
    { day: "Miércoles", activity: "Caminata a paso ligero o bicicleta", minutes: 30 },
    { day: "Jueves", activity: "Estiramientos y ejercicios de equilibrio", minutes: 20 },
    { day: "Viernes", activity: "Caminata a paso ligero", minutes: 30 },
    { day: "Sábado", activity: "Una actividad que disfrutes: baile, natación o jardinería", minutes: 20 },
    { day: "Domingo", activity: "Descanso", minutes: 0 }
  ]
});

// Nivel alto, crítico o sin datos: inicio suave. Nivel bajo o moderado: rutina activa.
export function getRoutineForLevel(level: RiskLevel): Routine {
  return level === "LOW" || level === "MODERATE" ? ACTIVE_ROUTINE : GENTLE_ROUTINE;
}

// Meta semanal de actividad (la usa también la sección Hábitos).
export function getActivityGoalMinutes(level: RiskLevel): number {
  return getRoutineForLevel(level).weeklyMinutes;
}

export const EXERCISE_SAFETY: string[] = [
  "Calienta 5 minutos antes (camina despacio y mueve hombros, caderas y tobillos) y termina con estiramientos suaves.",
  "Usa calzado cómodo y toma agua, salvo que tu médico haya limitado tus líquidos.",
  "Detente y descansa si sientes mareo, dolor en las articulaciones o cansancio fuerte.",
  "Detente de inmediato y busca atención de emergencia si sientes dolor o presión en el pecho, falta de aire intensa, desmayo o latidos muy irregulares.",
  "No hagas ejercicio si tienes fiebre o te sientes mal ese día."
];

// ---------------------------------------------------------------------------
// Plan de alimentación según el nivel
// ---------------------------------------------------------------------------

export interface DietPlan {
  headline: string;
  redRule: string;
  yellowRule: string;
  goodIds: string[];
  limitIds: string[];
  tips: string[];
  omittedCount: number;
}

type DietTemplate = Omit<DietPlan, "omittedCount">;

const DIET_PLANS: Record<RiskLevel, DietTemplate> = {
  NONE: {
    headline: "Alimentación general",
    redRule: "Los alimentos en rojo, solo de forma ocasional.",
    yellowRule: "Los alimentos en amarillo, con moderación.",
    goodIds: ["avena", "legumbres", "pescados-grasos", "verduras", "frutas-pectina", "aceite-oliva", "agua"],
    limitIds: ["frituras", "embutidos", "gaseosas", "reposteria"],
    tips: ["Registra tus mediciones para recibir un plan ajustado a tu nivel."]
  },
  LOW: {
    headline: "Mantén una alimentación balanceada",
    redRule: "Los alimentos en rojo, solo de forma ocasional y en porciones pequeñas.",
    yellowRule: "Los alimentos en amarillo, con moderación.",
    goodIds: ["avena", "legumbres", "pescados-grasos", "verduras", "frutas-pectina", "aceite-oliva", "agua"],
    limitIds: ["frituras", "embutidos", "gaseosas", "reposteria"],
    tips: ["Incluye pescado 2 veces por semana.", "Elige panes y arroz integrales cuando puedas."]
  },
  MODERATE: {
    headline: "Ajusta tu alimentación para mejorar tus valores",
    redRule: "Reduce los alimentos en rojo a pocas veces al mes y en porciones pequeñas.",
    yellowRule: "Los alimentos en amarillo, con moderación y sin repetirlos todos los días.",
    goodIds: [
      "avena",
      "legumbres",
      "pescados-grasos",
      "verduras",
      "frutas-pectina",
      "nueces",
      "aceite-oliva",
      "aguacate",
      "agua"
    ],
    limitIds: [
      "frituras",
      "embutidos",
      "mantequilla-manteca",
      "reposteria",
      "gaseosas",
      "jugos-industriales",
      "comida-rapida"
    ],
    tips: [
      "Cambia la mantequilla y la manteca por aceite de oliva.",
      "Prefiere carnes magras, como pollo sin piel, y cocina al horno, a la plancha o hervido.",
      "Anota tus comidas en el Diario para ver cuánto comes de cada color."
    ]
  },
  HIGH: {
    headline: "Alimentación estricta para bajar tus valores",
    redRule: "Evita los alimentos en rojo.",
    yellowRule: "Los alimentos en amarillo, solo en porciones pequeñas y pocas veces por semana.",
    goodIds: [
      "avena",
      "legumbres",
      "pescados-grasos",
      "verduras",
      "frutas-pectina",
      "nueces",
      "aceite-oliva",
      "soya",
      "agua",
      "te-verde"
    ],
    limitIds: [
      "frituras",
      "embutidos",
      "visceras",
      "mantequilla-manteca",
      "carnes-grasosas",
      "reposteria",
      "comida-rapida",
      "helados",
      "gaseosas",
      "jugos-industriales",
      "alcohol"
    ],
    tips: [
      "Haz que la mitad de tu plato sean verduras.",
      "Evita el alcohol, sobre todo si tus triglicéridos están altos.",
      "Revisa este plan con tu médico o con un nutricionista."
    ]
  },
  CRITICAL: {
    headline: "Alimentación muy estricta, con apoyo de tu médico",
    redRule: "Evita los alimentos en rojo.",
    yellowRule: "Limita los alimentos en amarillo al mínimo.",
    goodIds: ["avena", "legumbres", "pescados-grasos", "verduras", "frutas-pectina", "aceite-oliva", "agua"],
    limitIds: [
      "frituras",
      "embutidos",
      "visceras",
      "mantequilla-manteca",
      "carnes-grasosas",
      "reposteria",
      "comida-rapida",
      "helados",
      "gaseosas",
      "jugos-industriales",
      "alcohol"
    ],
    tips: [
      "Consulta a un médico lo antes posible: esta guía no sustituye su tratamiento.",
      "Sigue la dieta que te indique tu médico o nutricionista; si es distinta a esta, sigue la de ellos."
    ]
  }
};

// ---------------------------------------------------------------------------
// Recomendaciones de estilo de vida
// ---------------------------------------------------------------------------

interface LifestyleTemplate {
  id: string;
  title: string;
  text: string;
  metrics?: LipidMetric[]; // indicadores con los que se relaciona
}

export interface LifestyleItem {
  id: string;
  title: string;
  text: string;
  priority: boolean;
}

const LIFESTYLE: LifestyleTemplate[] = [
  {
    id: "alimentacion",
    title: "Alimentación",
    text: "Prefiere grasas saludables (aceite de oliva, aguacate, nueces) en lugar de mantequilla y manteca, y come más fibra: avena, legumbres, frutas y verduras.",
    metrics: ["LDL"]
  },
  {
    id: "azucar-alcohol",
    title: "Azúcar y alcohol",
    text: "Reduce el azúcar, las gaseosas, los dulces y el alcohol: elevan los triglicéridos.",
    metrics: ["TRIGLYCERIDES"]
  },
  {
    id: "actividad",
    title: "Actividad física",
    text: "Muévete la mayor parte de los días de la semana, aumentando poco a poco. Ayuda a bajar los triglicéridos y a subir el HDL.",
    metrics: ["HDL", "TRIGLYCERIDES"]
  },
  {
    id: "peso",
    title: "Peso",
    text: "Si tienes sobrepeso, bajar un poco de peso mejora tus valores. Hazlo de forma gradual y con apoyo de tu médico o nutricionista.",
    metrics: ["LDL", "TRIGLYCERIDES"]
  },
  {
    id: "tabaco",
    title: "Tabaco",
    text: "Si fumas, dejar de fumar mejora tu HDL y protege tu corazón. Pide ayuda a tu médico para lograrlo.",
    metrics: ["HDL"]
  },
  {
    id: "agua",
    title: "Agua",
    text: "Toma agua durante el día en lugar de bebidas azucaradas, salvo que tu médico te haya limitado los líquidos.",
    metrics: ["TRIGLYCERIDES"]
  },
  {
    id: "sueno",
    title: "Sueño",
    text: `Procura dormir ${SLEEP_GOAL_HOURS} horas o más, con horarios regulares.`
  },
  {
    id: "estres",
    title: "Estrés",
    text: "Dedica unos minutos al día a relajarte: respirar profundo, caminar o conversar con alguien de confianza."
  },
  {
    id: "medicamentos",
    title: "Medicamentos",
    text: "Toma tus medicamentos a la hora indicada y no los suspendas sin hablar con tu médico."
  },
  {
    id: "controles",
    title: "Controles médicos",
    text: "Repite tus análisis cuando tu médico lo indique y lleva tu reporte (puedes descargarlo en Reportes) a tus consultas."
  }
];

// ---------------------------------------------------------------------------
// Plan completo
// ---------------------------------------------------------------------------

export interface PlanData {
  level: RiskLevel;
  levelLabel: string;
  levelMessage: string;
  driversText: string;
  criticalMessages: string[];
  cholesterolGoals: CholesterolGoal[];
  habitGoals: HabitGoal[];
  diet: DietPlan;
  routine: Routine;
  lifestyle: LifestyleItem[];
}

export interface PlanOptions {
  dietLevel?: RiskLevel; // nivel con el que se arma el plan de alimentación (si es distinto al real)
  activityGoalMinutes?: number; // meta semanal de actividad ya ajustada
}

export function buildPlan(
  measurements: MeasurementWithStatus[],
  blockedIds: Set<string>,
  options: PlanOptions = {}
): PlanData {
  const latest = getLatestByMetric(measurements);
  const level = computeRiskLevel(latest);
  const routine = getRoutineForLevel(level);

  const cholesterolGoals = METRIC_ORDER.map((metric) => buildGoal(metric, latest));

  // Indicadores fuera de rango
  const outOfRange = new Set<LipidMetric>(
    METRIC_ORDER.filter((metric) => {
      const m = latest[metric];
      return m !== undefined && severityOf(m.status) >= 1;
    })
  );

  // Qué define el nivel
  let driversText = "";
  if (level === "LOW") {
    driversText = "Todos tus indicadores están en rango.";
  } else if (level !== "NONE") {
    const max = Math.max(
      ...METRIC_ORDER.flatMap((metric) => {
        const m = latest[metric];
        return m ? [severityOf(m.status)] : [];
      })
    );
    const drivers = METRIC_ORDER.flatMap((metric) => {
      const m = latest[metric];
      return m && severityOf(m.status) === max ? [`${METRIC_LABELS[metric]} (${getStatusLabel(m.status)})`] : [];
    });
    driversText = `Lo que define tu nivel: ${drivers.join(", ")}.`;
  }

  const criticalMessages = METRIC_ORDER.flatMap((metric) => {
    const m = latest[metric];
    return m && m.status === "CRITICAL"
      ? [`${METRIC_LABELS[metric]}: ${fmt(Number(m.value))} mg/dL (${formatDate(m.measured_at)}).`]
      : [];
  });

  const habitGoals: HabitGoal[] = [
    {
      key: "water",
      label: "Agua",
      target: `${WATER_RANGE_TEXT} al día`,
      note: "Si tu médico limitó tus líquidos, sigue su indicación."
    },
    {
      key: "sleep",
      label: "Sueño",
      target: `${SLEEP_GOAL_HOURS} horas o más por noche`,
      note: "Con horarios regulares."
    },
    {
      key: "activity",
      label: "Actividad física",
      target: `${options.activityGoalMinutes ?? routine.weeklyMinutes} minutos por semana`,
      note:
        options.activityGoalMinutes !== undefined && options.activityGoalMinutes !== routine.weeklyMinutes
          ? `Ajustada según tu semana anterior (rutina base "${routine.name}": ${routine.weeklyMinutes} min).`
          : `Según tu rutina "${routine.name}".`
    }
  ];

  // Plan de alimentación: no recomendamos alimentos relacionados con tus alergias.
  const template = DIET_PLANS[options.dietLevel ?? level];
  const goodIds = template.goodIds.filter((id) => !blockedIds.has(id));
  const diet: DietPlan = {
    ...template,
    goodIds,
    omittedCount: template.goodIds.length - goodIds.length
  };

  // Estilo de vida: primero lo que se relaciona con tus valores fuera de rango.
  const lifestyle: LifestyleItem[] = LIFESTYLE.map((item) => ({
    id: item.id,
    title: item.title,
    text: item.text,
    priority: item.metrics ? item.metrics.some((metric) => outOfRange.has(metric)) : false
  }));
  lifestyle.sort((a, b) => Number(b.priority) - Number(a.priority));

  return {
    level,
    levelLabel: RISK_LABELS[level],
    levelMessage: RISK_MESSAGES[level],
    driversText,
    criticalMessages,
    cholesterolGoals,
    habitGoals,
    diet,
    routine,
    lifestyle
  };
}