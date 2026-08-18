 "use client";

import { useState, useTransition } from "react";
import { Pill, Plus, Trash2, Clock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createMedication, type ScheduleInput } from "@/lib/supabase/medications";

const DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 7, label: "Dom" }
];

interface ScheduleDraft {
  time_of_day: string;
  repeat_days: number[];
}

export function MedicationForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createSupabaseBrowserClient();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [schedules, setSchedules] = useState<ScheduleDraft[]>([
    { time_of_day: "", repeat_days: [1, 2, 3, 4, 5, 6, 7] }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addSchedule = () => {
    setSchedules([...schedules, { time_of_day: "", repeat_days: [1, 2, 3, 4, 5, 6, 7] }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateScheduleTime = (index: number, time: string) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], time_of_day: time };
    setSchedules(updated);
  };

  const toggleDay = (index: number, day: number) => {
    const updated = [...schedules];
    const current = updated[index].repeat_days;
    updated[index] = {
      ...updated[index],
      repeat_days: current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort()
    };
    setSchedules(updated);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!name || !dosage) {
      setError("Por favor completa nombre y dosis");
      return;
    }

    const validSchedules: ScheduleInput[] = schedules
      .filter((s) => s.time_of_day)
      .map((s) => ({
        time_of_day: s.time_of_day,
        repeat_days: s.repeat_days.length > 0 ? s.repeat_days : [1, 2, 3, 4, 5, 6, 7]
      }));

    startTransition(async () => {
      try {
        await createMedication(supabase, {
          name,
          dosage,
          instructions: instructions || undefined,
          schedules: validSchedules
        });

        setMessage("Medicamento guardado exitosamente");
        setName("");
        setDosage("");
        setInstructions("");
        setSchedules([{ time_of_day: "", repeat_days: [1, 2, 3, 4, 5, 6, 7] }]);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Nombre</span>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-4">
          <Pill className="h-5 w-5 text-muted" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Atorvastatina"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            required
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Dosis</span>
        <input
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="Ej. 20 mg"
          className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Instrucciones (opcional)</span>
        <input
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Ej. Tomar con alimentos"
          className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
        />
      </label>

      <div className="grid gap-3">
        <span className="text-sm font-semibold">Horarios</span>
        {schedules.map((schedule, index) => (
          <div key={index} className="rounded-2xl border border-black/10 bg-background p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-muted" />
              <input
                type="time"
                value={schedule.time_of_day}
                onChange={(e) => updateScheduleTime(index, e.target.value)}
                className="w-full bg-transparent text-base outline-none"
              />
              {schedules.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="shrink-0 rounded-xl bg-rose-50 p-2 text-danger hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(index, day.value)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    schedule.repeat_days.includes(day.value)
                      ? "bg-accent text-white"
                      : "bg-white text-muted border border-black/10"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addSchedule}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 px-4 py-3 text-sm font-semibold text-muted hover:bg-background"
        >
          <Plus className="h-4 w-4" />
          Agregar otro horario
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-success">{message}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar medicamento"}
      </button>
    </form>
  );
}