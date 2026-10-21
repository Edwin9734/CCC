"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMeasurements, deleteMeasurement, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getStatusLabel } from "@/lib/ranges";
import { formatDate } from "@/lib/date-utils";

const STATUS_TEXT: Record<string, string> = {
  LOW: "text-blue-600",
  NORMAL: "text-green-600",
  PROTECTIVE: "text-emerald-700",
  BORDERLINE: "text-amber-600",
  HIGH: "text-orange-600",
  VERY_HIGH: "text-red-600"
};

export function MeasurementList({ refreshTrigger }: { refreshTrigger?: number }) {
  const supabase = createSupabaseBrowserClient();
  const [measurements, setMeasurements] = useState<MeasurementWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadMeasurements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeasurements(supabase);
      setMeasurements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar mediciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeasurements();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteMeasurement(supabase, id);
      setMeasurements(measurements.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-center text-sm text-muted">Cargando mediciones...</div>;
  }

  if (error) {
    return <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</div>;
  }

  if (measurements.length === 0) {
    return <div className="text-center text-sm text-muted">No hay mediciones registradas aún.</div>;
  }

  return (
    <div className="space-y-3">
      {measurements.map((measurement) => {
        const statusLabel = getStatusLabel(measurement.status);
        const statusColor = STATUS_TEXT[measurement.status] ?? "text-gray-600";
        const isCritical = measurement.status === "CRITICAL";

        return (
          <article
            key={measurement.id}
            className={`flex items-start justify-between rounded-3xl border p-5 ${
              isCritical ? "border-red-300 bg-red-50" : "border-black/5 bg-background"
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{measurement.metric}</p>
              <p className="mt-1 text-sm text-muted">{measurement.value} mg/dL</p>

              {isCritical ? (
                <>
                  <p className="mt-1 inline-block rounded-full border border-red-700 bg-red-100 px-3 py-1 text-sm font-bold text-red-900">
                    {statusLabel}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-red-900">
                    Valor crítico: consulta a un médico lo antes posible.
                  </p>
                </>
              ) : (
                <p className={`mt-1 text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
              )}

              <p className="mt-1 text-xs text-muted">{formatDate(measurement.measured_at)}</p>
            </div>
            <button
              onClick={() => handleDelete(measurement.id)}
              disabled={deleting === measurement.id}
              className="rounded-2xl bg-rose-50 p-3 text-danger transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        );
      })}
    </div>
  );
}