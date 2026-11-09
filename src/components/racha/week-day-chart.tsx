"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Equal } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SLEEP_GOAL_HOURS, WATER_GOAL_GLASSES } from "@/lib/habits-config";
import type { StatsDay, StatsMetric } from "@/lib/racha";

export interface WeekChartConfig {
  key: StatsMetric;
  title: string;
  unit: string;
  unitOne: string;
  color: string;
  empty: string;
  goal?: number;
}

export const WEEK_CHARTS: WeekChartConfig[] = [
  { key: "meals", title: "Comidas", unit: "comidas registradas", unitOne: "comida registrada", color: "#f97316", empty: "Aún no hay comidas registradas." },
  { key: "water", title: "Agua", unit: "vasos", unitOne: "vaso", color: "#0ea5e9", empty: "Aún no hay vasos de agua registrados.", goal: WATER_GOAL_GLASSES },
  { key: "sleep", title: "Sueño", unit: "horas", unitOne: "hora", color: "#6366f1", empty: "Aún no hay horas de sueño registradas.", goal: SLEEP_GOAL_HOURS },
  { key: "activity", title: "Actividad física", unit: "minutos", unitOne: "minuto", color: "#14b8a6", empty: "Aún no hay actividad registrada." },
  { key: "measurements", title: "Mediciones", unit: "registros", unitOne: "registro", color: "#e11d48", empty: "Aún no hay mediciones registradas." }
];

const INK = "#172033";
const MUTED = "#5f687c";
const GRID = "#e2e8f0";
const AXIS = "#94a3b8";
const PREVIOUS = "#475569";
const STEPS = [1, 2, 5, 10, 15, 20, 30, 50, 100, 200, 500, 1000];

interface ChartRow {
  label: string;
  isToday: boolean;
  current: number | null;
  previous: number;
}

function fmt(value: number) {
  return value.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}

function withUnit(value: number, chart: WeekChartConfig) {
  return `${fmt(value)} ${value === 1 ? chart.unitOne : chart.unit}`;
}

// Escala con números redondos y varias líneas horizontales.
function niceScale(values: number[]) {
  const max = Math.max(...values, 0);
  const step = STEPS.find((candidate) => Math.ceil(max / candidate) <= 5) ?? Math.ceil(max / 5);
  const count = Math.max(Math.ceil(max / step), 3);
  return { top: step * count, ticks: Array.from({ length: count + 1 }, (_, index) => index * step) };
}

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

// Las animaciones arrancan cuando la gráfica llega a la pantalla, no al abrir la pestaña.
function useFirstVisible<T extends Element>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function DayTick({ x, y, label, isToday }: { x: number; y: number; label: string; isToday: boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {isToday ? <rect x={-18} y={3} width={36} height={24} rx={12} fill={INK} /> : null}
      <text textAnchor="middle" y={20} fontSize={13} fontWeight={isToday ? 700 : 500} fill={isToday ? "#ffffff" : MUTED}>
        {label}
      </text>
    </g>
  );
}

function DayTooltip({ row, chart }: { row?: ChartRow; chart: WeekChartConfig }) {
  if (!row) return null;
  return (
    <div className="w-max max-w-[13rem] rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm leading-5 text-ink shadow-soft">
      <p className="font-bold">{row.isToday ? `${row.label} (hoy)` : row.label}</p>
      <p>Esta semana: {row.current === null ? "aún no llega" : withUnit(row.current, chart)}</p>
      <p>Semana pasada: {withUnit(row.previous, chart)}</p>
    </div>
  );
}

function Comparison({ total, previous, chart }: { total: number; previous: number; chart: WeekChartConfig }) {
  if (total === 0 && previous === 0) return null;
  const Icon = total > previous ? ArrowUpRight : total < previous ? ArrowDownRight : Equal;
  return (
    <p className="mt-3 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-sm leading-5 text-ink">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        Hasta hoy llevas <strong>{withUnit(total, chart)}</strong>. La semana pasada, a esta altura, llevabas {withUnit(previous, chart)}.
      </span>
    </p>
  );
}

