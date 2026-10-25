import type { Sex } from "@/lib/profile";

export type LipidMetric = "HDL" | "LDL" | "TRIGLYCERIDES";
export type LipidStatus =
  | "LOW"
  | "NORMAL"
  | "PROTECTIVE"
  | "BORDERLINE"
  | "HIGH"
  | "VERY_HIGH"
  | "CRITICAL"
  | "UNKNOWN";

export const METRIC_LABELS: Record<LipidMetric, string> = {
  HDL: "HDL (colesterol bueno)",
  LDL: "LDL (colesterol malo)",
  TRIGLYCERIDES: "Triglicéridos"
};

// Valor (mg/dL) desde el cual una medición se considera CRÍTICA.
// El HDL no tiene nivel crítico. Para ajustar los límites, cambia solo estos números.
export const CRITICAL_THRESHOLDS: Partial<Record<LipidMetric, number>> = {
  LDL: 190,
  TRIGLYCERIDES: 500
};

// HDL mínimo recomendado: 50 mg/dL en mujeres y 40 en los demás casos
// (hombres, "Otro" o cuando todavía no hay sexo guardado).
export const HDL_MINIMUM_GENERAL = 40;
export const HDL_MINIMUM_FEMALE = 50;

export function hdlMinimumFor(sex: Sex | null | undefined): number {
  return sex === "female" ? HDL_MINIMUM_FEMALE : HDL_MINIMUM_GENERAL;
}

export function getLipidStatus(metric: LipidMetric, value: number, sex?: Sex | null): LipidStatus {
  const criticalFrom = CRITICAL_THRESHOLDS[metric];
  if (criticalFrom !== undefined && value >= criticalFrom) return "CRITICAL";

  if (metric === "HDL") {
    if (value < hdlMinimumFor(sex)) return "LOW";
    if (value < 60) return "NORMAL";
    return "PROTECTIVE"; // HDL de 60 o más es favorable, no una alerta
  }

  if (metric === "LDL") {
    if (value < 100) return "NORMAL";
    if (value < 130) return "BORDERLINE";
    if (value < 160) return "HIGH";
    return "VERY_HIGH";
  }

  // Triglicéridos
  if (value < 150) return "NORMAL";
  if (value < 200) return "BORDERLINE";
  return "HIGH";
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "LOW":
      return "Bajo";
    case "NORMAL":
      return "Normal";
    case "PROTECTIVE":
      return "Alto (bueno)";
    case "BORDERLINE":
      return "Alerta";
    case "HIGH":
      return "Alto";
    case "VERY_HIGH":
      return "Muy alto";
    case "CRITICAL":
      return "Crítico";
    default:
      return "Sin clasificar";
  }
}

// Estados que cuentan como "alerta activa" (el HDL alto NO cuenta).
export function isAlertStatus(status: string) {
  return status === "BORDERLINE" || status === "HIGH" || status === "VERY_HIGH" || status === "CRITICAL";
}

export const URGENT_CARE_TEXT =
  "Consulta a un médico lo antes posible. Si tienes dolor en el pecho, falta de aire, dolor fuerte de abdomen o te sientes muy mal, busca atención de emergencia de inmediato.";

export interface CriticalMessage {
  title: string;
  message: string;
}

export function buildCriticalMessage(metric: LipidMetric, value: number): CriticalMessage {
  const label = METRIC_LABELS[metric];
  const limit = CRITICAL_THRESHOLDS[metric];
  const limitText = limit !== undefined ? ` El límite crítico es ${limit} mg/dL o más.` : "";

  return {
    title: `Valor crítico: ${label}`,
    message: `Registraste ${value} mg/dL de ${label}.${limitText}`
  };
}