"use client";

import { useState, type CSSProperties } from "react";
import { Clock, Pill } from "lucide-react";
import { AddButton, DetailBlock, Empty, Expand, ExpandChevron, Hero, MedicineArt, RowActions, SearchBox } from "@/components/antecedentes/antecedentes-ui";
import { MedicationForm } from "@/components/medications/medication-form";
import { DAY_LABELS, PillTile, type MedicationSaveInput } from "@/components/medications/medication-ui";
import { matchesSearch } from "@/lib/antecedentes";
import { addDays } from "@/lib/date-utils";
import type { Dose } from "@/lib/habits-config";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";

function daysText(days: number[] | null | undefined) {
  if (!days || days.length === 0 || days.length === 7) return "Todos los días";
  return [...days].map(Number).sort((a, b) => a - b).map((day) => DAY_LABELS[day - 1]).join(", ");
}

function MedicationCard({
  med,
  index,
  adherence,
  onEdit,
  onDelete
}: {
  med: MedicationWithSchedules;
  index: number;
  adherence: { taken: number; total: number };
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const schedules = [...med.medication_schedules].sort((a, b) => a.time_of_day.localeCompare(b.time_of_day));
  const percent = adherence.total > 0 ? Math.round((adherence.taken / adherence.total) * 100) : null;

  return (
    <li className="ant-rise overflow-hidden rounded-3xl border-2 border-black/10 bg-white" style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 p-3 text-left transition active:scale-[0.99]">
        <PillTile id={med.id} />
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{med.name}</span>
          <span className="block text-base leading-5 text-muted [overflow-wrap:anywhere]">{med.dosage}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {schedules.length > 0 ? (
              schedules.map((item) => (
                <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-sm font-bold tabular-nums text-violet-900">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {item.time_of_day.slice(0, 5)}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">Cuando la necesito</span>
            )}
          </span>
          {percent !== null ? (
            <span className="mt-2 block">
              <span className="flex justify-between gap-2 text-sm font-semibold text-muted">
                <span>Últimos 7 días</span>
                <span className="tabular-nums">{percent}%</span>
              </span>
              <span className="mt-0.5 block h-3 overflow-hidden rounded-sm bg-slate-100">
                <span className="pln-grow block h-full rounded-sm bg-violet-600" style={{ "--to": `${percent}%`, "--i": index } as CSSProperties} />
              </span>
            </span>
          ) : null}
        </span>
        <ExpandChevron />
      </button>
      <Expand open={open}>
        <div className="space-y-2 px-3 pb-3">
          {med.instructions ? <DetailBlock title="Indicaciones">{med.instructions}</DetailBlock> : null}
          {schedules.length > 0 ? (
            <DetailBlock title="Horarios">
              <ul className="space-y-1">
                {schedules.map((item) => (
                  <li key={item.id}>
                    <span className="font-bold tabular-nums">{item.time_of_day.slice(0, 5)}</span> · {daysText(item.repeat_days)}
                  </li>
                ))}
              </ul>
            </DetailBlock>
          ) : null}
          <RowActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </Expand>
    </li>
  );
}

export function MedicationCabinet({
  medications,
  today,
  dosesFor,
  onSave,
  onDelete,
  notify
}: {
  medications: MedicationWithSchedules[];
  today: string;
  dosesFor: (date: string) => Dose[];
  onSave: (input: MedicationSaveInput, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  notify: (text: string, error?: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ medication: MedicationWithSchedules | null } | null>(null);

  const week = Array.from({ length: 7 }, (_, index) => dosesFor(addDays(today, -index))).flat();
  const adherenceOf = (id: string) => {
    const list = week.filter((dose) => dose.medicationId === id && (dose.due || dose.status !== null));
    return { taken: list.filter((dose) => dose.status === "taken").length, total: list.length };
  };

  const scheduleCount = medications.reduce((sum, med) => sum + med.medication_schedules.length, 0);
  const todayCount = dosesFor(today).length;
  const visible = medications.filter((med) => matchesSearch(query, [med.name, med.dosage, med.instructions]));

  return (
    <div className="space-y-4">
      <Hero
        tone="violet"
        art={<MedicineArt />}
        title="Mi botiquín"
        text="Todas tus medicinas con su dosis y sus horarios."
        stats={[
          { label: "Medicinas", value: medications.length },
          { label: "Horarios", value: scheduleCount },
          { label: "Tomas hoy", value: todayCount }
        ]}
      />

      <AddButton tone="violet" label="Agregar medicina" onClick={() => setForm({ medication: null })} />

      {medications.length > 2 ? <SearchBox tone="violet" value={query} onChange={setQuery} label="Buscar medicina" /> : null}

      {medications.length === 0 ? (
        <Empty tone="violet" icon={<Pill className="h-10 w-10" />} title="Aún no hay medicinas" text="Agrega la primera con el botón de arriba." />
      ) : visible.length === 0 ? (
        <Empty tone="violet" icon={<Pill className="h-10 w-10" />} title="No encontré nada" text="Prueba con otra palabra." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {visible.map((med, index) => (
            <MedicationCard
              key={med.id}
              med={med}
              index={index}
              adherence={adherenceOf(med.id)}
              onEdit={() => setForm({ medication: med })}
              onDelete={async () => {
                try {
                  await onDelete(med.id);
                  notify("Borrada");
                } catch {
                  notify("No se pudo borrar. Inténtalo de nuevo.", true);
                }
              }}
            />
          ))}
        </ul>
      )}

      {form ? (
        <MedicationForm
          medication={form.medication}
          medications={medications}
          onClose={() => setForm(null)}
          onSave={async (input) => {
            await onSave(input, form.medication?.id);
            setForm(null);
            notify("¡Guardada!");
          }}
        />
      ) : null}
    </div>
  );
}