export function WeekDayChart({ days, chart, showGoal = true }: { days: StatsDay[]; chart: WeekChartConfig; showGoal?: boolean }) {
  const { ref, visible } = useFirstVisible<HTMLElement>();
  const reduced = useReducedMotion();
  const gradientId = `week-${useId().replace(/\W/g, "")}`;

  const rows: ChartRow[] = days.map((day) => ({
    label: day.label,
    isToday: day.isToday,
    current: day.current ? day.current[chart.key] : null,
    previous: day.previous[chart.key]
  }));
  const elapsed = rows.filter((row) => row.current !== null);
  const values = (row: ChartRow) => row.current ?? 0;
  const total = elapsed.reduce((sum, row) => sum + values(row), 0);
  const previousSoFar = elapsed.reduce((sum, row) => sum + row.previous, 0);
  const best = elapsed.reduce((winner, row) => (values(row) > values(winner) ? row : winner), elapsed[0]);
  const today = rows.find((row) => row.isToday);
  const hasData = rows.some((row) => values(row) > 0 || row.previous > 0);
  const goal = showGoal ? chart.goal : undefined;
  const scale = niceScale([...rows.flatMap((row) => [values(row), row.previous]), goal ?? 0]);

  const summary = rows
    .map((row) => `${row.label}: ${row.current === null ? "aún no llega" : fmt(row.current)}, semana pasada ${fmt(row.previous)}`)
    .join("; ");
  const stats = [
    { label: "Hoy", value: fmt(today?.current ?? 0) },
    { label: "Promedio", value: fmt(elapsed.length > 0 ? total / elapsed.length : 0) },
    { label: "Mejor día", value: best && values(best) > 0 ? `${best.label} · ${fmt(values(best))}` : "—" }
  ];

  return (
    <figure ref={ref} className="rounded-3xl border border-black/5 bg-white p-4 md:last:col-span-2">
      <figcaption className="text-base font-semibold text-ink">
        {chart.title} <span className="text-sm font-normal text-muted">({chart.unit})</span>
      </figcaption>

      <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
        {stats.map((stat, index) => (
          <li
            key={stat.label}
            className={`rounded-2xl bg-slate-50 px-2 py-2 text-center ${visible ? "racha-stat-in" : "opacity-0"}`}
            style={{ "--i": index } as CSSProperties}
          >
            <p className="text-lg font-bold leading-6 text-ink">{stat.value}</p>
            <p className="text-sm leading-4 text-muted">{stat.label}</p>
          </li>
        ))}
      </ul>

      <div role="img" aria-label={`${chart.title}, ${chart.unit}. ${summary}.`} className="relative mt-3 h-[17rem] min-w-0">
        {visible ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.color} />
                  <stop offset="100%" stopColor={chart.color} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeWidth={1} />
              <XAxis
                dataKey="label"
                interval={0}
                height={34}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                tick={(props) => {
                  const row = rows.find((item) => item.label === props.payload.value);
                  return <DayTick x={Number(props.x)} y={Number(props.y)} label={String(props.payload.value)} isToday={Boolean(row?.isToday)} />;
                }}
              />
              <YAxis
                width={36}
                domain={[0, scale.top]}
                ticks={scale.ticks}
                allowDecimals={false}
                axisLine={{ stroke: AXIS }}
                tickLine={false}
                tick={{ fill: MUTED, fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(15, 23, 42, 0.05)" }}
                content={(props) => <DayTooltip row={props.payload?.[0]?.payload as ChartRow | undefined} chart={chart} />}
              />
              {goal ? <ReferenceLine y={goal} stroke={INK} strokeWidth={1.5} strokeDasharray="6 4" /> : null}
              <Bar
                dataKey="current"
                name="Esta semana"
                fill={`url(#${gradientId})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={!reduced}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                <LabelList
                  dataKey="current"
                  content={(props) => {
                    const row = rows[Number(props.index)];
                    if (!row?.isToday || !row.current) return null;
                    return (
                      <text x={Number(props.x) + Number(props.width) / 2} y={Number(props.y) - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill={INK}>
                        {fmt(row.current)}
                      </text>
                    );
                  }}
                />
              </Bar>
              <Line
                dataKey="previous"
                name="Semana pasada"
                type="linear"
                stroke={PREVIOUS}
                strokeWidth={2}
                dot={{ r: 4, fill: PREVIOUS, stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: PREVIOUS, stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={!reduced}
                animationBegin={500}
                animationDuration={1100}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : null}
        {!hasData ? (
          <p className="pointer-events-none absolute inset-x-6 top-1/3 rounded-2xl bg-white/95 px-3 py-2 text-center text-sm font-semibold leading-5 text-muted shadow-soft">
            {chart.empty}
          </p>
        ) : null}
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-5 text-ink">
        <li className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-sm" style={{ background: chart.color }} aria-hidden="true" />
          Esta semana
        </li>
        <li className="flex items-center gap-1.5">
          <span className="relative h-3.5 w-6" aria-hidden="true">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" style={{ background: PREVIOUS }} />
            <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" style={{ background: PREVIOUS }} />
          </span>
          Semana pasada
        </li>
        {goal ? (
          <li className="flex items-center gap-1.5">
            <span className="w-6 border-t-2 border-dashed border-ink" aria-hidden="true" />
            Meta: {withUnit(goal, chart)}
          </li>
        ) : null}
      </ul>

      <Comparison total={total} previous={previousSoFar} chart={chart} />

      <details className="group mt-2">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-full text-sm font-semibold text-ink transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
          Ver los números
        </summary>
        <table className="racha-table-in mt-1 w-full border-collapse text-sm text-ink">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="px-2 py-1.5 text-left font-semibold">Día</th>
              <th scope="col" className="px-2 py-1.5 text-right font-semibold">Esta semana</th>
              <th scope="col" className="px-2 py-1.5 text-right font-semibold">Semana pasada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={`border-t border-black/5 ${row.isToday ? "bg-slate-50 font-bold" : ""}`}>
                <th scope="row" className="px-2 py-1.5 text-left font-[inherit]">{row.isToday ? `${row.label} (hoy)` : row.label}</th>
                <td className="px-2 py-1.5 text-right tabular-nums">{row.current === null ? "—" : fmt(row.current)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{fmt(row.previous)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
