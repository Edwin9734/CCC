"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, CalendarDays, ClipboardList, FileText, Pencil } from "lucide-react";
import { Badge, Empty, Expand, ExpandChevron, Field, FilterChips, FormSheet, RowActions, SAVE_ERROR, fieldClass } from "@/components/antecedentes/antecedentes-ui";
import { METRIC_META, METRIC_ORDER, STATUS_BADGE, formatValue, isImprovement, isInRange } from "@/components/measurements/measurement-ui";
import { MONTHS, formatLongDate } from "@/lib/antecedentes";
import { getStatusLabel, type LipidMetric } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";

type MetricFilter = "all" | LipidMetric;
type StatusFilter = "all" | "ok" | "alert";

function EditSheet({
  row,
  today,
  onClose,
  onSave
}: {
  row: MeasurementWithStatus;
  today: string;
  onClose: () => void;
  onSave: (input: { value: number; measured_at: string }) => Promise<void>;
}) {
  const [text, setText] = useState(String(formatValue(Number(row.value))));
  const [date, setDate] = useState(row.measured_at);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const value = Number(text.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 2000) {
      setError("Escribe un valor entre 1 y 2000.");
      return;
    }
    if (!date || date > today) {
      setError("Elige una fecha que no sea futura.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ value, measured_at: date });
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  return (
    <FormSheet tone="sky" title={`Corregir ${METRIC_META[row.metric].short}`} icon={<Pencil className="h-7 w-7" />} saving={saving} error={error} onClose={onClose} onSubmit={submit}>
      <Field label="Valor en mg/dL">
        <input type="text" inputMode="decimal" value={text} maxLength={7} onChange={(event) => setText(event.target.value.replace(/[^\d.,]/g, ""))} className={`${fieldClass("sky")} text-center text-3xl font-bold tabular-nums`} />
      </Field>
      <Field label="Fecha">
        <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} className={fieldClass("sky")} />
      </Field>
    </FormSheet>
  );
}

function HistoryRow({
  row,
  previous,
  index,
  onEdit,
  onDelete
}: {
  row: MeasurementWithStatus;
  previous?: MeasurementWithStatus;
  index: number;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const delta = previous ? formatValue(Number(row.value) - Number(previous.value)) : null;
  const meta = METRIC_META[row.metric];

  return (
    <li className={`ant-rise overflow-hidden rounded-3xl border-2 bg-white ${row.status === "CRITICAL" ? "border-red-400" : "border-black/10"}`} style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.99]">
        <span className="h-14 w-1.5 shrink-0 rounded-sm" style={{ backgroundColor: meta.color }} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-bold leading-5 text-ink">{meta.short}</span>
          <span className="block text-3xl font-bold leading-8 tabular-nums text-ink">
            {formatValue(Number(row.value))} <span className="text-sm font-semibold text-muted">mg/dL</span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge className={STATUS_BADGE[row.status] ?? "bg-slate-100 text-slate-800"}>{getStatusLabel(row.status)}</Badge>
            {delta !== null && delta !== 0 ? (
              <span className={`flex items-center gap-0.5 text-sm font-bold tabular-nums ${isImprovement(row.metric, delta) ? "text-emerald-800" : "text-orange-800"}`}>
                {delta > 0 ? <ArrowUp className="h-4 w-4" aria-hidden="true" /> : <ArrowDown className="h-4 w-4" aria-hidden="true" />}
                {Math.abs(delta)}
              </span>
            ) : null}
          </span>
        </span>
        <ExpandChevron />
      </button>
      <Expand open={open}>
        <div className="space-y-2 px-3 pb-3">
          <p className="flex items-center gap-1.5 text-base font-semibold text-muted">
            <CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />
            {formatLongDate(row.measured_at)}
          </p>
          {row.status === "CRITICAL" ? <p className="rounded-2xl bg-red-50 p-3 text-base font-semibold leading-5 text-red-900">Valor crítico: consulta a un médico lo antes posible.</p> : null}
          <RowActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </Expand>
    </li>
  );
}

export function MeasurementHistory({
  measurements,
  today,
  onUpdate,
  onDelete,
  notify
}: {
  measurements: MeasurementWithStatus[];
  today: string;
  onUpdate: (id: string, input: { value: number; measured_at: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  notify: (text: string, error?: boolean) => void;
}) {
  const [metric, setMetric] = useState<MetricFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<MeasurementWithStatus | null>(null);

  const visible = measurements.filter((row) => (metric === "all" || row.metric === metric) && (status === "all" || (status === "ok" ? isInRange(row.status) : !isInRange(row.status))));

  const months: { key: string; label: string; items: MeasurementWithStatus[] }[] = [];
  visible.forEach((row) => {
    const key = row.measured_at.slice(0, 7);
    const group = months.find((entry) => entry.key === key);
    if (group) group.items.push(row);
    else months.push({ key, label: `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`, items: [row] });
  });

  const previousOf = (row: MeasurementWithStatus) => {
    const same = measurements.filter((item) => item.metric === row.metric);
    return same[same.findIndex((item) => item.id === row.id) + 1];
  };

  if (measurements.length === 0) {
    return <Empty tone="sky" icon={<ClipboardList className="h-10 w-10" />} title="Aún no hay mediciones" text="Cuando registres una, aparecerá aquí." />;
  }

  return (
    <div className="space-y-4">
      <FilterChips
        tone="sky"
        label="Filtrar por indicador"
        value={metric}
        onChange={setMetric}
        options={[{ value: "all" as MetricFilter, label: "Todos", count: measurements.length }, ...METRIC_ORDER.map((item) => ({ value: item as MetricFilter, label: METRIC_META[item].short, count: measurements.filter((row) => row.metric === item).length }))]}
      />
      <FilterChips
        tone="sky"
        label="Filtrar por estado"
        value={status}
        onChange={setStatus}
        options={[
          { value: "all", label: "Cualquier estado" },
          { value: "ok", label: "En rango" },
          { value: "alert", label: "Fuera de rango" }
        ]}
      />

      {visible.length === 0 ? (
        <Empty tone="sky" icon={<ClipboardList className="h-10 w-10" />} title="Nada con este filtro" text="Prueba con otra opción." />
      ) : (
        months.map((month) => (
          <section key={month.key} aria-label={month.label}>
            <h3 className="ant-pop inline-flex rounded-full bg-sky-700 px-4 py-1 text-base font-bold capitalize text-white shadow-soft">{month.label}</h3>
            <ul className="mt-2 grid gap-3 lg:grid-cols-2 lg:items-start">
              {month.items.map((row, index) => (
                <HistoryRow
                  key={row.id}
                  row={row}
                  index={index}
                  previous={previousOf(row)}
                  onEdit={() => setEditing(row)}
                  onDelete={async () => {
                    try {
                      await onDelete(row.id);
                      notify("Borrada");
                    } catch {
                      notify("No se pudo borrar. Inténtalo de nuevo.", true);
                    }
                  }}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <Link href="/reportes" className="flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-white px-4 py-2 text-base font-bold text-ink transition active:scale-[0.98]">
        <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
        Crear un reporte para mi médico
      </Link>

      {editing ? (
        <EditSheet
          row={editing}
          today={today}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            await onUpdate(editing.id, input);
            setEditing(null);
            notify("¡Corregida!");
          }}
        />
      ) : null}
    </div>
  );
}
