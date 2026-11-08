"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Check, Lightbulb, Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { ProgressRing } from "@/components/habits/habit-visuals";
import { useSectionTabs } from "@/components/shell/section-tabs";
import {
  ACTIVITY_WEEKLY_GOAL_MINUTES,
  SLEEP_GOAL_HOURS,
  WATER_GOAL_GLASSES,
  formatHours,
  type WeekSummary
} from "@/lib/habits-config";
import { buildWeekTip, compareWeeks, type HabitDay, type WeekTrend } from "@/lib/habits-insights";

function StatBox({
  title,
  value,
  lines,
  ring
}: {
  title: string;
  value: string;
  lines: string[];
  ring?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-black/5 bg-white p-4">
      {ring}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
        {lines.map((line) => (
          <p key={line} className="mt-1 text-sm leading-6 text-muted">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function RingPercent({ value }: { value: number }) {
  return <span className="text-base font-semibold text-ink">{Math.round(Math.min(1, value) * 100)}%</span>;
}

type MarkKind = "done" | "partial" | "none";

const MARK_TEXT: Record<MarkKind, string> = {
  done: "cumplido",
  partial: "parcial o solo registrado",
  none: "sin registro"
};

function Mark({ kind, index }: { kind: MarkKind; index: number }) {
  return (
    <span
      className={`hab-pop mx-auto flex h-7 w-7 items-center justify-center rounded-full ${
        kind === "done" ? "bg-emerald-600 text-white" : kind === "partial" ? "bg-amber-400 text-amber-950" : "bg-slate-100 text-black/30"
      }`}
      style={{ "--i": index } as CSSProperties}
    >
      {kind === "done" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
      <span className="sr-only">{MARK_TEXT[kind]}</span>
    </span>
  );
}

const TREND_STYLES: Record<WeekTrend, { icon: LucideIcon; className: string }> = {
  up: { icon: TrendingUp, className: "bg-emerald-100 text-emerald-700" },
  down: { icon: TrendingDown, className: "bg-amber-100 text-amber-800" },
  same: { icon: Minus, className: "bg-sky-100 text-sky-700" },
  none: { icon: Minus, className: "bg-slate-100 text-muted" }
};

export function WeekSummaryCard({
  summary,
  previous,
  days,
  activityGoalMinutes = ACTIVITY_WEEKLY_GOAL_MINUTES,
  waterRestricted = false
}: {
  summary: WeekSummary;
  previous: WeekSummary | null;
  days: HabitDay[];
  activityGoalMinutes?: number;
  waterRestricted?: boolean;
}) {
  const tabs = useSectionTabs();
  const { doses, water, sleep, activity } = summary;
  const medPercent = doses.scheduled > 0 ? Math.round((doses.taken / doses.scheduled) * 100) : null;
  const activityFraction = activityGoalMinutes > 0 ? activity.totalMinutes / activityGoalMinutes : 0;

  const tip = buildWeekTip(summary, activityGoalMinutes, waterRestricted);
  const comparison = previous ? compareWeeks(summary, previous, waterRestricted) : [];

  const rows: { label: string; kind: (day: HabitDay) => MarkKind }[] = [
    {
      label: "Medicinas",
      kind: (day) =>
        day.doseState === "all" ? "done" : day.doseState === "partial" || day.doseState === "pending" ? "partial" : "none"
    },
    {
      label: "Agua",
      kind: (day) => {
        if (day.water <= 0) return "none";
        return waterRestricted || day.water >= WATER_GOAL_GLASSES ? "done" : "partial";
      }
    },
    {
      label: "Sueño",
      kind: (day) => {
        if (day.sleep === null) return "none";
        return day.sleep >= SLEEP_GOAL_HOURS ? "done" : "partial";
      }
    },
    { label: "Actividad", kind: (day) => (day.activityMinutes > 0 ? "done" : "none") }
  ];

  return (
    <>
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
            ring={
              doses.scheduled > 0 ? (
                <ProgressRing value={doses.taken / doses.scheduled} size="5rem" color="#7c3aed" label={`Medicamentos: ${medPercent}%`}>
                  <RingPercent value={doses.taken / doses.scheduled} />
                </ProgressRing>
              ) : undefined
            }
          />

          {waterRestricted ? (
            <StatBox
              title="Agua"
              value="—"
              lines={["Sin meta: tu médico debe indicarte cuánta agua tomar.", `Días con registro: ${water.daysWithRecord}.`]}
            />
          ) : (
            <StatBox
              title="Agua"
              value={`${water.metDays} de 7 días`}
              lines={[`Con ${WATER_GOAL_GLASSES} vasos o más.`, `Días con registro: ${water.daysWithRecord}.`]}
              ring={
                <ProgressRing value={water.metDays / 7} size="5rem" color="#0ea5e9" label={`Agua: ${water.metDays} de 7 días con la meta`}>
                  <RingPercent value={water.metDays / 7} />
                </ProgressRing>
              }
            />
          )}

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
            ring={
              <ProgressRing value={sleep.metDays / 7} size="5rem" color="#6366f1" label={`Sueño: ${sleep.metDays} de 7 días con la meta`}>
                <RingPercent value={sleep.metDays / 7} />
              </ProgressRing>
            }
          />

          <div className="flex items-center gap-3 rounded-3xl border border-black/5 bg-white p-4">
            <ProgressRing
              value={activityFraction}
              size="5rem"
              color="#14b8a6"
              label={`Actividad: ${activity.totalMinutes} de ${activityGoalMinutes} minutos`}
            >
              <RingPercent value={activityFraction} />
            </ProgressRing>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted">Actividad física</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{activity.totalMinutes} min</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Meta: {activityGoalMinutes} min por semana, según tu plan. Días activos: {activity.activeDays}.
              </p>
              <Link href="/plan" className="mt-1 inline-block text-sm font-semibold text-accent underline">
                Ver mi plan
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-muted">
          Es un resumen orientativo de los últimos 7 días. Las metas son generales y no reemplazan la indicación de tu
          médico o nutricionista.
        </p>
      </SectionCard>

      <section className="ab-card rounded-[1.75rem] border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="hab-float flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white">
            <Lightbulb className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">Consejo de la semana</p>
            <h2 className="text-xl font-semibold text-ink">{tip.title}</h2>
            <p className="mt-1 text-base leading-7 text-ink">{tip.text}</p>
            {tip.action ? (
              <button
                type="button"
                onClick={() => tabs?.setActive(tip.action?.tab ?? "semana")}
                className="mt-3 min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition active:scale-95"
              >
                {tip.action.label}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <SectionCard title="Calendario de 7 días" description="De un vistazo, qué hábitos cumpliste cada día.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[19rem] border-separate border-spacing-y-2 text-center text-sm">
            <thead>
              <tr>
                <th scope="col" className="text-left font-semibold text-muted">
                  <span className="sr-only">Hábito</span>
                </th>
                {days.map((day) => (
                  <th key={day.date} scope="col" className="font-semibold text-muted">
                    <span aria-hidden="true">{day.letter}</span>
                    <span className="sr-only">{day.dayName}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.label}>
                  <th scope="row" className="whitespace-nowrap pr-2 text-left font-semibold text-ink">
                    {row.label}
                  </th>
                  {days.map((day, dayIndex) => (
                    <td key={day.date}>
                      <Mark kind={row.kind(day)} index={rowIndex + dayIndex} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            Cumplido
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-amber-950">
              <Minus className="h-3 w-3" aria-hidden="true" />
            </span>
            Parcial
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-black/30">
              <Minus className="h-3 w-3" aria-hidden="true" />
            </span>
            Sin registro
          </span>
        </div>
      </SectionCard>

      {previous ? (
        <SectionCard title="Comparar semanas" description="Estos 7 días frente a los 7 días anteriores.">
          <ul className="grid gap-3 sm:grid-cols-2">
            {comparison.map((row, index) => {
              const style = TREND_STYLES[row.trend];
              const Icon = style.icon;
              return (
                <li
                  key={row.key}
                  className="hab-rise flex items-center gap-3 rounded-3xl border border-black/5 bg-white p-4"
                  style={{ "--i": index } as CSSProperties}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.className}`} aria-hidden="true">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink">{row.label}</p>
                    <p className="text-sm leading-5 text-muted">{row.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      ) : null}
    </>
  );
}
