"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertCircle,
  Apple,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Droplets,
  type LucideIcon,
  Minus,
  Moon,
  Pill,
  Sliders,
  ThumbsUp
} from "lucide-react";
import { Expand, Hero } from "@/components/antecedentes/antecedentes-ui";
import { SlidersArt } from "@/components/plan/plan-art";
import { LDL_GOAL, TRIGLYCERIDES_GOAL } from "@/lib/plan";
import {
  ADJUSTMENT_DISCLAIMER,
  MIN_RECORDED_DAYS,
  computeActivityAdjustment,
  type ComplianceArea,
  type MetricTrend,
  type PlanAdjustment,
  type TrendDirection
} from "@/lib/plan-adjustment";
import { shortHash, weekDates } from "@/lib/plan-goals";
import type { LipidMetric } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";

const TREND: Record<TrendDirection, { chip: string; icon: LucideIcon }> = {
  improving: { chip: "bg-emerald-100 text-emerald-900", icon: ThumbsUp },
  stable: { chip: "bg-slate-100 text-slate-800", icon: Minus },
  worsening: { chip: "bg-orange-100 text-orange-950", icon: AlertCircle },
  insufficient: { chip: "bg-slate-100 text-slate-700", icon: CircleDashed }
};

const AREA: Record<ComplianceArea["key"], { icon: LucideIcon; tile: string; href: string }> = {
  meds: { icon: Pill, tile: "bg-violet-100 text-violet-800", href: "/habitos?tab=medicamentos" },
  water: { icon: Droplets, tile: "bg-sky-100 text-sky-800", href: "/habitos?tab=agua" },
  sleep: { icon: Moon, tile: "bg-indigo-100 text-indigo-800", href: "/habitos?tab=agua" },
  activity: { icon: Activity, tile: "bg-orange-100 text-orange-900", href: "/habitos?tab=actividad" },
  food: { icon: Apple, tile: "bg-emerald-100 text-emerald-800", href: "/diario" }
};

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}`;
}

function EvolutionTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; value: number } }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-soft">
      {point.date}: {point.value} mg/dL
    </div>
  );
}

function Evolution({ trends, measurements, hdlMinimum }: { trends: MetricTrend[]; measurements: MeasurementWithStatus[]; hdlMinimum: number }) {
  const [metric, setMetric] = useState<LipidMetric>(trends[0].metric);
  const [open, setOpen] = useState(false);
  const trend = trends.find((item) => item.metric === metric) ?? trends[0];

  const points = useMemo(
    () =>
      measurements
        .filter((item) => item.metric === metric)
        .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
        .slice(-8)
        .map((item) => ({ date: shortDate(item.measured_at), value: Number(item.value) })),
    [measurements, metric]
  );

  const goal = metric === "LDL" ? LDL_GOAL : metric === "TRIGLYCERIDES" ? TRIGLYCERIDES_GOAL : hdlMinimum;
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const delta = last && previous ? Math.round((last.value - previous.value) * 10) / 10 : null;
  const style = TREND[trend.direction];
  const Icon = style.icon;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="text-lg font-bold text-ink">Mi evolución</h3>
      <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="Indicador">
        {trends.map((item) => {
          const ItemIcon = TREND[item.direction].icon;
          const selected = item.metric === metric;
          return (
            <button
              key={item.metric}
              type="button"
              onClick={() => setMetric(item.metric)}
              aria-pressed={selected}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 p-1 text-sm font-bold leading-4 transition active:scale-95 [overflow-wrap:anywhere] ${
                selected ? "border-violet-700 bg-violet-700 text-white" : "border-black/10 bg-white text-ink"
              }`}
            >
              <ItemIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {item.metric === "TRIGLYCERIDES" ? "Triglicéridos" : item.metric}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-bold ${style.chip}`}>
          <Icon className="ant-pop h-5 w-5" aria-hidden="true" />
          {trend.directionLabel}
        </span>
        {delta !== null ? (
          <span key={metric} className="ant-pop text-2xl font-bold tabular-nums text-ink">
            {delta > 0 ? "+" : ""}
            {delta} <span className="text-sm font-semibold text-muted">mg/dL</span>
          </span>
        ) : null}
      </div>

      {points.length > 0 ? (
        <div className="mt-2 h-52" key={metric}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#f1e4e7" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2d5d9" }} />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                domain={[(min: number) => Math.floor(Math.min(min, goal) * 0.85), (max: number) => Math.ceil(Math.max(max, goal) * 1.1)]}
              />
              <Tooltip content={<EvolutionTooltip />} />
              <ReferenceLine y={goal} stroke="#059669" strokeDasharray="6 4" strokeWidth={2} label={{ value: `Meta ${goal}`, position: "insideTopRight", fontSize: 12, fill: "#065f46", fontWeight: 700 }} />
              <Line type="linear" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={!reduced} animationDuration={900} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Link href="/mediciones" className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-accent px-4 py-2 text-base font-semibold text-white">
          Registrar una medición
        </Link>
      )}

      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 flex min-h-11 items-center gap-1 text-base font-semibold text-ink">
        Ver los números
        <ChevronDown className="ant-chevron h-5 w-5" aria-hidden="true" />
      </button>
      <Expand open={open}>
        <div>
          <p className="text-sm leading-5 text-muted">{trend.detail}</p>
          {points.length > 0 ? (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="text-muted">
                  <th scope="col" className="py-1 font-semibold">Fecha</th>
                  <th scope="col" className="py-1 text-right font-semibold">mg/dL</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((point, index) => (
                  <tr key={`${point.date}-${index}`} className="border-t border-black/5 text-ink">
                    <td className="py-1">{point.date}</td>
                    <td className="py-1 text-right font-semibold tabular-nums">{point.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </Expand>
    </section>
  );
}

function AreaTile({ area, index }: { area: ComplianceArea; index: number }) {
  const meta = AREA[area.key];
  const Icon = meta.icon;
  const StatusIcon = area.status === "met" ? CheckCircle2 : area.status === "not_met" ? AlertCircle : CircleDashed;
  const statusColor = area.status === "met" ? "text-emerald-700" : area.status === "not_met" ? "text-orange-700" : "text-muted";
  const barColor = area.status === "met" ? "bg-emerald-500" : "bg-orange-500";

  return (
    <Link href={meta.href} className="ant-pop flex items-center gap-3 rounded-2xl border-2 border-black/10 bg-white p-2.5 transition active:scale-[0.98]" style={{ "--i": index } as CSSProperties}>
      <span className={`ant-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tile}`} aria-hidden="true">
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 text-base font-bold leading-5 text-ink">{area.label}</span>
          <StatusIcon className={`h-5 w-5 shrink-0 ${statusColor}`} aria-label={area.status === "met" ? "Cumplido" : area.status === "not_met" ? "Por mejorar" : "Sin datos"} />
        </span>
        <span className="mt-1 block h-3 overflow-hidden rounded-sm bg-slate-100">
          <span className={`pln-grow block h-full rounded-sm ${barColor}`} style={{ "--to": `${Math.round((area.progress ?? 0) * 100)}%`, "--i": index } as CSSProperties} />
        </span>
        <span className="mt-0.5 block text-sm leading-5 text-muted">{area.value}</span>
      </span>
    </Link>
  );
}

function Simulator({ baseMinutes }: { baseMinutes: number }) {
  const [minutes, setMinutes] = useState(baseMinutes);
  const result = computeActivityAdjustment(baseMinutes, minutes, 7);
  const Icon = result.minutes > baseMinutes ? ArrowUp : result.minutes < baseMinutes ? ArrowDown : ArrowRight;
  const tone = result.minutes > baseMinutes ? "bg-emerald-100 text-emerald-950" : result.minutes < baseMinutes ? "bg-amber-100 text-amber-950" : "bg-violet-100 text-violet-950";
  const headline = result.minutes > baseMinutes ? "Tu meta subiría" : result.minutes < baseMinutes ? "Tu meta bajaría para que sea más fácil" : "Tu meta se mantendría";

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Sliders className="h-5 w-5 text-violet-700" aria-hidden="true" />
        ¿Y si me muevo…?
      </h3>
      <p className="text-sm leading-5 text-muted">Mueve la barra y mira cómo cambiaría tu meta de la próxima semana.</p>
      <label className="mt-2 block text-center text-3xl font-bold tabular-nums text-ink">
        {minutes} <span className="text-base font-semibold text-muted">min esta semana</span>
        <input type="range" min={0} max={200} step={5} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="pln-range mt-1 block" />
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Nada", value: 0 },
          { label: "La mitad", value: Math.round(baseMinutes / 2) },
          { label: "Mi meta", value: baseMinutes }
        ].map((preset) => (
          <button key={preset.label} type="button" onClick={() => setMinutes(preset.value)} className="min-h-11 rounded-full border-2 border-black/10 bg-white px-1 text-sm font-semibold text-ink transition active:scale-95">
            {preset.label}
          </button>
        ))}
      </div>
      <div key={result.minutes} className={`ant-pop mt-3 flex items-center gap-3 rounded-2xl p-3 ${tone}`}>
        <Icon className="h-8 w-8 shrink-0" aria-hidden="true" />
        <p className="min-w-0 text-base font-bold leading-5">
          {headline}
          <span className="block text-2xl tabular-nums">{result.minutes} min</span>
        </p>
      </div>
    </section>
  );
}

function ChangeRow({ title, detail, index }: { title: string; detail: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="ant-rise rounded-2xl border-2 border-black/10 bg-white" style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-14 w-full items-center gap-2 p-3 text-left text-base font-bold leading-5 text-ink">
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronDown className="ant-chevron h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      </button>
      <Expand open={open}>
        <p className="px-3 pb-3 text-base leading-6 text-muted">{detail}</p>
      </Expand>
    </li>
  );
}

export function PlanAjuste({
  adjustment,
  measurements,
  hdlMinimum,
  today,
  hasMark,
  onToggleMark
}: {
  adjustment: PlanAdjustment;
  measurements: MeasurementWithStatus[];
  hdlMinimum: number;
  today: string;
  hasMark: (kind: "todo", key: string) => boolean;
  onToggleMark: (kind: "todo", key: string) => void;
}) {
  const { trends, compliance, changes, recommendations, activity } = adjustment;
  const monday = weekDates(today)[0];
  const keyOf = (text: string) => `${monday}:${shortHash(text)}`;
  const doneCount = recommendations.filter((text) => hasMark("todo", keyOf(text))).length;

  return (
    <div className="space-y-4">
      <Hero
        tone="violet"
        art={<SlidersArt />}
        title="Ajuste de mi plan"
        text={compliance.evaluable ? compliance.levelMessage : `Cumplimiento: ${compliance.levelLabel}`}
        stats={[
          { label: "Días con registro", value: compliance.recordedDays },
          { label: "Áreas cumplidas", value: compliance.metCount },
          { label: "Meta en min", value: activity.minutes }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Evolution trends={trends} measurements={measurements} hdlMinimum={hdlMinimum} />

        <div className="space-y-4">
          <section className="ant-rise ab-card rounded-[1.75rem] p-4">
            <h3 className="text-lg font-bold text-ink">Mi cumplimiento, 7 días</h3>
            {!compliance.evaluable ? (
              <p className="mt-1 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950">
                Llevas {compliance.recordedDays} de {MIN_RECORDED_DAYS} días necesarios para evaluarte. Toca un área para registrar.
              </p>
            ) : null}
            <div className="mt-2 grid gap-2">
              {compliance.areas.map((area, index) => (
                <AreaTile key={area.key} area={area} index={index} />
              ))}
            </div>
          </section>

          <Simulator baseMinutes={activity.baseMinutes} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <section className="ant-rise ab-card rounded-[1.75rem] p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-ink">Esta semana</h3>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-900 tabular-nums">
              {doneCount} de {recommendations.length}
            </span>
          </div>
          <ul className="mt-2 space-y-2">
            {recommendations.map((text, index) => {
              const on = hasMark("todo", keyOf(text));
              const split = text.indexOf(":");
              const hasTitle = split > 0 && split < 22;
              return (
                <li key={text} className="ant-rise" style={{ "--i": index } as CSSProperties}>
                  <button
                    type="button"
                    onClick={() => onToggleMark("todo", keyOf(text))}
                    aria-pressed={on}
                    className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] ${on ? "border-emerald-500 bg-emerald-50" : "border-black/10 bg-white"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`} aria-hidden="true">
                      {on ? <Check className="ant-pop h-5 w-5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 text-base leading-5 text-ink">
                      {hasTitle ? (
                        <>
                          <span className="font-bold">{text.slice(0, split)}.</span> {text.slice(split + 1).trim()}
                        </>
                      ) : (
                        text
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="ant-rise ab-card rounded-[1.75rem] p-4">
          <h3 className="text-lg font-bold text-ink">Qué cambió en mi plan</h3>
          <ul className="mt-2 space-y-2">
            {changes.map((change, index) => (
              <ChangeRow key={change.title} title={change.title} detail={change.detail} index={index} />
            ))}
          </ul>
        </section>
      </div>

      <p className="text-xs leading-5 text-muted">{ADJUSTMENT_DISCLAIMER}</p>
    </div>
  );
}
