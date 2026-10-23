"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { ACTIVITY_TYPES, activityLabel } from "@/lib/habits-config";
import type { ActivityRow } from "@/lib/supabase/habits";

const QUICK_MINUTES = [15, 30, 45, 60];

export function ActivityCard({
  activities,
  onAdd,
  onDelete
}: {
  activities: ActivityRow[];
  onAdd: (input: { activity_type: string; minutes: number; notes: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [type, setType] = useState(ACTIVITY_TYPES[0].key);
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 600) {
      setError("Escribe los minutos con un número entero entre 1 y 600.");
      return;
    }

    setSaving(true);
    try {
      await onAdd({ activity_type: type, minutes: value, notes: notes.trim() });
      setMinutes("");
      setNotes("");
    } catch (err) {
      console.error("Error al guardar la actividad:", err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await onDelete(id);
    } catch (err) {
      console.error("Error al eliminar la actividad:", err);
      setError("No se pudo eliminar. Inténtalo de nuevo.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <SectionCard
      title="Actividad física"
      description="Anota lo que hiciste hoy. Puedes agregar varias actividades en el mismo día."
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Actividad</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
          >
            {ACTIVITY_TYPES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Minutos</span>
          <input
            type="number"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Ej. 30"
            min="1"
            max="600"
            step="1"
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_MINUTES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMinutes(String(value))}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                {value} min
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Nota (opcional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="Ej. Caminé por el parque con mi vecina"
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Guardando..." : "Agregar actividad"}
        </button>
      </form>

      <div className="mt-5">
        {activities.length === 0 ? (
          <p className="text-sm text-muted">No hay actividad registrada en este día.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">Total del día: {totalMinutes} min</p>
            <div className="mt-3 space-y-3">
              {activities.map((activity) => (
                <article
                  key={activity.id}
                  className="flex items-start justify-between gap-3 rounded-3xl border border-black/5 bg-background p-4"
                >
                  <div>
                    <p className="text-base font-semibold text-ink">{activityLabel(activity.activity_type)}</p>
                    <p className="mt-1 text-sm text-muted">{activity.minutes} min</p>
                    {activity.notes ? <p className="mt-1 text-sm leading-6 text-muted">{activity.notes}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(activity.id)}
                    disabled={deleting === activity.id}
                    aria-label="Eliminar actividad"
                    className="rounded-2xl bg-rose-50 p-3 text-danger transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Consulta a tu médico antes de empezar o aumentar la actividad física.
      </p>
    </SectionCard>
  );
}