"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { BellRing, Check, Clock, CloudSun, Minus, Moon, Sun, X, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { ProgressRing } from "@/components/habits/habit-visuals";
import {
  DOSE_STATE_TEXT,
  PERIOD_LABELS,
  formatCountdown,
  groupDosesByPeriod,
  minutesUntil,
  nextPendingDose,
  type DayPeriod,
  type DoseDayState,
  type HabitDay
} from "@/lib/habits-insights";
import type { Dose } from "@/lib/habits-config";
import type { IntakeStatus } from "@/lib/supabase/habits";

const PERIOD_ICONS: Record<DayPeriod, { icon: LucideIcon; className: string; animation: string }> = {
  manana: { icon: Sun, className: "bg-amber-100 text-amber-600", animation: "hab-spin" },
  tarde: { icon: CloudSun, className: "bg-sky-100 text-sky-700", animation: "hab-float" },
  noche: { icon: Moon, className: "bg-indigo-100 text-indigo-700", animation: "hab-rock" }
};

const DOT_STYLES: Record<DoseDayState, { className: string; icon: LucideIcon }> = {
  all: { className: "bg-emerald-600 text-white", icon: Check },
  partial: { className: "bg-amber-400 text-amber-950", icon: Minus },
  none: { className: "bg-rose-100 text-rose-700", icon: X },
  pending: { className: "bg-slate-100 text-muted", icon: Clock },
  empty: { className: "bg-transparent text-black/25", icon: Minus }
};

function statusText(dose: Dose) {
  if (dose.status === "taken") return "Tomada";
  if (dose.status === "skipped") return "No tomada";
  return dose.due ? "Sin registrar" : "Más tarde";
}

function DoseStatusIcon({ status }: { status: Dose["status"] }) {
  if (status === "taken") {
    return (
      <svg viewBox="0 0 40 40" className="h-11 w-11 shrink-0" aria-hidden="true">
        <circle className="hab-check-circle" cx="20" cy="20" r="18" fill="#059669" />
        <path
          className="hab-check-mark"
          d="M12 21l6 6 11-13"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
        status === "skipped" ? "bg-amber-100 text-amber-700" : "bg-accentSoft text-accent"
      }`}
      aria-hidden="true"
    >
      {status === "skipped" ? <X className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
    </span>
  );
}

function NextDoseCard({ doses, nowMinutes }: { doses: Dose[]; nowMinutes: number }) {
  const next = nextPendingDose(doses);

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-violet-200 bg-violet-50 p-4">
      <span className="hab-float flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white">
        <BellRing className="h-6 w-6" aria-hidden="true" />
      </span>
      {next ? (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-violet-900">Próxima toma: {next.time}</p>
          <p className="text-2xl font-semibold leading-8 text-ink">{formatCountdown(minutesUntil(next.time, nowMinutes))}</p>
          <p className="text-sm text-muted">
            {next.medicationName} {next.dosage}
          </p>
        </div>
      ) : (
        <p className="text-base font-semibold leading-6 text-violet-900">Ya no quedan tomas por llegar hoy.</p>
      )}
    </div>
  );
}

export function MedicationIntakeCard({
  doses,
  hasMedications,
  onMark,
  days,
  isToday,
  nowMinutes
}: {
  doses: Dose[];
  hasMedications: boolean;
  onMark: (dose: Dose, status: IntakeStatus) => void;
  days: HabitDay[];
  isToday: boolean;
  nowMinutes: number;
}) {
  const taken = doses.filter((d) => d.status === "taken").length;

  return (
    <SectionCard
      title="Medicamentos del día"
      description="Marca si tomaste cada medicamento. Los horarios salen de la sección Medicamentos."
    >
      {!hasMedications ? (
        <p className="text-sm leading-6 text-muted">
          Aún no tienes medicamentos registrados.{" "}
          <Link href="/medicamentos" className="font-semibold text-accent underline">
            Registrar medicamentos
          </Link>
        </p>
      ) : doses.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          No tienes tomas programadas para este día. Solo aparecen los medicamentos que tienen un horario.
        </p>
      ) : (
        <>
          <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={taken / doses.length}
                color="#059669"
                label={`Tomadas ${taken} de ${doses.length}`}
              >
                <span className="text-2xl font-semibold leading-7 text-ink">
                  {taken}/{doses.length}
                </span>
              </ProgressRing>
              <p className="text-sm font-semibold text-ink">
                Tomadas: {taken} de {doses.length}
              </p>
            </div>
            {isToday ? <NextDoseCard doses={doses} nowMinutes={nowMinutes} /> : null}
          </div>

          <div className="mt-6 space-y-5">
            {groupDosesByPeriod(doses).map(({ period, doses: group }) => {
              const periodStyle = PERIOD_ICONS[period];
              const Icon = periodStyle.icon;

              return (
                <section key={period} aria-label={PERIOD_LABELS[period]}>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${periodStyle.className}`}>
                      <Icon className={`h-5 w-5 ${periodStyle.animation}`} aria-hidden="true" />
                    </span>
                    {PERIOD_LABELS[period]}
                  </h3>

                  <div className="mt-3 space-y-3">
                    {group.map((dose, index) => {
                      const isTaken = dose.status === "taken";
                      const isSkipped = dose.status === "skipped";

                      return (
                        <article
                          key={dose.scheduleId}
                          className={`hab-rise rounded-3xl border p-4 transition-colors ${
                            isTaken ? "border-emerald-200 bg-emerald-50" : "border-black/5 bg-background"
                          }`}
                          style={{ "--i": index } as CSSProperties}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <DoseStatusIcon key={dose.status ?? "pendiente"} status={dose.status} />
                              <div className="min-w-0">
                                <p className="text-base font-semibold text-ink">
                                  {dose.medicationName}{" "}
                                  <span className="text-sm font-normal text-muted">{dose.dosage}</span>
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                                  <Clock className="h-4 w-4" />
                                  {dose.time} · {statusText(dose)}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => onMark(dose, "taken")}
                                aria-pressed={isTaken}
                                className={`rounded-full border px-4 py-3 text-sm font-semibold transition active:scale-95 ${
                                  isTaken
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-black/10 bg-white text-ink hover:bg-slate-50"
                                }`}
                              >
                                La tomé
                              </button>
                              <button
                                type="button"
                                onClick={() => onMark(dose, "skipped")}
                                aria-pressed={isSkipped}
                                className={`rounded-full border px-4 py-3 text-sm font-semibold transition active:scale-95 ${
                                  isSkipped
                                    ? "border-amber-600 bg-amber-600 text-white"
                                    : "border-black/10 bg-white text-ink hover:bg-slate-50"
                                }`}
                              >
                                No la tomé
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-5 text-muted">
            Si marcaste algo por error, toca otra vez el mismo botón para quitar la marca.
          </p>
        </>
      )}

      {hasMedications ? (
        <div className="mt-6 border-t border-black/5 pt-4">
          <p className="text-sm font-semibold text-ink">Tus últimos 7 días</p>
          <ul className="mt-3 grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const style = DOT_STYLES[day.doseState];
              const Icon = style.icon;
              return (
                <li
                  key={day.date}
                  aria-label={`${day.dayName}: ${DOSE_STATE_TEXT[day.doseState]}`}
                  className="hab-pop flex flex-col items-center gap-1"
                  style={{ "--i": index } as CSSProperties}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${style.className}`} aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold text-muted" aria-hidden="true">
                    {day.letter}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  );
}
