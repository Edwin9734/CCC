"use client";

import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, Check, Minus, Plus, TriangleAlert } from "lucide-react";
import { Confetti } from "@/components/habits/habit-visuals";
import { Badge, ChoicePills, Hero, SAVE_ERROR, fieldClass } from "@/components/antecedentes/antecedentes-ui";
import {
  METRIC_META,
  METRIC_ORDER,
  STATUS_BADGE,
  TubeArt,
  ZoneRuler,
  daysBetween,
  formatValue,
  isImprovement,
  isInRange
} from "@/components/measurements/measurement-ui";
import { addDays } from "@/lib/date-utils";
import type { Sex } from "@/lib/profile";
import { getLipidStatus, getStatusLabel, type LipidMetric } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";

type DateMode = "today" | "yesterday" | "other";

function parseValue(text: string) {
  const parsed = Number(text.replace(",", "."));
  return text.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}

export function MeasurementEntry({
  measurements,
  today,
  sex,
  onCreate,
  notify
}: {
  measurements: MeasurementWithStatus[];
  today: string;
  sex: Sex | null;
  onCreate: (input: { metric: LipidMetric; value: number; measured_at: string }) => Promise<MeasurementWithStatus>;
  notify: (text: string, error?: boolean) => void;
}) {
  const [metric, setMetric] = useState<LipidMetric>("LDL");
  const [text, setText] = useState("");
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [otherDate, setOtherDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<MeasurementWithStatus | null>(null);
  const [cheer, setCheer] = useState(0);

  const date = dateMode === "today" ? today : dateMode === "yesterday" ? addDays(today, -1) : otherDate;
  const latestOf = (item: LipidMetric) => measurements.find((row) => row.metric === item);
  const last = latestOf(metric);
  const value = parseValue(text);
  const validValue = value !== null && value > 0 && value <= 2000 ? value : null;
  const status = validValue === null ? null : getLipidStatus(metric, validValue, sex);
  const delta = validValue !== null && last ? formatValue(validValue - Number(last.value)) : null;
  const looksOff = validValue !== null && last ? Math.abs(validValue - Number(last.value)) / Number(last.value) >= 0.6 : false;
  const sameDay = measurements.find((row) => row.metric === metric && row.measured_at === date);
  // Hay registros antiguos con fecha futura: no cuentan para calcular los días sin medir.
  const latestDate = measurements.find((row) => row.measured_at <= today)?.measured_at;
  const sinceLast = latestDate ? daysBetween(latestDate, today) : null;
  const inRange = METRIC_ORDER.filter((item) => {
    const row = latestOf(item);
    return row && isInRange(row.status);
  }).length;

  const step = (amount: number) => {
    const base = value ?? (last ? Number(last.value) : 0);
    setText(String(Math.max(0, Math.min(2000, formatValue(base + amount)))));
    setSaved(null);
  };

  const submit = async () => {
    if (validValue === null) {
      setError("Escribe un valor entre 1 y 2000.");
      return;
    }
    if (date > today) {
      setError("La fecha no puede ser futura.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onCreate({ metric, value: validValue, measured_at: date });
      setSaved(created);
      setText("");

      const done = new Set([...measurements.filter((row) => row.measured_at === date).map((row) => row.metric), metric]);
      const next = METRIC_ORDER.find((item) => !done.has(item));
      if (next) {
        setMetric(next);
        notify(`Guardado. Ahora puedes anotar ${METRIC_META[next].short}.`);
      } else {
        setCheer(Date.now());
        notify("¡Completaste tus 3 valores!");
      }
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative space-y-4">
      {cheer ? <Confetti key={cheer} /> : null}

      <Hero
        tone="sky"
        art={<TubeArt />}
        title="Mis mediciones"
        text={
          sinceLast === null
            ? "Anota tu primer análisis y empieza a ver tu evolución."
            : sinceLast === 0
              ? "Registraste una medición hoy. ¡Bien!"
              : `Tu última medición fue hace ${sinceLast} ${sinceLast === 1 ? "día" : "días"}.`
        }
        stats={[
          { label: "Registros", value: measurements.length },
          { label: "En rango", value: inRange },
          { label: "Días sin medir", value: sinceLast ?? 0 }
        ]}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(6.25rem,1fr))] gap-2" role="group" aria-label="Indicador">
        {METRIC_ORDER.map((item, index) => {
          const row = latestOf(item);
          const selected = item === metric;
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMetric(item);
                setSaved(null);
                setError(null);
              }}
              aria-pressed={selected}
              className={`ant-pop flex min-h-[6.5rem] flex-col items-center justify-center rounded-3xl border-2 p-2 text-center transition active:scale-95 ${
                selected ? "border-sky-700 bg-sky-700 text-white shadow-soft" : "border-black/10 bg-white text-ink"
              }`}
              style={{ "--i": index } as CSSProperties}
            >
              <span className="text-base font-bold leading-5 [overflow-wrap:anywhere]">{METRIC_META[item].short}</span>
              <span className={`text-sm leading-4 ${selected ? "text-white/90" : "text-muted"}`}>{METRIC_META[item].hint}</span>
              <span className="mt-1 text-2xl font-bold leading-7 tabular-nums">{row ? formatValue(Number(row.value)) : "—"}</span>
            </button>
          );
        })}
      </div>

      <section key={metric} className="ant-rise ab-card rounded-[1.75rem] p-4">
        <h3 className="text-center text-lg font-bold text-ink">¿Cuánto salió tu {METRIC_META[metric].short}?</h3>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => step(-1)} aria-label="Restar uno" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-black/10 bg-white text-ink transition active:scale-90">
            <Minus className="h-7 w-7" aria-hidden="true" />
          </button>
          <label className="min-w-0 flex-1 text-center">
            <span className="sr-only">Valor en mg/dL</span>
            <input
              type="text"
              inputMode="decimal"
              value={text}
              maxLength={7}
              onChange={(event) => {
                setText(event.target.value.replace(/[^\d.,]/g, ""));
                setSaved(null);
                setError(null);
              }}
              placeholder="0"
              className="w-full bg-transparent text-center text-6xl font-bold tabular-nums text-ink outline-none placeholder:text-slate-300"
            />
            <span className="block text-sm font-semibold text-muted">mg/dL</span>
          </label>
          <button type="button" onClick={() => step(1)} aria-label="Sumar uno" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-700 text-white transition active:scale-90">
            <Plus className="h-7 w-7" aria-hidden="true" />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={METRIC_META[metric].max}
          value={Math.min(validValue ?? 0, METRIC_META[metric].max)}
          onChange={(event) => {
            setText(event.target.value);
            setSaved(null);
          }}
          aria-label="Ajustar el valor"
          className="pln-range mt-2 block"
          style={{ accentColor: "#0369a1" }}
        />

        <ZoneRuler metric={metric} value={validValue} sex={sex} />

        <div className="mt-2 flex min-h-9 flex-wrap items-center justify-center gap-2">
          {status ? (
            <span key={status}>
              <Badge className={`ant-pop text-base ${STATUS_BADGE[status] ?? "bg-slate-100 text-slate-800"}`}>{getStatusLabel(status)}</Badge>
            </span>
          ) : (
            <span className="text-base font-semibold text-muted">Escribe o desliza el valor</span>
          )}
          {delta !== null && delta !== 0 ? (
            <span className={`flex items-center gap-1 text-base font-bold tabular-nums ${isImprovement(metric, delta) ? "text-emerald-800" : "text-orange-800"}`}>
              {delta > 0 ? <ArrowUp className="h-5 w-5" aria-hidden="true" /> : <ArrowDown className="h-5 w-5" aria-hidden="true" />}
              {Math.abs(delta)} que la última
            </span>
          ) : null}
        </div>

        {looksOff && last ? (
          <p className="ant-pop mt-2 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">Es muy distinto a tu último valor ({formatValue(Number(last.value))}). Revisa que esté bien escrito.</span>
          </p>
        ) : null}

        <div className="mt-3">
          <p className="text-base font-bold text-ink">¿Cuándo te lo hiciste?</p>
          <div className="mt-1.5">
            <ChoicePills<DateMode>
              tone="sky"
              columns="grid-cols-3"
              options={[
                { value: "today", label: "Hoy" },
                { value: "yesterday", label: "Ayer" },
                { value: "other", label: "Otra" }
              ]}
              value={dateMode}
              onChange={setDateMode}
            />
          </div>
          {dateMode === "other" ? (
            <input type="date" value={otherDate} max={today} aria-label="Fecha del análisis" onChange={(event) => setOtherDate(event.target.value)} className={`ant-rise mt-2 ${fieldClass("sky")}`} />
          ) : null}
        </div>

        {sameDay ? (
          <p className="mt-2 text-sm font-semibold leading-5 text-muted">
            Ya tienes {METRIC_META[metric].short} ese día ({formatValue(Number(sameDay.value))}). Se agregará otra medición.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="ant-shake mt-2 rounded-2xl bg-rose-50 px-4 py-2 text-base font-semibold text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="mt-3 flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-xl font-bold text-white shadow-soft transition hover:bg-sky-800 active:scale-[0.98] disabled:opacity-60"
        >
          <Check className="h-7 w-7 shrink-0" aria-hidden="true" />
          {saving ? "Guardando…" : "Guardar medición"}
        </button>

        {saved ? (
          <p key={saved.id} className="ant-pop mt-2 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-emerald-50 p-3 text-center text-base font-bold text-emerald-950">
            <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
            {METRIC_META[saved.metric].short}: {formatValue(Number(saved.value))} guardado · {getStatusLabel(saved.status)}
          </p>
        ) : null}
      </section>
    </div>
  );
}
