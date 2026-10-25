import type { SupabaseClient } from "@supabase/supabase-js";
import { CONDITIONS, splitConditions } from "@/lib/health-conditions";
import { getLatestByMetric, type CholesterolGoal, type LifestyleItem, type PlanData } from "@/lib/plan";
import { bmiCategory, computeBmi, type ProfileData } from "@/lib/profile";
import { hdlMinimumFor } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import { loadProfileForShell } from "@/lib/supabase/profile";

// Las claves son las de health-conditions.ts.
// Con alguna de estas enfermedades, el médico debe indicar cuántos líquidos se pueden tomar.
export const WATER_RESTRICTING_KEYS = ["renal", "insuficiencia_cardiaca"];

// Con alguna de estas enfermedades, el ejercicio requiere la autorización del médico.
export const CARDIAC_CLEARANCE_KEYS = ["infarto", "cardiopatia", "insuficiencia_cardiaca", "arritmia", "derrame"];

// Con restricción de líquidos no se sugieren estos alimentos de la guía.
export const LIQUID_HIDDEN_IDS: string[] = ["agua", "te-verde"];

const CONDITION_NOTES: Record<string, string> = {
  diabetes:
    "Modera los azúcares y las harinas refinadas, y sigue el control de glucosa que te indique tu médico. Este plan es general: coméntalo con tu médico o nutricionista.",
  prediabetes:
    "Bajar un poco de peso, moverte más y moderar los azúcares y las harinas refinadas ayuda a prevenir la diabetes. Pregunta a tu médico cada cuánto revisar tu glucosa.",
  hipertension:
    "Reduce la sal y los alimentos procesados, y revisa tu presión como te indique tu médico. Si tomas medicamentos para la presión, pregúntale antes de tomar agua de jamaica.",
  cardiopatia:
    "Sigue las indicaciones de tu médico. Antes de empezar la rutina de ejercicio, pregúntale qué actividades y qué intensidad son adecuadas para ti.",
  infarto:
    "Después de un infarto, la alimentación y el ejercicio deben ajustarse con tu médico. No empieces ni aumentes la rutina sin su autorización. Si sientes dolor o presión en el pecho, busca atención de emergencia.",
  insuficiencia_cardiaca:
    "Tu médico debe indicarte cuántos líquidos y cuánta sal puedes consumir, y qué ejercicio es adecuado. Avísale si notas hinchazón, un aumento rápido de peso o falta de aire.",
  arritmia:
    "Pregunta a tu médico qué actividad es segura para ti. Detén el ejercicio y busca atención si sientes latidos muy irregulares, mareo o desmayo.",
  derrame:
    "Después de un derrame o embolia cerebral, el ejercicio y la alimentación deben ajustarse con tu médico. Busca atención de emergencia si notas debilidad de un lado del cuerpo, dificultad para hablar o pérdida repentina de la visión.",
  renal:
    "Tu médico o nutricionista debe indicarte cuánta agua, sal, potasio y proteína puedes consumir. Esta guía no considera esas restricciones: pregunta antes de seguir la lista de alimentos y las recomendaciones de líquidos.",
  higado:
    "Evita el alcohol y consulta a tu médico sobre tu alimentación y sobre cualquier suplemento o producto natural antes de usarlo.",
  hipotiroidismo:
    "El hipotiroidismo puede elevar el colesterol. Mantén los controles de tiroides que te indique tu médico.",
  hipertiroidismo:
    "Pregunta a tu médico qué intensidad de ejercicio es adecuada para ti y mantén tus controles de tiroides.",
  obesidad:
    "Bajar de peso de forma gradual ayuda a mejorar el colesterol. Hazlo con apoyo de tu médico o nutricionista, con cambios que puedas mantener.",
  colesterol_familiar:
    "El colesterol alto hereditario suele necesitar seguimiento médico aunque cuides tu alimentación. Comenta con tu médico si hay otros casos en tu familia.",
  gota: "Modera el alcohol, las vísceras, los embutidos y los mariscos. Pregunta a tu médico qué alimentos debes evitar.",
  asma_epoc:
    "Calienta despacio antes del ejercicio y ajusta el ritmo. Si te falta el aire, detente y sigue las indicaciones de tu médico.",
  apnea:
    "Dormir bien influye en el colesterol y en el peso. Si usas un equipo para dormir, úsalo como te indicaron, y si no descansas bien, coméntalo con tu médico.",
  artritis:
    "Prefiere actividades de bajo impacto (caminar suave, nadar, estiramientos) y descansa si hay dolor en las articulaciones.",
  osteoporosis:
    "Prefiere actividades de bajo impacto y evita movimientos bruscos o con riesgo de caída. Pregunta a tu médico qué ejercicios son seguros para ti.",
  depresion_ansiedad:
    "Moverte, dormir con horarios regulares y comer a tus horas ayuda a sentirte mejor, pero no reemplaza el apoyo profesional. Si te sientes muy mal, habla con tu médico o con alguien de confianza."
};

