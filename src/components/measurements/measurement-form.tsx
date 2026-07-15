"use client";

import { useState, useTransition } from "react";
import { CalendarIcon, BarChart3 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createMeasurement } from "@/lib/supabase/measurements";

export function MeasurementForm({ onSuccess }: { onSuccess?: () => void }) {
  const supabase = createSupabaseBrowserClient();
  const [metric, setMetric] = useState<"HDL" | "LDL" | "TRIGLYCERIDES">("HDL");
  const [value, setValue] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!value || !measuredAt) {
      setError("Por favor completa todos los campos");
      return;
    }

    startTransition(async () => {
      try {
        await createMeasurement(supabase, {
          metric,
          value: parseFloat(value),
          measured_at: measuredAt
        });

        setMessage("Medición guardada exitosamente");
        setValue("");
        setMeasuredAt("");
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold">Indicador</span>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as "HDL" | "LDL" | "TRIGLYCERIDES")}
          className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
        >
          <option value="HDL">HDL (Colesterol bueno)</option>
          <option value="LDL">LDL (Colesterol malo)</option>
          <option value="TRIGLYCERIDES">Triglicéridos</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Valor en mg/dL</span>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-4">
          <BarChart3 className="h-5 w-5 text-muted" />
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej. 120"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            min="0"
            max="500"
            step="0.01"
            required
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">Fecha</span>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-4">
          <CalendarIcon className="h-5 w-5 text-muted" />
          <input
            type="date"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
            required
          />
        </div>
      </label>

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
        {isPending ? "Guardando..." : "Guardar medición"}
      </button>
    </form>
  );
}
