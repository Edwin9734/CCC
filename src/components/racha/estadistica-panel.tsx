"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { MeasurementChart } from "@/components/charts/measurement-chart";
import { Gauge, type GaugeBand } from "@/components/racha/gauge";
import { SectionCard } from "@/components/section-card";
import { formatDate } from "@/lib/date-utils";
import { METRIC_LABELS, getLipidStatus, getStatusLabel, type LipidMetric, type LipidStatus } from "@/lib/ranges";
import type { RachaView, StatsDay } from "@/lib/racha";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import type { Sex } from "@/lib/profile";

const GREEN = "#22c55e";
const AMBER = "#facc15";
const ORANGE = "#f97316";
const RED = "#ef4444";

const HEALTHY_BANDS: GaugeBand[] = [
  { from: 0, to: 0.34, color: RED, label: "Puedes elegir más alimentos verdes" },
  { from: 0.34, to: 0.67, color: AMBER, label: "Vas por buen camino" },
  { from: 0.67, to: 1, color: GREEN, label: "¡Muy saludable!" }
];

const MODERATION_BANDS: GaugeBand[] = [
  { from: 0, to: 0.4, color: GREEN, label: "En buena medida" },
  { from: 0.4, to: 0.7, color: AMBER, label: "Cuida las porciones" },
  { from: 0.7, to: 1, color: ORANGE, label: "Son demasiados esta semana" }
];

const AVOID_BANDS: GaugeBand[] = [
  { from: 0, to: 0.15, color: GREEN, label: "Riesgo bajo" },
  { from: 0.15, to: 0.35, color: AMBER, label: "Riesgo medio" },
  { from: 0.35, to: 1, color: RED, label: "Riesgo alto" }
];

const LIPID_COLORS: Record<LipidStatus, string> = {
  LOW: ORANGE,
  NORMAL: GREEN,
  PROTECTIVE: "#15803d",
  BORDERLINE: AMBER,
  HIGH: ORANGE,
  VERY_HIGH: RED,
  CRITICAL: "#991b1b",
  UNKNOWN: "#cbd5e1"
};

const LIPID_GAUGES: { metric: LipidMetric; title: string; max: number }[] = [
  { metric: "HDL", title: "HDL (bueno)", max: 100 },
  { metric: "LDL", title: "LDL (malo)", max: 240 },
  { metric: "TRIGLYCERIDES", title: "Triglicéridos", max: 600 }
];

// Los colores salen de la misma regla que clasifica las mediciones, para que nunca se contradigan.
function lipidBands(metric: LipidMetric, max: number, sex: Sex | null): GaugeBand[] {
  const bands: GaugeBand[] = [];
  let start = 0;
  let current = getLipidStatus(metric, 0, sex) as LipidStatus;

  for (let value = 1; value <= max; value += 1) {
    const status = getLipidStatus(metric, value, sex) as LipidStatus;
    if (status === current && value < max) continue;

    const end = value === max ? 1 : value / max;
    bands.push({ from: start, to: end, color: LIPID_COLORS[current], label: getStatusLabel(current) });
    start = end;
    current = status;
  }

  return bands;
}

function foodHelper(count: number, total: number) {
  return total > 0 ? `${count} de ${total} alimentos de esta semana.` : "Registra comidas en tu Diario para verlo.";
}

const BAR_CHARTS: { key: keyof Omit<StatsDay, "date" | "label">; title: string; unit: string; color: string; empty: string }[] = [
  { key: "meals", title: "Comidas", unit: "comidas registradas", color: "#f97316", empty: "Aún no hay comidas esta semana." },
  { key: "water", title: "Agua", unit: "vasos", color: "#0ea5e9", empty: "Aún no hay vasos de agua esta semana." },
  { key: "sleep", title: "Sueño", unit: "horas", color: "#6366f1", empty: "Aún no hay horas de sueño esta semana." },
  { key: "activity", title: "Actividad física", unit: "minutos", color: "#14b8a6", empty: "Aún no hay actividad esta semana." },
  { key: "measurements", title: "Mediciones", unit: "registros", color: "#e11d48", empty: "No hay mediciones esta semana." }
];

