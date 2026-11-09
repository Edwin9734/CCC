"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, ChevronDown, LineChart as LineChartIcon } from "lucide-react";
import { CountUp, Empty, Expand, FilterChips } from "@/components/antecedentes/antecedentes-ui";
import { METRIC_META, METRIC_ORDER, formatValue, isImprovement, metricGoal } from "@/components/measurements/measurement-ui";
import { addDays } from "@/lib/date-utils";
import type { Sex } from "@/lib/profile";
import { getStatusLabel, type LipidMetric } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";

type Range = "90" | "180" | "365" | "all";

function shortDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}/${year.slice(2)}`;
}

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: { date: string; value: number; status: string } }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-soft">
      {point.date}: {point.value} mg/dL · {getStatusLabel(point.status)}
    </div>
  );
}

export function MeasurementEvolution({ measurements, today, sex }: { measurements: MeasurementWithStatus[]; today: string; sex: Sex | null }) {
  const [metric, setMetric] = useState<LipidMetric>("LDL");
  const [range, setRange] = useState<Range>("all");
  const [open, setOpen] = useState(false);

  const points = useMemo(() => {
    const from = range === "all" ? "0000" : addDays(today, -Number(range));
    return measurements
      .filter((row) => row.metric === metric && row.measured_at >= from)
      .sort((a, b) => a.measured_at.localeCompare(b.measured_at) || a.created_at.localeCompare(b.created_at))
      .map((row) => ({ id: row.id, date: shortDate(row.measured_at), value: Number(row.value), status: row.status }));
  }, [measurements, metric, range, today]);

  const goal = metricGoal(metric, sex);
  const values = points.map((point) => point.value);
  const first = points[0];
  const last = points[points.length - 1];
  const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const best = values.length ? (metric === "HDL" ? Math.max(...values) : Math.min(...values)) : 0;
  const change = first && last && points.length > 1 ? formatValue(last.value - first.value) : null;
  const top = Math.ceil(Math.max(goal, ...values) * 1.12);
  const bottom = Math.floor(Math.min(goal, ...values) * 0.82);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lineColor = METRIC_META[metric].color;

  const stats = [
    { label: "Última", value: last ? Math.round(last.value) : 0 },
    { label: "Promedio", value: average },
    { label: "Mejor", value: Math.round(best) }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(6.25rem,1fr))] gap-2" role="group" aria-label="Indicador">
        {METRIC_ORDER.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMetric(item)}
            aria-pressed={item === metric}
            className={`min-h-14 rounded-2xl border-2 p-2 text-base font-bold leading-5 transition active:scale-95 [overflow-wrap:anywhere] ${item === metric ? "border-sky-700 bg-sky-700 text-white shadow-soft" : "border-black/10 bg-white text-ink"}`}
          >
            {METRIC_META[item].short}
          </button>
        ))}
      </div>

      <FilterChips
        tone="sky"
        label="Periodo"
        value={range}
        onChange={setRange}
        options={[
          { value: "90", label: "3 meses" },
          { value: "180", label: "6 meses" },
          { value: "365", label: "1 año" },
          { value: "all", label: "Todo" }
        ]}
      />

      {points.length === 0 ? (
        <Empty tone="sky" icon={<LineChartIcon className="h-10 w-10" />} title="Sin datos en este periodo" text="Prueba con otro periodo o registra una medición." />
      ) : (
        <>
          <dl key={`${metric}-${range}`} className="grid grid-cols-[repeat(auto-fit,minmax(6.25rem,1fr))] gap-2">
            {stats.map((stat, index) => (
              <div key={stat.label} className="ant-pop ab-card rounded-2xl p-3 text-center" style={{ "--i": index } as CSSProperties}>
                <dd className="text-3xl font-bold leading-8 tabular-nums text-ink">
                  <CountUp value={stat.value} />
                </dd>
                <dt className="text-sm font-semibold text-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>

          {change !== null && first && last ? (
            <p key={`${metric}-${change}`} className={`ant-rise flex flex-wrap items-center justify-center gap-2 rounded-2xl p-3 text-base font-bold ${change === 0 ? "bg-slate-100 text-slate-800" : isImprovement(metric, change) ? "bg-emerald-100 text-emerald-950" : "bg-orange-100 text-orange-950"}`}>
              <span className="tabular-nums">{first.value}</span>
              <ArrowRight className="pln-updown h-5 w-5" aria-hidden="true" />
              <span className="tabular-nums">{last.value}</span>
              <span>{change === 0 ? "· Sin cambios" : isImprovement(metric, change) ? "· ¡Vas mejorando!" : "· Conviene revisarlo"}</span>
            </p>
          ) : null}

          <section className="ant-rise ab-card rounded-[1.75rem] p-3">
            <div className="h-64" key={`${metric}-${range}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#f1e4e7" vertical={false} />
                  <ReferenceArea y1={metric === "HDL" ? goal : bottom} y2={metric === "HDL" ? top : goal} fill="#22c55e" fillOpacity={0.1} ifOverflow="hidden" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2d5d9" }} minTickGap={24} />
                  <YAxis domain={[bottom, top]} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<PointTooltip />} />
                  <ReferenceLine y={goal} stroke="#059669" strokeDasharray="6 4" strokeWidth={2} label={{ value: `Meta ${goal}`, position: "insideTopRight", fontSize: 12, fill: "#065f46", fontWeight: 700 }} />
                  <Line type="linear" dataKey="value" stroke={lineColor} strokeWidth={2} dot={{ r: 4, fill: lineColor, stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7 }} isAnimationActive={!reduced} animationDuration={900} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="px-1 text-sm font-semibold text-muted">La franja verde es tu zona saludable.</p>

            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-1 flex min-h-11 items-center gap-1 px-1 text-base font-semibold text-ink">
              Ver los números
              <ChevronDown className="ant-chevron h-5 w-5" aria-hidden="true" />
            </button>
            <Expand open={open}>
              <table className="w-full text-left text-base">
                <thead>
                  <tr className="text-sm text-muted">
                    <th scope="col" className="px-1 py-1 font-semibold">Fecha</th>
                    <th scope="col" className="px-1 py-1 text-right font-semibold">mg/dL</th>
                    <th scope="col" className="px-1 py-1 text-right font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((point) => (
                    <tr key={point.id} className="border-t border-black/5 text-ink">
                      <td className="px-1 py-1">{point.date}</td>
                      <td className="px-1 py-1 text-right font-semibold tabular-nums">{point.value}</td>
                      <td className="px-1 py-1 text-right">{getStatusLabel(point.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Expand>
          </section>
        </>
      )}
    </div>
  );
}