const DEFAULT_NOTE = "Coméntalo con tu médico para saber cómo ajustar tu alimentación y tu actividad.";

export interface Antecedent {
  key: string;
  label: string;
  note: string;
  highlight: boolean;
}

export interface ProfileExtras {
  hdlMinimum: number;
  hdlSexMissing: boolean;
  waterRestricted: boolean;
  liquidNotice: string | null;
  cardiacClearance: boolean;
  cardiacConditions: string[];
  obesity: boolean;
  bmi: { value: number; category: string } | null;
  antecedents: Antecedent[];
  otherConditions: string[];
}

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels.join("");
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

function fmt(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function bmiText(value: number) {
  return value.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function buildProfileExtras(profile: ProfileData | null, conditionNames: string[]): ProfileExtras {
  const { checked, custom } = splitConditions(conditionNames);
  const marked = CONDITIONS.filter((condition) => checked[condition.key]);

  const waterConditions = marked.filter((condition) => WATER_RESTRICTING_KEYS.includes(condition.key));
  const cardiacConditions = marked.filter((condition) => CARDIAC_CLEARANCE_KEYS.includes(condition.key));
  const waterRestricted = waterConditions.length > 0;

  const liquidNotice = waterRestricted
    ? `Por tus antecedentes (${joinLabels(waterConditions.map((condition) => condition.label.toLowerCase()))}), tu médico debe indicarte cuántos líquidos puedes tomar. Las bebidas y las cantidades de agua de esta guía son generales y pueden no aplicarte.`
    : null;

  let bmi: ProfileExtras["bmi"] = null;
  const weight = profile?.weight_lb;
  const height = profile?.height_cm;
  if (typeof weight === "number" && typeof height === "number") {
    const value = computeBmi(weight, height);
    bmi = { value, category: bmiCategory(value) };
  }

  return {
    hdlMinimum: hdlMinimumFor(profile?.sex),
    hdlSexMissing: !profile?.sex,
    waterRestricted,
    liquidNotice,
    cardiacClearance: cardiacConditions.length > 0,
    cardiacConditions: cardiacConditions.map((condition) => condition.label.toLowerCase()),
    obesity: Boolean(checked["obesidad"]),
    bmi,
    antecedents: marked.map((condition) => ({
      key: condition.key,
      label: condition.label,
      note: CONDITION_NOTES[condition.key] ?? DEFAULT_NOTE,
      highlight: WATER_RESTRICTING_KEYS.includes(condition.key) || CARDIAC_CLEARANCE_KEYS.includes(condition.key)
    })),
    otherConditions: custom
  };
}

// Carga el perfil y las enfermedades de la persona con sesión y arma las reglas.
export async function loadProfileExtras(supabase: SupabaseClient): Promise<ProfileExtras> {
  const { profile, conditions } = await loadProfileForShell(supabase);
  return buildProfileExtras(profile, conditions);
}

function applyHdlGoal(
  goals: CholesterolGoal[],
  extras: ProfileExtras,
  measurements: MeasurementWithStatus[]
): CholesterolGoal[] {
  const latest = getLatestByMetric(measurements).HDL;
  const minimum = extras.hdlMinimum;
  const suffix = extras.hdlSexMissing ? ". Meta general: completa tu sexo en «Mis datos» para ajustarla." : "";

  return goals.map((goal) => {
    if (goal.metric !== "HDL") return goal;

    const targetText = `${minimum} mg/dL o más`;

    if (!latest) {
      return { ...goal, targetText, gapText: `${goal.gapText}${suffix}` };
    }

    const value = Number(latest.value);
    const met = value >= minimum;
    const gapText = met ? "Meta cumplida" : `Te faltan ${fmt(round1(minimum - value))} mg/dL por subir`;

    return { ...goal, targetText, met, gapText: `${gapText}${suffix}` };
  });
}

function applyLifestyle(items: LifestyleItem[], extras: ProfileExtras): LifestyleItem[] {
  const mapped = items.map((item): LifestyleItem => {
    if (item.id === "agua" && extras.waterRestricted) {
      return {
        ...item,
        priority: false,
        text: "Por tus antecedentes, no sigas la meta general de agua: tu médico debe indicarte cuántos líquidos puedes tomar."
      };
    }

    if (item.id === "actividad" && extras.cardiacClearance) {
      return {
        ...item,
        text: `${item.text} Por tus antecedentes, pide la autorización de tu médico antes de empezar o aumentar.`
      };
    }

    if (item.id === "peso") {
      const bmi = extras.bmi;

      if (bmi && bmi.value < 18.5) {
        return {
          ...item,
          priority: true,
          text: `Tu IMC (${bmiText(bmi.value)}) está por debajo de lo habitual. No intentes bajar de peso: coméntalo con tu médico o nutricionista. El IMC es solo una referencia y en adultos mayores es menos preciso.`
        };
      }

      if ((bmi && bmi.value >= 25) || extras.obesity) {
        return {
          ...item,
          priority: true,
          text: bmi
            ? `${item.text} Tu IMC es ${bmiText(bmi.value)} (${bmi.category.toLowerCase()}); es solo una referencia y en adultos mayores es menos preciso.`
            : item.text
        };
      }

      if (bmi) {
        return {
          ...item,
          priority: false,
          text: `${item.text} Tu IMC es ${bmiText(bmi.value)} (${bmi.category.toLowerCase()}); es solo una referencia.`
        };
      }
    }

    return item;
  });

  return mapped.sort((a, b) => Number(b.priority) - Number(a.priority));
}

// Ajusta el plan con los datos del perfil: meta del HDL, agua, estilo de vida e IMC.
export function applyProfileToPlan(
  plan: PlanData,
  extras: ProfileExtras,
  measurements: MeasurementWithStatus[]
): PlanData {
  return {
    ...plan,
    cholesterolGoals: applyHdlGoal(plan.cholesterolGoals, extras, measurements),
    habitGoals: extras.waterRestricted
      ? plan.habitGoals.map((goal) =>
          goal.key === "water"
            ? {
                ...goal,
                target: "Según la indicación de tu médico",
                note: "Por tus antecedentes, tu médico debe indicarte cuánta agua puedes tomar."
              }
            : goal
        )
      : plan.habitGoals,
    diet: extras.waterRestricted
      ? {
          ...plan.diet,
          goodIds: plan.diet.goodIds.filter((id) => !LIQUID_HIDDEN_IDS.includes(id)),
          tips: extras.liquidNotice ? [...plan.diet.tips, extras.liquidNotice] : plan.diet.tips
        }
      : plan.diet,
    lifestyle: applyLifestyle(plan.lifestyle, extras)
  };
}