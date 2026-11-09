import type { ReactionLevel } from "@/lib/allergy-insights";

export const SEVERITY_LABEL: Record<ReactionLevel, string> = {
  severe: "Con síntomas de alarma",
  mild: "Sin síntomas de alarma"
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

// Valor inicial del campo de fecha y hora, con la hora local de quien registra.
export function toLocalInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// La fecha se guarda sin zona horaria: se lee por partes para mostrar siempre la hora registrada.
export function formatReactionDate(value: string) {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  return `${date}, ${hours % 12 || 12}:${pad(minutes)} ${hours < 12 ? "a. m." : "p. m."}`;
}
