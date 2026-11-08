import type { CSSProperties } from "react";

export interface GaugeBand {
  from: number; // de 0 a 1
  to: number; // de 0 a 1
  color: string;
  label: string;
}

const CENTER_X = 100;
const CENTER_Y = 100;
const RADIUS = 78;

function pointAt(fraction: number) {
  const angle = Math.PI * (1 - fraction);
  return {
    x: (CENTER_X + RADIUS * Math.cos(angle)).toFixed(2),
    y: (CENTER_Y - RADIUS * Math.sin(angle)).toFixed(2)
  };
}

function arcPath(from: number, to: number) {
  const start = pointAt(from);
  const end = pointAt(to);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`;
}

// Velocímetro animado: la aguja sale del mínimo y llega al valor cada vez que se abre la pestaña.
export function Gauge({
  title,
  value,
  max,
  valueText,
  helper,
  minLabel = "0",
  maxLabel,
  bands,
  statusOverride
}: {
  title: string;
  value: number;
  max: number;
  valueText: string;
  helper: string;
  minLabel?: string;
  maxLabel: string;
  bands: GaugeBand[];
  statusOverride?: string;
}) {
  const fraction = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const band = bands.find((item) => fraction >= item.from && fraction <= item.to) ?? bands[bands.length - 1];
  const status = statusOverride ?? band.label;

  return (
    <figure className="rounded-3xl border border-black/5 bg-white p-4 text-center">
      <figcaption className="text-base font-semibold text-ink">{title}</figcaption>
      <svg
        viewBox="0 0 200 128"
        role="img"
        aria-label={`${title}: ${valueText}. ${status}.`}
        className="mx-auto mt-2 w-full max-w-[17rem]"
      >
        <g className="racha-gauge-arc">
          {bands.map((item) => (
            <path key={item.from} d={arcPath(item.from, item.to)} fill="none" stroke={item.color} strokeWidth="20" />
          ))}
        </g>
        <g className="racha-needle" style={{ "--gauge-to": `${(-90 + 180 * fraction).toFixed(2)}deg` } as CSSProperties}>
          <path d="M96 100L100 34L104 100Z" fill="#172033" />
        </g>
        <circle cx={CENTER_X} cy={CENTER_Y} r="10" fill="#172033" />
        <circle cx={CENTER_X} cy={CENTER_Y} r="4" fill="#fff" />
        <text x="22" y="124" textAnchor="middle" fontSize="12" fill="#5f687c">
          {minLabel}
        </text>
        <text x="178" y="124" textAnchor="middle" fontSize="12" fill="#5f687c">
          {maxLabel}
        </text>
      </svg>
      <p className="text-3xl font-semibold text-ink">{valueText}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{status}</p>
      <p className="mt-1 text-sm leading-5 text-muted">{helper}</p>
    </figure>
  );
}