function DayBars({ days, chart }: { days: StatsDay[]; chart: (typeof BAR_CHARTS)[number] }) {
  const hasData = days.some((day) => day[chart.key] > 0);
  const summary = days.map((day) => `${day.label}: ${day[chart.key]}`).join(", ");

  return (
    <figure className="rounded-3xl border border-black/5 bg-white p-4">
      <figcaption className="text-base font-semibold text-ink">
        {chart.title} <span className="text-sm font-normal text-muted">({chart.unit})</span>
      </figcaption>
      {hasData ? (
        <div role="img" aria-label={`${chart.title}, ${chart.unit}. ${summary}.`} className="mt-3">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={days} margin={{ top: 28, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="#5f687c" style={{ fontSize: "13px" }} />
              <YAxis hide domain={[0, "auto"]} />
              <Bar dataKey={chart.key} fill={chart.color} radius={[10, 10, 0, 0]} maxBarSize={52} animationDuration={1200}>
                <LabelList
                  dataKey={chart.key}
                  position="top"
                  fill="#172033"
                  style={{ fontSize: "14px", fontWeight: 600 }}
                  formatter={(value) => (Number(value) > 0 ? value : "")}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-muted">{chart.empty}</p>
      )}
    </figure>
  );
}

export function EstadisticaPanel({
  view,
  measurements,
  sex
}: {
  view: RachaView;
  measurements: MeasurementWithStatus[];
  sex: Sex | null;
}) {
  const { green, yellow, red, total } = view.weekFoods;
  const noFoods = total === 0 ? "Sin registros esta semana" : undefined;

  return (
    <div className="space-y-6">
      <SectionCard title="Alimentos de la semana" description="Cuenta cada alimento marcado en tu Diario, de lunes a hoy.">
        <div className="grid gap-4 md:grid-cols-3">
          <Gauge
            title="Saludables"
            value={green}
            max={total}
            valueText={`${green}`}
            maxLabel={`${total}`}
            helper={foodHelper(green, total)}
            bands={HEALTHY_BANDS}
            statusOverride={noFoods}
          />
          <Gauge
            title="Con moderación"
            value={yellow}
            max={total}
            valueText={`${yellow}`}
            maxLabel={`${total}`}
            helper={foodHelper(yellow, total)}
            bands={MODERATION_BANDS}
            statusOverride={noFoods}
          />
          <Gauge
            title="A evitar"
            value={red}
            max={total}
            valueText={`${red}`}
            maxLabel={`${total}`}
            helper={foodHelper(red, total)}
            bands={AVOID_BANDS}
            statusOverride={noFoods}
          />
        </div>
      </SectionCard>

      <SectionCard title="Colesterol y triglicéridos" description="Tu última medición de cada indicador y su evolución.">
        <div className="grid gap-4 md:grid-cols-3">
          {LIPID_GAUGES.map(({ metric, title, max }) => {
            const latest = measurements.find((item) => item.metric === metric);
            return (
              <Gauge
                key={metric}
                title={title}
                value={latest ? Number(latest.value) : 0}
                max={max}
                valueText={latest ? `${latest.value} mg/dL` : "—"}
                maxLabel={`${max}`}
                helper={latest ? `Medido el ${formatDate(latest.measured_at)}.` : `Aún no hay mediciones de ${METRIC_LABELS[metric]}.`}
                bands={lipidBands(metric, max, sex)}
                statusOverride={latest ? getStatusLabel(latest.status) : "Sin datos"}
              />
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <MeasurementChart measurements={measurements} metric="HDL" title="Colesterol HDL (Bueno)" />
          <MeasurementChart measurements={measurements} metric="LDL" title="Colesterol LDL (Malo)" />
          <MeasurementChart measurements={measurements} metric="TRIGLYCERIDES" title="Triglicéridos" />
        </div>
      </SectionCard>

      <SectionCard title="Mi semana día por día" description="Una barra por cada día que ya pasó de esta semana.">
        <div className="grid gap-4 md:grid-cols-2">
          {BAR_CHARTS.map((chart) => (
            <DayBars key={chart.key} days={view.weekDays} chart={chart} />
          ))}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">
          Estas gráficas son orientativas y no reemplazan la indicación de tu médico o nutricionista.
        </p>
      </SectionCard>
    </div>
  );
}
