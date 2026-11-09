"use client";

import Link from "next/link";
import { useState } from "react";
import { BellRing, CheckCheck, type LucideIcon, Moon, Pill, Plus, Sun, Sunrise } from "lucide-react";
import { Confetti } from "@/components/habits/habit-visuals";
import { Empty, Hero } from "@/components/antecedentes/antecedentes-ui";
import { DayRing, DoseCard } from "@/components/medications/medication-ui";
import type { Dose } from "@/lib/habits-config";
import type { IntakeStatus } from "@/lib/supabase/habits";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";

const PERIODS: { key: string; label: string; icon: LucideIcon; color: string; from: number; to: number }[] = [
  { key: "morning", label: "Mañana", icon: Sunrise, color: "text-amber-700", from: 0, to: 12 },
  { key: "afternoon", label: "Tarde", icon: Sun, color: "text-orange-700", from: 12, to: 18 },
  { key: "night", label: "Noche", icon: Moon, color: "text-indigo-700", from: 18, to: 24 }
];

function waitText(minutes: number) {
  if (minutes < 60) return `en ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `en ${hours} h` : `en ${hours} h ${rest} min`;
}

export function MedicationToday({
  medications,
  doses,
  nowMinutes,
  onMark,
  goToCabinet,
  reminders
}: {
  medications: MedicationWithSchedules[];
  doses: Dose[];
  nowMinutes: number;
  onMark: (dose: Dose, status: IntakeStatus | null) => Promise<void>;
  goToCabinet: () => void;
  reminders?: React.ReactNode;
}) {
  const [cheer, setCheer] = useState(0);

  const taken = doses.filter((dose) => dose.status === "taken").length;
  const skipped = doses.filter((dose) => dose.status === "skipped").length;
  const pending = doses.length - taken - skipped;
  const next = doses.find((dose) => dose.status === null && !dose.due);
  const late = doses.filter((dose) => dose.status === null && dose.due);
  const instructionsOf = (id: string) => medications.find((med) => med.id === id)?.instructions;

  const mark = async (dose: Dose, status: IntakeStatus | null) => {
    await onMark(dose, status);
    if (status === "taken" && taken + 1 === doses.length) setCheer(Date.now());
  };

  const markAll = async (list: Dose[]) => {
    for (const dose of list) await onMark(dose, "taken");
    if (taken + list.length === doses.length) setCheer(Date.now());
  };

  const minutesOf = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  if (medications.length === 0) {
    return (
      <div className="space-y-4">
        <Empty tone="violet" icon={<Pill className="h-10 w-10" />} title="Tu botiquín está vacío" text="Agrega tus medicinas con su horario y aquí verás qué te toca cada día." />
        <button type="button" onClick={goToCabinet} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-lg font-bold text-white shadow-soft transition active:scale-[0.98]">
          <Plus className="h-6 w-6 shrink-0" aria-hidden="true" />
          Agregar una medicina
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      {cheer ? <Confetti key={cheer} /> : null}

      <Hero
        tone="violet"
        art={<DayRing done={taken} total={doses.length} />}
        title={doses.length > 0 && taken === doses.length ? "¡Todo tomado hoy!" : "Mis tomas de hoy"}
        text={doses.length === 0 ? "Hoy no tienes tomas programadas." : `${taken} de ${doses.length} tomas`}
        stats={[
          { label: "Tomadas", value: taken },
          { label: "Pendientes", value: pending },
          { label: "No tomadas", value: skipped }
        ]}
      >
        {next ? (
          <div className="ant-shine-box flex items-center gap-3 rounded-2xl bg-amber-300 p-3 text-amber-950">
            <BellRing className="pln-updown h-7 w-7 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-base font-bold leading-5">
              Próxima: {next.time} · {waitText(minutesOf(next.time) - nowMinutes)}
              <span className="block font-semibold [overflow-wrap:anywhere]">{next.medicationName}</span>
            </p>
          </div>
        ) : null}
      </Hero>

      {reminders}

      {late.length >= 2 ? (
        <button type="button" onClick={() => markAll(late)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-lg font-bold text-white shadow-soft transition active:scale-[0.98]">
          <CheckCheck className="h-6 w-6 shrink-0" aria-hidden="true" />
          Ya tomé las {late.length} que tocaban
        </button>
      ) : null}

      {PERIODS.map((period) => {
        const list = doses.filter((dose) => {
          const hour = Number(dose.time.slice(0, 2));
          return hour >= period.from && hour < period.to;
        });
        if (list.length === 0) return null;
        const Icon = period.icon;
        return (
          <section key={period.key} aria-label={period.label}>
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
              <Icon className={`pln-updown h-6 w-6 ${period.color}`} aria-hidden="true" />
              {period.label}
            </h3>
            <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
              {list.map((dose, index) => (
                <DoseCard key={dose.scheduleId} dose={dose} index={index} isToday instructions={instructionsOf(dose.medicationId)} onMark={(status) => mark(dose, status)} />
              ))}
            </ul>
          </section>
        );
      })}

      <Link href="/antecedentes" className="flex min-h-12 items-center justify-center rounded-full border-2 border-black/10 bg-white px-4 py-2 text-center text-base font-semibold text-ink transition active:scale-[0.98]">
        Ver las medicinas que he usado antes
      </Link>
    </div>
  );
}
