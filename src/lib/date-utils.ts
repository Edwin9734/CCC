// Las fechas de las mediciones llegan de la base como "YYYY-MM-DD" (sin hora).
// Con new Date("2026-10-18") el navegador las toma como medianoche UTC, y en
// Guatemala (UTC-6) eso se muestra como el día anterior. Estas funciones las
// interpretan como una fecha local, para que siempre se vea el día correcto.
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return parseDateOnly(value).toLocaleDateString("es-ES", options);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Fecha local (sin hora) como "YYYY-MM-DD".
export function toDateString(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// Suma (o resta) días a una fecha "YYYY-MM-DD".
export function addDays(value: string, days: number): string {
  const d = parseDateOnly(value);
  return toDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

// Día de la semana: 1 = lunes ... 7 = domingo (igual que en medication_schedules).
export function isoWeekday(value: string): number {
  const day = parseDateOnly(value).getDay();
  return day === 0 ? 7 : day;
}

// ---------------------------------------------------------------------------
// Zona horaria de la app. Los servidores (como el de Vercel) suelen trabajar en UTC,
// y de noche en Guatemala ya estarían en el día siguiente. Para que "hoy" sea siempre
// el día de la persona, usamos esta zona. Para cambiarla, edita solo esta línea.
// ---------------------------------------------------------------------------
export const APP_TIME_ZONE = "America/Guatemala";

function partsInAppTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24, // algunos entornos devuelven 24 a medianoche
    minute: read("minute")
  };
}

// Fecha "YYYY-MM-DD" de un momento dado, en la zona horaria de la app.
export function dateInAppTimeZone(date: Date): string {
  const p = partsInAppTimeZone(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

// El día de hoy, en la zona horaria de la app.
export function todayInAppTimeZone(): string {
  return dateInAppTimeZone(new Date());
}

// Minutos transcurridos desde la medianoche de hoy, en la zona horaria de la app.
export function minutesNowInAppTimeZone(): number {
  const p = partsInAppTimeZone(new Date());
  return p.hour * 60 + p.minute;
}