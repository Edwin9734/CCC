import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import {
  ACTIVITY_WEEKLY_GOAL_MINUTES,
  SLEEP_GOAL_HOURS,
  WATER_GOAL_GLASSES,
  formatHours,
  type WeekSummary
} from "@/lib/habits-config";

function StatBox({ title, value, lines }: { title: string; value: string; lines: string[] }) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4">
      <p className="text-sm font-semibold text-muted">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
      {lines.map((line) => (
        <p key={line} className="mt-1 text-sm leading-6 text-muted">
          {line}
        </p>
      ))}
    </div>
  );
}

export function WeekSummaryCard({
  summary,
  activityGoalMinutes = ACTIVITY_WEEKLY_GOAL_MINUTES
}: {
  summary: WeekSummary;
  activityGoalMinutes?: number;
}) {
  const { doses, water, sleep, activity } = summary;
  const medPercent = doses.scheduled > 0 ? Math.round((doses.taken / doses.scheduled) * 100) : null;
  const activityPercent =
    activityGoalMinutes > 0 ? Math.min(100, Math.round((activity.totalMinutes / activityGoalMinutes) * 100)) : 0;

  return (
    <SectionCard title="Resumen de la semana" description="Tus últimos 7 días, contando lo que registraste.">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatBox
          title="Medicamentos"
          value={doses.scheduled > 0 ? `${doses.taken} de ${doses.scheduled}` : "—"}
          lines={
            doses.scheduled > 0
              ? [
                  `Tomadas${medPercent !== null ? ` (${medPercent}%)` : ""}. No tomadas: ${doses.skipped}.`,
                  `Sin registrar: ${doses.scheduled - doses.taken - doses.skipped}.`
                ]
              : ["Sin tomas programadas esta semana."]
          }
        />

        <StatBox
          title="Agua"
          value={`${water.metDays} de 7 días`}
          lines={[`Con ${WATER_GOAL_GLASSES} vasos o más.`, `Días con registro: ${water.daysWithRecord}.`]}
        />

        <StatBox
          title="Sueño"
          value={sleep.average !== null ? `${formatHours(sleep.average)} h` : "—"}
          lines={
            sleep.average !== null
              ? [
                  `Promedio de ${sleep.daysWithRecord} día(s) registrado(s).`,
                  `Días con ${SLEEP_GOAL_HOURS} horas o más: ${sleep.metDays}.`
                ]
              : ["Aún no registras horas de sueño esta semana."]
          }
        />

        <div className="rounded-3xl border border-black/5 bg-white p-4">
          <p className="text-sm font-semibold text-muted">Actividad física</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{activity.totalMinutes} min</p>
          <div className="mt-2 h-3 w-full rounded-full bg-black/10" aria-hidden="true">
            <div className="h-3 rounded-full bg-accent" style={{ width: `${activityPercent}%` }} />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Meta: {activityGoalMinutes} min por semana, según tu plan. Días activos: {activity.activeDays}.
          </p>
          <Link href="/plan" className="mt-1 inline-block text-sm font-semibold text-accent underline">
            Ver mi plan
          </Link>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Es un resumen orientativo de los últimos 7 días. Las metas son generales y no reemplazan la indicación de tu
        médico o nutricionista.
      </p>
    </SectionCard>
  );
}