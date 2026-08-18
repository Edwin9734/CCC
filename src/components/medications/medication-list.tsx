"use client";

import { useEffect, useState } from "react";
import { Trash2, Clock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMedications, deleteMedication, type MedicationWithSchedules } from "@/lib/supabase/medications";

const DAY_LABELS: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom"
};

function formatTime(time: string) {
  // time viene como "HH:MM:SS", lo mostramos como "HH:MM"
  return time.slice(0, 5);
}

function formatDays(days: number[]) {
  if (days.length === 7) return "Todos los días";
  return days
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(", ");
}

export function MedicationList({ refreshTrigger }: { refreshTrigger?: number }) {
  const supabase = createSupabaseBrowserClient();
  const [medications, setMedications] = useState<MedicationWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedications(supabase);
      setMedications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar medicamentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteMedication(supabase, id);
      setMedications(medications.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-muted">Cargando medicamentos...</div>;
  }

  if (error) {
    return <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</div>;
  }

  if (medications.length === 0) {
    return <div className="text-center text-sm text-muted">No hay medicamentos registrados aún.</div>;
  }

  return (
    <div className="space-y-4">
      {medications.map((med) => (
        <article key={med.id} className="rounded-3xl border border-black/5 bg-background p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{med.name}</p>
              <p className="mt-1 text-sm text-muted">{med.dosage}</p>
              {med.instructions ? (
                <p className="mt-1 text-xs text-muted italic">{med.instructions}</p>
              ) : null}
            </div>
            <button
              onClick={() => handleDelete(med.id)}
              disabled={deleting === med.id}
              className="rounded-2xl bg-rose-50 p-3 text-danger transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {med.medication_schedules.length > 0 ? (
            <div className="mt-3 space-y-2">
              {med.medication_schedules.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-semibold text-ink">{formatTime(s.time_of_day)}</span>
                  <span>· {formatDays(s.repeat_days)}</span>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}