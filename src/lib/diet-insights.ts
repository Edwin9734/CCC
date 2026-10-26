import { getStatusLabel, type LipidStatus } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";
import { parseDateOnly } from "@/lib/date-utils";

export interface MetricInsight {
  metric: "HDL" | "LDL" | "TRIGLYCERIDES";
  title: string;
  message: string;
  tone: "warning" | "danger";
  goodIds: string[];
  avoidIds: string[];
}

export interface MedicationNote {
  medicationName: string;
  message: string;
}

export interface DietInsights {
  hasMeasurements: boolean;
  hasMedications: boolean;
  allNormal: boolean;
  metricInsights: MetricInsight[];
  medicationNotes: MedicationNote[];
  focusIds: string[];
}

const ALERT_STATUSES = ["BORDERLINE", "HIGH", "VERY_HIGH", "CRITICAL"];

const GRAPEFRUIT_STATINS = ["atorvastatina", "simvastatina", "lovastatina"];
const OTHER_STATINS = ["rosuvastatina", "pravastatina", "pitavastatina", "fluvastatina", "estatina"];
const PRESSURE_MEDS = [
  "losartan",
  "enalapril",
  "captopril",
  "lisinopril",
  "amlodipino",
  "valsartan",
  "hidroclorotiazida",
  "metoprolol",
  "carvedilol",
  "atenolol",
  "telmisartan",
  "irbesartan",
  "nifedipino"
];
const ANTICOAGULANTS = ["warfarina", "acenocumarol"];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesAny(name: string, keywords: string[]) {
  const n = normalize(name);
  return keywords.some((k) => n.includes(k));
}

function formatDate(date: string) {
  return parseDateOnly(date).toLocaleDateString("es-ES");
}

export function buildDietInsights(
  measurements: MeasurementWithStatus[],
  medications: MedicationWithSchedules[]
): DietInsights {
  const sorted = [...measurements].sort(
    (a, b) => new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
  );
  const latest = (metric: string) => sorted.find((m) => m.metric === metric);

  const metricInsights: MetricInsight[] = [];

  const ldl = latest("LDL");
  if (ldl && ALERT_STATUSES.includes(ldl.status)) {
    metricInsights.push({
      metric: "LDL",
      title: "LDL (colesterol malo)",
      message: `Tu última medición fue ${ldl.value} mg/dL (${getStatusLabel(ldl.status as LipidStatus)}, ${formatDate(
        ldl.measured_at
      )}). Conviene reducir las grasas saturadas y aumentar la fibra soluble.`,
      tone: ldl.status === "BORDERLINE" ? "warning" : "danger",
      goodIds: ["avena", "frijoles", "lentejas", "manzana", "naranja", "pera", "mani", "almendras", "aceite-oliva"],
      avoidIds: [
        "salchicha",
        "tocino",
        "jamon",
        "chorizo",
        "margarina",
        "manteca",
        "chicharron",
        "frituras",
        "higado",
        "rinon",
        "menudencias"
      ]
    });
  }

  const tg = latest("TRIGLYCERIDES");
  if (tg && ALERT_STATUSES.includes(tg.status)) {
    metricInsights.push({
      metric: "TRIGLYCERIDES",
      title: "Triglicéridos",
      message: `Tu última medición fue ${tg.value} mg/dL (${getStatusLabel(tg.status as LipidStatus)}, ${formatDate(
        tg.measured_at
      )}). Conviene reducir azúcares, harinas refinadas y alcohol, y comer pescado.`,
      tone: tg.status === "BORDERLINE" ? "warning" : "danger",
      goodIds: ["salmon", "sardina", "lechuga", "ayote", "agua", "te-verde"],
      avoidIds: [
        "gaseosas",
        "jugos-industriales",
        "cerveza",
        "ron",
        "licores",
        "reposteria",
        "pan-blanco",
        "arroz-blanco",
        "azucar",
        "helados"
      ]
    });
  }

  const hdl = latest("HDL");
  if (hdl && hdl.status === "LOW") {
    metricInsights.push({
      metric: "HDL",
      title: "HDL (colesterol bueno)",
      message: `Tu última medición fue ${hdl.value} mg/dL (${getStatusLabel(hdl.status as LipidStatus)}, ${formatDate(
        hdl.measured_at
      )}). Las grasas saludables ayudan a mejorarlo; conviene evitar frituras y repostería industrial. La actividad física también ayuda, si tu médico la autoriza.`,
      tone: "warning",
      goodIds: ["aceite-oliva", "aguacate", "mani", "almendras", "salmon", "sardina"],
      avoidIds: ["frituras", "reposteria"]
    });
  }

  const medicationNotes: MedicationNote[] = [];
  for (const med of medications) {
    if (matchesAny(med.name, GRAPEFRUIT_STATINS)) {
      medicationNotes.push({
        medicationName: med.name,
        message: `Tomas ${med.name}: el jugo de toronja (pomelo) puede aumentar la cantidad del medicamento en la sangre. Consulta a tu médico o farmacéutico antes de tomarlo.`
      });
    } else if (matchesAny(med.name, OTHER_STATINS)) {
      medicationNotes.push({
        medicationName: med.name,
        message: `Tomas ${med.name} (una estatina). Con algunas estatinas la toronja interfiere menos, pero confirma con tu médico o farmacéutico antes de tomarla.`
      });
    } else if (matchesAny(med.name, PRESSURE_MEDS)) {
      medicationNotes.push({
        medicationName: med.name,
        message: `Tomas ${med.name}: el agua de jamaica puede bajar la presión arterial. Pregunta a tu médico si puedes tomarla.`
      });
    } else if (matchesAny(med.name, ANTICOAGULANTS)) {
      medicationNotes.push({
        medicationName: med.name,
        message: `Tomas ${med.name}: las verduras de hoja verde tienen vitamina K, que afecta a este medicamento. No hace falta evitarlas, pero conviene comerlas en cantidades constantes y avisarle a tu médico.`
      });
    }
  }

  const focusIds = Array.from(new Set(metricInsights.flatMap((i) => [...i.goodIds, ...i.avoidIds])));

  return {
    hasMeasurements: measurements.length > 0,
    hasMedications: medications.length > 0,
    allNormal: measurements.length > 0 && metricInsights.length === 0,
    metricInsights,
    medicationNotes,
    focusIds
  };
}