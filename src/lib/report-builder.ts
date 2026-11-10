// Datos y opciones del armador de reportes.
import type { ContactsInfo } from "@/lib/contacts";
import { METRIC_LABELS, getStatusLabel, type LipidMetric } from "@/lib/ranges";
import type { AllergyReactionRow } from "@/lib/supabase/allergies";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";

export type ReportSectionKey =
  | "datos"
  | "resumen"
  | "graficas"
  | "tabla"
  | "medicinas"
  | "alergias"
  | "antecedentes"
  | "habitos"
  | "preguntas"
  | "recomendaciones";

export const SECTION_LABELS: Record<ReportSectionKey, string> = {
  datos: "Mis datos",
  resumen: "Resumen de mis valores",
  graficas: "Gráficas de evolución",
  tabla: "Tabla de mediciones",
  medicinas: "Mis medicinas",
  alergias: "Alergias y reacciones",
  antecedentes: "Enfermedades y exámenes",
  habitos: "Hábitos de la semana",
  preguntas: "Preguntas para mi médico",
  recomendaciones: "Metas recomendadas"
};

export const ALL_SECTIONS: ReportSectionKey[] = ["datos", "resumen", "graficas", "tabla", "medicinas", "alergias", "antecedentes", "habitos", "preguntas", "recomendaciones"];

export type TemplateKey = "medico" | "colesterol" | "emergencia" | "alergias" | "completo";

export const TEMPLATES: { key: TemplateKey; label: string; hint: string; sections: ReportSectionKey[] }[] = [
  { key: "medico", label: "Para mi médico", hint: "Lo más útil para la consulta", sections: ["datos", "resumen", "graficas", "tabla", "medicinas", "alergias", "antecedentes", "preguntas"] },
  { key: "colesterol", label: "Solo colesterol", hint: "Valores, gráficas y metas", sections: ["datos", "resumen", "graficas", "tabla", "recomendaciones"] },
  { key: "emergencia", label: "Emergencia", hint: "Medicinas, alergias y enfermedades", sections: ["datos", "medicinas", "alergias", "antecedentes"] },
  { key: "alergias", label: "Alergias", hint: "Historial de reacciones", sections: ["datos", "alergias"] },
  { key: "completo", label: "Completo", hint: "Todo lo que has registrado", sections: ALL_SECTIONS }
];

export type PeriodKey = "90" | "180" | "365" | "all";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "90", label: "3 meses" },
  { key: "180", label: "6 meses" },
  { key: "365", label: "1 año" },
  { key: "all", label: "Todo" }
];

export const METRICS: LipidMetric[] = ["LDL", "TRIGLYCERIDES", "HDL"];

export const QUESTION_IDEAS = [
  "¿Debo cambiar la dosis de alguna medicina?",
  "¿Cuándo repito mis análisis?",
  "¿Puedo hacer más ejercicio?",
  "¿Hay alimentos que deba evitar con mis medicinas?"
];

export interface ReportMedication {
  id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  schedule: string;
}

export interface ReportCondition {
  name: string;
  kind: "current" | "past";
  duration: string | null;
  symptoms: string[];
  howCured: string | null;
  year: number | null;
  genetic: boolean;
}

export interface ReportExam {
  type: string;
  date: string | null;
  place: string | null;
  status: "normal" | "attention" | "unknown" | null;
  result: string | null;
}

export interface ReportData {
  today: string;
  patient: { name: string | null; age: number | null; sex: string | null; weightLb: number | null; heightCm: number | null; bmi: string | null };
  contacts: ContactsInfo | null;
  conditions: string[];
  riskLabel: string;
  hdlMinimum: number;
  measurements: MeasurementWithStatus[];
  medications: ReportMedication[];
  adherence: { taken: number; total: number };
  allergies: { name: string; notes: string | null }[];
  reactions: AllergyReactionRow[];
  historyConditions: ReportCondition[];
  exams: ReportExam[];
  week: { waterDays: number; waterRestricted: boolean; sleepAverage: number | null; activityMinutes: number; activeDays: number; dosesTaken: number; dosesScheduled: number };
}

export function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function measurementsInPeriod(rows: MeasurementWithStatus[], period: PeriodKey, today: string, metrics: LipidMetric[]) {
  const from = period === "all" ? "0000-00-00" : addDaysIso(today, -Number(period));
  return rows.filter((row) => row.measured_at >= from && row.measured_at <= today && metrics.includes(row.metric));
}

// Texto corto para mandar por WhatsApp o correo.
export function buildShareText(data: ReportData) {
  const lines: string[] = [];
  lines.push(`Reporte de salud${data.patient.name ? ` de ${data.patient.name}` : ""}`);

  const latest = METRICS.map((metric) => data.measurements.find((row) => row.metric === metric && row.measured_at <= data.today)).filter(Boolean) as MeasurementWithStatus[];
  if (latest.length > 0) {
    lines.push("", "Últimos valores:");
    latest.forEach((row) => lines.push(`- ${METRIC_LABELS[row.metric]}: ${row.value} mg/dL (${getStatusLabel(row.status)}, ${row.measured_at})`));
  }
  if (data.medications.length > 0) {
    lines.push("", "Medicinas:");
    data.medications.forEach((med) => lines.push(`- ${med.name} ${med.dosage}${med.schedule ? ` · ${med.schedule}` : ""}`));
  }
  if (data.allergies.length > 0) {
    lines.push("", `Alergias: ${data.allergies.map((item) => item.name).join(", ")}`);
  }
  if (data.conditions.length > 0) {
    lines.push("", `Enfermedades: ${data.conditions.join(", ")}`);
  }
  lines.push("", "Hecho con la app Control de Colesterol.");
  return lines.join("\n");
}
