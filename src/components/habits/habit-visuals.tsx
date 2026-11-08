import type { CSSProperties, ReactNode } from "react";

// Anillo de progreso: se llena al abrir la pestaña y se mueve suave cuando cambia el valor.
export function ProgressRing({
  value,
  size = "7rem",
  color = "#e11d48",
  label,
  children
}: {
  value: number; // de 0 a 1
  size?: string;
  color?: string;
  label: string;
  children?: ReactNode;
}) {
  const stroke = 11;
  const radius = (100 - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div role="img" aria-label={label} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth={stroke} />
        <circle
          className="hab-ring"
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={
            {
              strokeDashoffset: circumference * (1 - clamped),
              "--ring-start": circumference
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

const CONFETTI_COLORS = ["#f43f5e", "#f59e0b", "#22c55e", "#0ea5e9", "#8b5cf6"];

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 22 }, (_, index) => {
        const angle = (index / 22) * Math.PI * 2;
        const distance = 90 + (index % 4) * 34;
        return (
          <span
            key={index}
            className="hab-confetti"
            style={
              {
                "--c": CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                "--x": `${Math.round(Math.cos(angle) * distance)}px`,
                "--y": `${Math.round(Math.sin(angle) * distance)}px`,
                "--r": `${(index % 5) * 120 - 240}deg`,
                "--delay": `${(index % 3) * 40}ms`
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

export function MiniBars({
  title,
  unit,
  days,
  max,
  color,
  selectedDate
}: {
  title: string;
  unit: string;
  days: { date: string; letter: string; dayName: string; value: number | null }[];
  max: number;
  color: string;
  selectedDate: string;
}) {
  const summary = days.map((day) => `${day.dayName}: ${day.value ?? "sin registro"}`).join(", ");

  return (
    <figure className="rounded-3xl border border-black/5 bg-white p-4">
      <figcaption className="text-sm font-semibold text-ink">
        {title} <span className="font-normal text-muted">({unit})</span>
      </figcaption>
      <div role="img" aria-label={`${title}, ${unit}. ${summary}.`} className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const value = day.value ?? 0;
          return (
            <div key={day.date} className="flex flex-col items-center" aria-hidden="true">
              <span className="h-5 text-xs font-semibold leading-5 text-ink">{value > 0 ? value : ""}</span>
              <div className="flex h-20 w-full items-end justify-center">
                <div
                  className="hab-bar w-full max-w-[1.75rem] rounded-t-lg"
                  style={
                    {
                      height: `${value > 0 ? Math.max(6, Math.min(100, (value / max) * 100)) : 0}%`,
                      backgroundColor: color,
                      "--i": index
                    } as CSSProperties
                  }
                />
              </div>
              <span
                className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  day.date === selectedDate ? "bg-accent text-white" : "text-muted"
                }`}
              >
                {day.letter}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
