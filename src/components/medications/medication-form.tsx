"use client";

import { useState, type CSSProperties } from "react";
import { Clock, Pill, Plus, Trash2 } from "lucide-react";
import { Field, FormSheet, Group, SAVE_ERROR, TextHelpers, fieldClass } from "@/components/antecedentes/antecedentes-ui";
import { DAY_LABELS, type MedicationSaveInput } from "@/components/medications/medication-ui";
import { sameText } from "@/lib/antecedentes";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
const NAME_IDEAS = ["Atorvastatina", "Rosuvastatina", "Simvastatina", "Ezetimiba", "Fenofibrato", "Metformina", "Losartán", "Aspirina"];
const DOSE_IDEAS = ["1 tableta", "½ tableta", "10 mg", "20 mg", "40 mg"];
const INSTRUCTION_IDEAS = ["Con alimentos", "En ayunas", "Antes de dormir", "Con un vaso de agua"];
const TIME_IDEAS = [
  { label: "Al despertar", time: "07:00" },
  { label: "Desayuno", time: "08:00" },
  { label: "Almuerzo", time: "13:00" },
  { label: "Cena", time: "19:00" },
  { label: "Al dormir", time: "21:00" }
];

interface ScheduleDraft {
  key: number;
  id?: string;
  time_of_day: string;
  repeat_days: number[];
}

let nextKey = 1;
const blankSchedule = (): ScheduleDraft => ({ key: nextKey++, time_of_day: "", repeat_days: ALL_DAYS });

