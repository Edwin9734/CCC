"use client";

import { useState, type CSSProperties } from "react";
import { Check, Flame, Minus } from "lucide-react";
import { Hero, MedicineArt } from "@/components/antecedentes/antecedentes-ui";
import { DoseCard } from "@/components/medications/medication-ui";
import { formatLongDate } from "@/lib/antecedentes";
import { addDays } from "@/lib/date-utils";
import type { Dose } from "@/lib/habits-config";
import { WEEK_LETTERS, weekDates } from "@/lib/plan-goals";
import type { IntakeStatus } from "@/lib/supabase/habits";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";

type DayState = "full" | "partial" | "missed" | "none" | "future";

const CELL: Record<DayState, string> = {
  full: "bg-emerald-600 text-white",
  partial: "bg-amber-300 text-amber-950",
  missed: "bg-rose-200 text-rose-950",
  none: "bg-slate-100 text-slate-600",
  future: "bg-white text-slate-300"
};

const LEGEND: { state: DayState; label: string }[] = [
  { state: "full", label: "Todas" },
  { state: "partial", label: "Algunas" },
  { state: "missed", label: "Ninguna" },
  { state: "none", label: "Sin tomas" }
];

export function MedicationCalendar({
  medications,
  today,
  dosesFor,
  onMark
}: {
  medications: MedicationWithSchedules[];
  today: string;
  dosesFor: (date: string) => Dose[];
  onMark: (dose: Dose, date: string, status: IntakeStatus | null) => Promise<void>;
}) {
  const [selected, setSelected] = useState(today);

  const dueOf = (date: string) => dosesFor(date).filter((dose) => dose.due || dose.status !== null);
  const stateOf = (date: string): DayState => {
    if (date > today) return "future";
    const list = dueOf(date);
    if (list.length === 0) return "none";
    const taken = list.filter((dose) => dose.status === "taken").length;
    return taken === list.length ? "full" : taken === 0 ? "missed" : "partial";
  };

  const firstMonday = addDays(weekDates(today)[0], -21);
  const days = Array.from({ length: 28 }, (_, index) => addDays(firstMonday, index));

  const percentOf = (from: number) => {
    const list = Array.from({ length: from }, (_, index) => dueOf(addDays(today, -index))).flat();
    return list.length > 0 ? Math.round((list.filter((dose) => dose.status === "taken").length / list.length) * 100) : 0;
  };

  // Días seguidos con todas las tomas; hoy solo suma si ya está completo y no rompe la racha.
  let streak = stateOf(today) === "full" ? 1 : 0;
  for (let back = 1; back < 60; back += 1) {
    const state = stateOf(addDays(today, -back));
    if (state === "none") continue;
    if (state !== "full") break;
    streak += 1;
  }

  const lastSeven = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)).map((date) => {
    const list = dueOf(date);
    return { date, total: list.length, percent: list.length ? Math.round((list.filter((dose) => dose.status === "taken").length / list.length) * 100) : 0 };
  });

  const selectedDoses = dosesFor(selected);

  return (
    <div className="space-y-4">
      <Hero
        tone="violet"
        art={<MedicineArt />}
        title="Mi constancia"
        text={streak > 0 ? `¡Llevas ${streak} ${streak === 1 ? "día" : "días"} con todas tus tomas!` : "Cada toma cuenta. ¡Tú puedes!"}
        stats={[
          { label: "Días seguidos", value: streak },
          { label: "% en 7 días", value: percentOf(7) },
          { label: "% en 28 días", value: percentOf(28) }
        ]}
      />

      <section className="ant-rise ab-card rounded-[1.75rem] p-4">
        <h3 className="text-lg font-bold text-ink">Últimos 7 días (% de tomas)</h3>
        <div className="mt-3 grid h-40 grid-cols-7 items-end gap-1.5">
          {lastSeven.map((day, index) => {
            const isSelected = day.date === selected;
            return (
              <button key={day.date} type="button" onClick={() => setSelected(day.date)} aria-label={`${formatLongDate(day.date)}: ${day.total ? `${day.percent}% de las tomas` : "sin tomas"}`} className="flex h-full flex-col items-center justify-end gap-1 rounded-lg transition active:scale-95">
                <span className="text-xs font-bold tabular-nums text-ink">{day.date === today || isSelected ? day.percent : ""}</span>
                <span className="flex w-full flex-1 items-end justify-center">
                  <span className={`block w-full max-w-6 rounded-t ${isSelected ? "bg-violet-800" : "bg-violet-400"}`} style={{ height: `${Math.max(day.percent, 3)}%`, animation: "ant-rise .6s ease-out backwards", animationDelay: `${index * 60}ms` } as CSSProperties} />
                </span>
                <span className={`text-sm font-bold ${day.date === today ? "text-accent" : "text-muted"}`}>{WEEK_LETTERS[(new Date(`${day.date}T12:00:00Z`).getUTCDay() + 6) % 7]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ant-rise ab-card rounded-[1.75rem] p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Flame className="h-5 w-5 text-orange-600" aria-hidden="true" />
          Mis 4 semanas
        </h3>
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm font-bold text-muted" aria-hidden="true">
          {WEEK_LETTERS.map((letter, index) => (
            <span key={index}>{letter}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const state = stateOf(date);
            const isSelected = date === selected;
            return (
              <button
                key={date}
                type="button"
                disabled={state === "future"}
                onClick={() => setSelected(date)}
                aria-pressed={isSelected}
                aria-label={formatLongDate(date)}
                className={`ant-pop relative flex aspect-square min-h-9 items-center justify-center rounded-lg text-sm font-bold tabular-nums transition active:scale-90 disabled:cursor-default ${CELL[state]} ${isSelected ? "ring-[3px] ring-violet-800 ring-offset-1" : ""}`}
                style={{ "--i": Math.min(index, 14) } as CSSProperties}
              >
                {state === "full" ? <Check className="h-5 w-5" aria-hidden="true" /> : Number(date.slice(8))}
              </button>
            );
          })}
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {LEGEND.map((item) => (
            <li key={item.state} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <span className={`flex h-4 w-4 items-center justify-center rounded ${CELL[item.state]}`} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      <section key={selected} aria-label="Tomas del día elegido">
        <h3 className="ant-pop mb-2 text-lg font-bold text-ink">{selected === today ? "Hoy" : formatLongDate(selected)}</h3>
        {selectedDoses.length === 0 ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-base font-semibold text-muted">
            <Minus className="h-5 w-5 shrink-0" aria-hidden="true" />
            No había tomas este día.
          </p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
            {selectedDoses.map((dose, index) => (
              <DoseCard
                key={dose.scheduleId}
                dose={dose}
                index={index}
                isToday={selected === today}
                instructions={medications.find((med) => med.id === dose.medicationId)?.instructions}
                onMark={(status) => onMark(dose, selected, status)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
