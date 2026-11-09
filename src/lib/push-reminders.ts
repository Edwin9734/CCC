// Decide qué recordatorios tocan en este momento. No envía nada: solo calcula.
import { addDays, isoWeekday } from "@/lib/date-utils";
import { createdLocalDate, scheduleDays } from "@/lib/habits-config";

export const FIRST_WINDOW_MINUTES = 20; // si el reloj se atrasa, el aviso aún sale dentro de este margen
export const SECOND_AFTER_MINUTES = 30;
export const SECOND_WINDOW_MINUTES = 20;

export type ReminderKind = "first" | "second";

export interface ScheduleForPush {
  id: string;
  user_id: string;
  medication_id: string;
  time_of_day: string;
  repeat_days: number[] | null;
  created_at: string;
  medications: { name: string; dosage: string } | null;
}

export interface Reminder {
  kind: ReminderKind;
  userId: string;
  scheduleId: string;
  medicationId: string;
  date: string;
  time: string;
  name: string;
  dosage: string;
}

export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  url: string;
  doses: { scheduleId: string; medicationId: string; date: string }[];
}

export function findDueReminders({
  schedules,
  answered,
  delivered,
  today,
  nowMinutes
}: {
  schedules: ScheduleForPush[];
  answered: Set<string>; // "scheduleId|fecha" de las tomas ya marcadas
  delivered: Set<string>; // "scheduleId|fecha|kind" de los avisos ya enviados
  today: string;
  nowMinutes: number;
}) {
  const yesterday = addDays(today, -1);
  const due: Reminder[] = [];

  for (const schedule of schedules) {
    const time = schedule.time_of_day.slice(0, 5);
    const [hours, minutes] = time.split(":").map(Number);
    const doseMinutes = hours * 60 + minutes;

    // Se revisa también ayer: una toma de las 23:50 tiene su segundo aviso después de medianoche.
    for (const date of [today, yesterday]) {
      if (!scheduleDays(schedule.repeat_days).includes(isoWeekday(date))) continue;
      if (date < createdLocalDate(schedule.created_at)) continue;
      if (answered.has(`${schedule.id}|${date}`)) continue;

      const elapsed = (date === today ? nowMinutes : nowMinutes + 1440) - doseMinutes;
      if (elapsed < 0) continue;

      const isSent = (kind: ReminderKind) => delivered.has(`${schedule.id}|${date}|${kind}`);
      let kind: ReminderKind | null = null;
      if (elapsed < FIRST_WINDOW_MINUTES && !isSent("first")) kind = "first";
      else if (elapsed >= SECOND_AFTER_MINUTES && elapsed < SECOND_AFTER_MINUTES + SECOND_WINDOW_MINUTES && isSent("first") && !isSent("second")) kind = "second";

      if (kind) {
        due.push({
          kind,
          userId: schedule.user_id,
          scheduleId: schedule.id,
          medicationId: schedule.medication_id,
          date,
          time,
          name: schedule.medications?.name ?? "Tu medicina",
          dosage: schedule.medications?.dosage ?? ""
        });
      }
    }
  }

  return due;
}

// Las medicinas de la misma hora llegan juntas en un solo aviso.
export function groupReminders(reminders: Reminder[]) {
  const groups = new Map<string, Reminder[]>();
  for (const reminder of reminders) {
    const key = [reminder.userId, reminder.kind, reminder.date, reminder.time].join("|");
    groups.set(key, [...(groups.get(key) ?? []), reminder]);
  }
  return Array.from(groups.values());
}

export function buildPayload(group: Reminder[], hideNames: boolean): PushPayload {
  const { kind, date, time } = group[0];
  const names = group.map((item) => (item.dosage ? `${item.name} (${item.dosage})` : item.name)).join(", ");
  const title = kind === "first" ? "Es hora de tu medicina" : "¿Ya tomaste tu medicina?";

  return {
    title,
    body: hideNames ? (kind === "first" ? "Abre la app para ver cuál te toca." : "Abre la app para marcarla.") : `${time} · ${names}`,
    tag: `toma-${date}-${time}`,
    url: "/medicamentos?tab=hoy",
    doses: group.map((item) => ({ scheduleId: item.scheduleId, medicationId: item.medicationId, date: item.date }))
  };
}

const PUSH_HOSTS = ["fcm.googleapis.com", "push.services.mozilla.com", "notify.windows.com", "push.apple.com"];

// Solo se aceptan direcciones de los servicios de notificaciones de los navegadores.
export function isPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && PUSH_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
