export type LipidMetric = "HDL" | "LDL" | "TRIGLYCERIDES";
export type LipidStatus = "LOW" | "NORMAL" | "BORDERLINE" | "HIGH" | "VERY_HIGH" | "UNKNOWN";

export function getLipidStatus(metric: LipidMetric, value: number): LipidStatus {
  if (metric === "HDL") {
    if (value < 40) return "LOW";
    if (value < 60) return "NORMAL";
    return "HIGH";
  }

  if (metric === "LDL") {
    if (value < 100) return "NORMAL";
    if (value < 130) return "BORDERLINE";
    if (value < 160) return "HIGH";
    return "VERY_HIGH";
  }

  if (value < 150) return "NORMAL";
  if (value < 200) return "BORDERLINE";
  if (value < 500) return "HIGH";
  return "VERY_HIGH";
}

export function getStatusLabel(status: LipidStatus) {
  switch (status) {
    case "LOW":
      return "Bajo";
    case "NORMAL":
      return "Normal";
    case "BORDERLINE":
      return "Alerta";
    case "HIGH":
      return "Alto";
    case "VERY_HIGH":
      return "Muy alto";
    default:
      return "Sin clasificar";
  }
}