export function MedicationForm({
  medication,
  medications,
  onSave,
  onClose
}: {
  medication: MedicationWithSchedules | null;
  medications: MedicationWithSchedules[];
  onSave: (input: MedicationSaveInput) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(medication?.name ?? "");
  const [dosage, setDosage] = useState(medication?.dosage ?? "");
  const [instructions, setInstructions] = useState(medication?.instructions ?? "");
  const [schedules, setSchedules] = useState<ScheduleDraft[]>(() =>
    medication && medication.medication_schedules.length > 0
      ? medication.medication_schedules.map((item) => ({
          key: nextKey++,
          id: item.id,
          time_of_day: item.time_of_day.slice(0, 5),
          repeat_days: item.repeat_days?.length ? [...item.repeat_days].map(Number).sort((a, b) => a - b) : ALL_DAYS
        }))
      : [blankSchedule()]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (key: number, changes: Partial<ScheduleDraft>) => setSchedules((current) => current.map((item) => (item.key === key ? { ...item, ...changes } : item)));

  const toggleDay = (item: ScheduleDraft, day: number) =>
    patch(item.key, { repeat_days: item.repeat_days.includes(day) ? item.repeat_days.filter((value) => value !== day) : [...item.repeat_days, day].sort((a, b) => a - b) });

  const ideas = medication ? [] : NAME_IDEAS.filter((idea) => !medications.some((med) => sameText(med.name, idea)));

  const submit = async () => {
    const cleanName = name.trim();
    const cleanDose = dosage.trim();
    if (cleanName === "" || cleanDose === "") {
      setError("Escribe el nombre y la dosis.");
      return;
    }
    if (schedules.some((item) => item.time_of_day && item.repeat_days.length === 0)) {
      setError("Elige al menos un día para cada horario.");
      return;
    }

    // Un horario guardado que quedó sin hora se elimina; lo demás se conserva con su historial.
    const kept = schedules.filter((item) => item.time_of_day);
    const keptIds = new Set(kept.map((item) => item.id));
    const removedScheduleIds = (medication?.medication_schedules ?? []).map((item) => item.id).filter((id) => !keptIds.has(id));

    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: cleanName,
        dosage: cleanDose,
        instructions: instructions.trim() || undefined,
        schedules: kept.map((item) => ({ id: item.id, time_of_day: item.time_of_day, repeat_days: item.repeat_days })),
        removedScheduleIds
      });
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  return (
    <FormSheet tone="violet" title={medication ? "Editar medicina" : "Agregar medicina"} icon={<Pill className="h-7 w-7" />} saving={saving} error={error} onClose={onClose} onSubmit={submit}>
      <Field label="Nombre">
        <input type="text" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Ej. Atorvastatina" className={fieldClass("violet")} />
        {ideas.length > 0 && name.trim() === "" ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {ideas.map((idea) => (
              <button key={idea} type="button" onClick={() => setName(idea)} className="ant-pop flex min-h-10 items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800 transition active:scale-95">
                {idea}
              </button>
            ))}
          </span>
        ) : null}
      </Field>

      <Field label="Dosis">
        <input type="text" value={dosage} maxLength={80} onChange={(event) => setDosage(event.target.value)} placeholder="Ej. 20 mg" className={fieldClass("violet")} />
        {dosage.trim() === "" ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {DOSE_IDEAS.map((idea) => (
              <button key={idea} type="button" onClick={() => setDosage(idea)} className="flex min-h-10 items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800 transition active:scale-95">
                {idea}
              </button>
            ))}
          </span>
        ) : null}
      </Field>

      <div>
        <Field label="Indicaciones" hint="Opcional">
          <input type="text" value={instructions} maxLength={200} onChange={(event) => setInstructions(event.target.value)} placeholder="Ej. Con alimentos" className={fieldClass("violet")} />
        </Field>
        <TextHelpers tone="violet" options={INSTRUCTION_IDEAS} value={instructions} onPick={setInstructions} />
      </div>

      <Group label="¿A qué hora la tomas?" hint="Si es solo cuando la necesitas, déjalo sin hora.">
        <div className="space-y-3">
          {schedules.map((item, index) => {
            const everyDay = item.repeat_days.length === 7;
            return (
              <div key={item.key} className="ant-rise rounded-2xl bg-violet-50 p-3" style={{ "--i": 0 } as CSSProperties}>
                <div className="flex items-center gap-2">
                  <Clock className="ant-tile h-6 w-6 shrink-0 text-violet-700" aria-hidden="true" />
                  <input type="time" value={item.time_of_day} aria-label={`Hora ${index + 1}`} onChange={(event) => patch(item.key, { time_of_day: event.target.value })} className={`${fieldClass("violet")} text-xl font-bold`} />
                  {schedules.length > 1 ? (
                    <button type="button" onClick={() => setSchedules((current) => current.filter((entry) => entry.key !== item.key))} aria-label={`Quitar horario ${index + 1}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-red-800 transition active:scale-90">
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {TIME_IDEAS.map((idea) => (
                    <button
                      key={idea.label}
                      type="button"
                      onClick={() => patch(item.key, { time_of_day: idea.time })}
                      aria-pressed={item.time_of_day === idea.time}
                      className={`min-h-10 rounded-full border-2 px-3 py-1 text-sm font-semibold transition active:scale-95 ${item.time_of_day === idea.time ? "border-violet-700 bg-violet-700 text-white" : "border-black/10 bg-white text-ink"}`}
                    >
                      {idea.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => patch(item.key, { repeat_days: ALL_DAYS })}
                    aria-pressed={everyDay}
                    className={`min-h-10 rounded-full border-2 px-3 py-1 text-sm font-bold transition active:scale-95 ${everyDay ? "border-violet-700 bg-violet-700 text-white" : "border-black/10 bg-white text-ink"}`}
                  >
                    Todos los días
                  </button>
                  {DAY_LABELS.map((label, dayIndex) => {
                    const on = item.repeat_days.includes(dayIndex + 1);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleDay(item, dayIndex + 1)}
                        aria-pressed={on}
                        className={`min-h-10 min-w-11 rounded-full border-2 px-1.5 py-1 text-sm font-semibold transition active:scale-90 ${on ? "border-violet-300 bg-violet-200 text-violet-950" : "border-black/10 bg-white text-muted"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <button type="button" onClick={() => setSchedules((current) => [...current, blankSchedule()])} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-300 px-3 py-2 text-base font-semibold text-violet-900 transition active:scale-[0.98]">
            <Plus className="h-5 w-5 shrink-0" aria-hidden="true" />
            Agregar otra hora
          </button>
        </div>
      </Group>
    </FormSheet>
  );
}
