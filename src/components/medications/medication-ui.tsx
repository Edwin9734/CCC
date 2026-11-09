"use client";

import type { CSSProperties, ReactNode } from "react";
import { Check, Pill, RotateCcw, X } from "lucide-react";
import type { Dose } from "@/lib/habits-config";
import type { ScheduleInput, MedicationWithSchedules } from "@/lib/supabase/medications";
import type { IntakeRow, IntakeStatus } from "@/lib/supabase/habits";

export interface MedicationSaveInput {
  name: string;
  dosage: string;
  instructions?: string;
  schedules: (ScheduleInput & { id?: string })[];
  removedScheduleIds: string[];
}

export interface MedicationApi {
  list: () => Promise<MedicationWithSchedules[]>;
  save: (input: MedicationSaveInput, id?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setIntake: (dose: Dose, date: string, status: IntakeStatus) => Promise<IntakeRow>;
  clearIntake: (dose: Dose, date: string) => Promise<void>;
}

export const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const PILL_COLORS = [
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-900",
  "bg-fuchsia-100 text-fuchsia-800"
];

// Cada medicina conserva siempre el mismo color.
export function pillColor(id: string) {
  let total = 0;
  for (let index = 0; index < id.length; index += 1) total += id.charCodeAt(index);
  return PILL_COLORS[total % PILL_COLORS.length];
}

export function PillTile({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <span className={`ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${pillColor(id)}`} aria-hidden="true">
      {children ?? <Pill className="h-7 w-7" />}
    </span>
  );
}

export function DayRing({ done, total }: { done: number; total: number }) {
  const circumference = 2 * Math.PI * 46;
  const ratio = total > 0 ? done / total : 0;
  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="55" cy="55" r="46" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="11" />
        <circle
          className="pln-ring pln-ring-in"
          cx="55"
          cy="55"
          r="46"
          fill="none"
          stroke="#fde68a"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ "--full": circumference } as CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">{Math.round(ratio * 100)}%</span>
    </div>
  );
}

// Tarjeta de una toma: se usa en Hoy y al revisar un día del calendario.
export function DoseCard({
  dose,
  instructions,
  index,
  isToday,
  onMark
}: {
  dose: Dose;
  instructions?: string | null;
  index: number;
  isToday: boolean;
  onMark: (status: IntakeStatus | null) => void;
}) {
  const late = dose.due && dose.status === null;
  const border = dose.status === "taken" ? "border-emerald-500 bg-emerald-50" : dose.status === "skipped" ? "border-slate-300 bg-slate-50" : late ? "border-amber-400 bg-amber-50" : "border-black/10 bg-white";

  return (
    <li className={`ant-rise rounded-3xl border-2 p-3 transition-colors duration-300 ${border}`} style={{ "--i": index } as CSSProperties}>
      <div className="flex items-center gap-3">
        <PillTile id={dose.medicationId}>
          {dose.status === "taken" ? <Check key="taken" className="ant-pop h-8 w-8 text-emerald-700" strokeWidth={3} /> : undefined}
        </PillTile>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold leading-7 tabular-nums text-ink">{dose.time}</p>
          <p className="text-lg font-bold leading-5 text-ink [overflow-wrap:anywhere]">{dose.medicationName}</p>
          <p className="text-base leading-5 text-muted [overflow-wrap:anywhere]">
            {dose.dosage}
            {instructions ? ` · ${instructions}` : ""}
          </p>
          {late ? <p className="text-sm font-bold text-amber-900">{isToday ? "Ya es hora" : "Sin marcar"}</p> : null}
        </div>
      </div>

      {dose.status === null ? (
        <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(7.5rem,1fr))] gap-2">
          <button type="button" onClick={() => onMark("taken")} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-emerald-700 px-3 py-2 text-lg font-bold text-white shadow-soft transition hover:bg-emerald-800 active:scale-95">
            <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
            Ya la tomé
          </button>
          <button type="button" onClick={() => onMark("skipped")} className="flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-white px-3 py-2 text-base font-semibold text-ink transition active:scale-95">
            <X className="h-5 w-5 shrink-0" aria-hidden="true" />
            No la tomé
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={`text-base font-bold ${dose.status === "taken" ? "text-emerald-800" : "text-slate-700"}`}>{dose.status === "taken" ? "Tomada" : "No tomada"}</span>
          <button type="button" onClick={() => onMark(null)} className="flex min-h-11 items-center gap-1.5 rounded-full border-2 border-black/10 bg-white px-3 py-1 text-base font-semibold text-ink transition active:scale-95">
            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
            Deshacer
          </button>
        </div>
      )}
    </li>
  );
}
