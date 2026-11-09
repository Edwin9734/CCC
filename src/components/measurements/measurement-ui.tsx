"use client";

import type { CSSProperties } from "react";
import { HDL_MINIMUM_GENERAL, getLipidStatus, getStatusLabel, hdlMinimumFor, type LipidMetric } from "@/lib/ranges";
import type { Sex } from "@/lib/profile";
import type { MeasurementRow, MeasurementWithStatus } from "@/lib/supabase/measurements";

export interface MeasurementApi {
  create: (input: { metric: LipidMetric; value: number; measured_at: string }) => Promise<MeasurementRow>;
  update: (id: string, input: { value: number; measured_at: string }) => Promise<MeasurementWithStatus>;
  remove: (id: string) => Promise<void>;
  logCritical: (input: { title: string; body: string; relatedId: string }) => Promise<void>;
}

export const METRIC_ORDER: LipidMetric[] = ["LDL", "TRIGLYCERIDES", "HDL"];

export const METRIC_META: Record<LipidMetric, { short: string; hint: string; max: number; color: string }> = {
  LDL: { short: "LDL", hint: "El malo", max: 240, color: "#e11d48" },
  TRIGLYCERIDES: { short: "Triglicéridos", hint: "Las grasas", max: 600, color: "#d97706" },
  HDL: { short: "HDL", hint: "El bueno", max: 100, color: "#059669" }
};

export const STATUS_COLOR: Record<string, string> = {
  LOW: "#f97316",
  NORMAL: "#22c55e",
  PROTECTIVE: "#15803d",
  BORDERLINE: "#facc15",
  HIGH: "#f97316",
  VERY_HIGH: "#ef4444",
  CRITICAL: "#991b1b"
};

export const STATUS_BADGE: Record<string, string> = {
  LOW: "bg-orange-100 text-orange-950",
  NORMAL: "bg-emerald-100 text-emerald-900",
  PROTECTIVE: "bg-emerald-200 text-emerald-950",
  BORDERLINE: "bg-amber-100 text-amber-950",
  HIGH: "bg-orange-100 text-orange-950",
  VERY_HIGH: "bg-red-100 text-red-900",
  CRITICAL: "bg-red-700 text-white"
};

export function metricGoal(metric: LipidMetric, sex: Sex | null) {
  if (metric === "LDL") return 100;
  if (metric === "TRIGLYCERIDES") return 150;
  return sex ? hdlMinimumFor(sex) : HDL_MINIMUM_GENERAL;
}

export function isInRange(status: string) {
  return status === "NORMAL" || status === "PROTECTIVE";
}

// Una baja es buena en LDL y triglicéridos; en HDL lo bueno es que suba.
export function isImprovement(metric: LipidMetric, delta: number) {
  return metric === "HDL" ? delta > 0 : delta < 0;
}

export function formatValue(value: number) {
  return Math.round(value * 100) / 100;
}

export function sortRecent(list: MeasurementWithStatus[]) {
  return [...list].sort((a, b) => b.measured_at.localeCompare(a.measured_at) || b.created_at.localeCompare(a.created_at));
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

function zones(metric: LipidMetric, sex: Sex | null) {
  const max = METRIC_META[metric].max;
  const bands: { from: number; to: number; status: string }[] = [];
  let start = 0;
  let current: string = getLipidStatus(metric, 0, sex);
  for (let value = 1; value <= max; value += 1) {
    const status = getLipidStatus(metric, value, sex);
    if (status !== current) {
      bands.push({ from: start, to: value, status: current });
      start = value;
      current = status;
    }
  }
  bands.push({ from: start, to: max, status: current });
  return bands;
}

// Barra de colores con la misma regla que clasifica las mediciones.
export function ZoneRuler({ metric, value, sex }: { metric: LipidMetric; value: number | null; sex: Sex | null }) {
  const max = METRIC_META[metric].max;
  const position = value === null ? null : Math.min(100, (value / max) * 100);

  return (
    <div className="relative pt-5">
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-sm">
        {zones(metric, sex).map((band) => (
          <div key={band.from} style={{ width: `${((band.to - band.from) / max) * 100}%`, backgroundColor: STATUS_COLOR[band.status] }} title={getStatusLabel(band.status)} />
        ))}
      </div>
      {position !== null ? (
        <span
          className="absolute top-0 h-0 w-0 -translate-x-1/2 border-x-[9px] border-t-[14px] border-x-transparent border-t-ink transition-[left] duration-300 ease-out motion-reduce:transition-none"
          style={{ left: `${position}%` } as CSSProperties}
          aria-hidden="true"
        />
      ) : null}
      <div className="mt-0.5 flex justify-between text-xs font-semibold tabular-nums text-muted">
        <span>0</span>
        <span>{max}+</span>
      </div>
    </div>
  );
}

export function TubeArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <g transform="rotate(18 60 60)">
        <rect x="42" y="12" width="36" height="10" rx="5" fill="#fff" />
        <path d="M47 20h26v72a13 13 0 0 1-26 0Z" fill="#fff" fillOpacity="0.9" />
        <path className="pln-updown" d="M50 54c6-4 14 4 20 0v38a10 10 0 0 1-20 0Z" fill="#e11d48" />
        <circle className="ant-float" cx="57" cy="78" r="4" fill="#fda4af" />
        <circle className="ant-float" style={{ "--delay": "-1.4s" } as CSSProperties} cx="65" cy="68" r="3" fill="#fda4af" />
      </g>
      <circle className="pln-glow" cx="97" cy="28" r="7" fill="#fde68a" />
      <circle className="pln-glow" style={{ animationDelay: "-1s" }} cx="22" cy="86" r="5" fill="#a7f3d0" />
    </svg>
  );
}
