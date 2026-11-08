"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Calculator, Droplets, Minus, Moon, Plus } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { MiniBars } from "@/components/habits/habit-visuals";
import {
  SLEEP_GOAL_HOURS,
  WATER_GOAL_GLASSES,
  WATER_MAX_GLASSES,
  WATER_RANGE_TEXT,
  formatHours
} from "@/lib/habits-config";
import { sleepHoursBetween, type HabitDay } from "@/lib/habits-insights";
import type { DailyHabitValues } from "@/lib/supabase/habits";

const QUICK_SLEEP_HOURS = [5, 6, 7, 8, 9];

const GLASS_PATH = "M18 8L102 8L92 140C92 144 89 146 85 146L35 146C31 146 28 144 28 140Z";
const GLASS_TOP = 22;
const GLASS_BOTTOM = 146;
const GLASS_WAVE = "M-100 0Q-75 -7 -50 0T0 0T50 0T100 0T150 0T200 0V150H-100Z";

const DROPS = [
  { x: 42, dx: "-26px", delay: "0s" },
  { x: 58, dx: "-8px", delay: "0.06s" },
  { x: 66, dx: "12px", delay: "0.03s" },
  { x: 80, dx: "30px", delay: "0.1s" }
];

function WaterGlass({ glasses, showGoalMarks, splash }: { glasses: number; showGoalMarks: boolean; splash: number }) {
  const level = Math.min(1, glasses / WATER_GOAL_GLASSES);
  const waterY = GLASS_BOTTOM - level * (GLASS_BOTTOM - GLASS_TOP);
  const step = (GLASS_BOTTOM - GLASS_TOP) / WATER_GOAL_GLASSES;

  return (
    <svg viewBox="0 0 120 152" className="h-44 w-auto shrink-0" aria-hidden="true">
      <defs>
        <clipPath id="hab-glass-clip">
          <path d={GLASS_PATH} />
        </clipPath>
      </defs>
      <path d={GLASS_PATH} fill="#f0f9ff" />
      <g clipPath="url(#hab-glass-clip)">
        {glasses > 0 ? (
          <g className="hab-water-level" style={{ "--water-y": `${waterY}px` } as CSSProperties}>
            <path className="hab-wave-back" d={GLASS_WAVE} fill="#7dd3fc" transform="translate(0 -4)" />
            <path className="hab-wave" d={GLASS_WAVE} fill="#38bdf8" />
          </g>
        ) : null}
      </g>
      {showGoalMarks
        ? Array.from({ length: WATER_GOAL_GLASSES - 1 }, (_, index) => {
            const y = GLASS_BOTTOM - step * (index + 1);
            return <line key={y} x1="74" x2="90" y1={y} y2={y} stroke="#0284c7" strokeWidth="2" opacity="0.45" />;
          })
        : null}
      <path d={GLASS_PATH} fill="none" stroke="#0284c7" strokeWidth="4" strokeLinejoin="round" />
      {splash > 0 ? (
        <g key={splash}>
          {DROPS.map((drop) => (
            <path
              key={drop.x}
              className="hab-drop"
              d={`M${drop.x} 0C${drop.x + 5} 8 ${drop.x + 5} 13 ${drop.x} 13C${drop.x - 5} 13 ${drop.x - 5} 8 ${drop.x} 0Z`}
              fill="#0ea5e9"
              style={{ "--dx": drop.dx, "--delay": drop.delay } as CSSProperties}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

const STARS = [
  [24, 22], [50, 44], [78, 18], [104, 40], [128, 16], [150, 58], [30, 74], [62, 92], [100, 82], [176, 26]
];

function SleepSky({ hours }: { hours: number | null }) {
  const stars = hours === null ? 0 : Math.min(STARS.length, Math.round(hours));
  const metGoal = hours !== null && hours >= SLEEP_GOAL_HOURS;

  return (
    <svg viewBox="0 0 200 110" className="w-full max-w-sm rounded-3xl" aria-hidden="true">
      <rect width="200" height="110" fill={hours === null ? "#475569" : "#1e1b4b"} />
      {STARS.slice(0, stars).map(([cx, cy], index) => (
        <path
          key={`${cx}-${cy}`}
          className="hab-star"
          style={{ "--i": index } as CSSProperties}
          d={`M${cx} ${cy - 6}L${cx + 2} ${cy - 2}L${cx + 6} ${cy}L${cx + 2} ${cy + 2}L${cx} ${cy + 6}L${cx - 2} ${cy + 2}L${cx - 6} ${cy}L${cx - 2} ${cy - 2}Z`}
          fill="#fde68a"
        />
      ))}
      <path
        className="hab-moon"
        d="M152 44A26 26 0 1 0 178 78A21 21 0 0 1 152 44Z"
        fill={hours === null ? "#cbd5e1" : "#fcd34d"}
      />
      {metGoal
        ? ["0s", "1s", "2s"].map((delay, index) => (
            <text
              key={delay}
              className="hab-zzz"
              style={{ "--delay": delay } as CSSProperties}
              x={118 + index * 2}
              y={62 - index * 4}
              fontSize={12 + index * 3}
              fontWeight="700"
              fill="#c7d2fe"
            >
              z
            </text>
          ))
        : null}
    </svg>
  );
}

export function WaterSleepCard({
  date,
  current,
  waterNotice,
  days,
  onChangeWater,
  onSaveSleep
}: {
  date: string;
  current: DailyHabitValues;
  waterNotice?: string | null;
  days: HabitDay[];
  onChangeWater: (delta: number) => void;
  onSaveSleep: (hours: number | null) => void;
}) {
  const [sleepInput, setSleepInput] = useState("");
  const [sleepError, setSleepError] = useState<string | null>(null);
  const [splash, setSplash] = useState(0);
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");

  // Mantiene el campo de sueño igual al valor guardado de la fecha elegida.
  useEffect(() => {
    setSleepInput(current.sleep_hours === null ? "" : String(current.sleep_hours));
    setSleepError(null);
  }, [date, current.sleep_hours]);

  const calculatedHours = bedTime && wakeTime ? sleepHoursBetween(bedTime, wakeTime) : null;

  const handleSaveSleep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSleepError(null);

    const text = sleepInput.trim().replace(",", ".");

    // Campo vacío = quitar el dato de sueño de ese día.
    if (text === "") {
      if (current.sleep_hours !== null) onSaveSleep(null);
      return;
    }

    const hours = Number(text);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      setSleepError("Escribe un número de horas entre 0 y 24.");
      return;
    }

    const rounded = Math.round(hours * 10) / 10;
    onSaveSleep(rounded);
    setSleepInput(String(rounded));
  };

  const addGlass = () => {
    setSplash((value) => value + 1);
    onChangeWater(1);
  };

  const waterMax = Math.max(WATER_GOAL_GLASSES, ...days.map((day) => day.water));
  const sleepMax = Math.max(10, ...days.map((day) => day.sleep ?? 0));

  return (
    <SectionCard title="Agua y sueño" description="Cuenta los vasos de agua que tomas y anota cuántas horas dormiste.">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Droplets className="h-4 w-4 text-sky-600" />
            Vasos de agua
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-5 sm:justify-start">
            <WaterGlass glasses={current.water_glasses} showGoalMarks={!waterNotice} splash={splash} />

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => onChangeWater(-1)}
                disabled={current.water_glasses <= 0}
                aria-label="Quitar un vaso"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-soft transition hover:bg-slate-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Minus className="h-6 w-6" />
              </button>

              <div className="min-w-[5rem] text-center">
                <p key={current.water_glasses} className="hab-pop text-4xl font-semibold text-ink">
                  {current.water_glasses}
                </p>
                <p className="text-sm text-muted">{current.water_glasses === 1 ? "vaso" : "vasos"}</p>
              </div>

              <button
                type="button"
                onClick={addGlass}
                disabled={current.water_glasses >= WATER_MAX_GLASSES}
                aria-label="Agregar un vaso"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-soft transition hover:bg-slate-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>

          {waterNotice ? (
            <>
              <p className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                Sin meta: consulta a tu médico
              </p>

              <p className="mt-3 text-xs leading-5 text-amber-900">{waterNotice}</p>
            </>
          ) : (
            <>
              <p
                className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  current.water_glasses >= WATER_GOAL_GLASSES
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-muted"
                }`}
              >
                {current.water_glasses >= WATER_GOAL_GLASSES ? "Meta cumplida" : `Meta: ${WATER_RANGE_TEXT} al día`}
              </p>

              <p className="mt-3 text-xs leading-5 text-muted">
                Si tu médico te limitó los líquidos (por ejemplo, por problemas del corazón o de los riñones), sigue su
                indicación y no uses esta meta.
              </p>
            </>
          )}
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Moon className="h-4 w-4 text-indigo-600" />
            Horas de sueño
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">Horas que dormiste la noche anterior a este día.</p>

          <div className="mt-3">
            <SleepSky key={current.sleep_hours ?? "sin-dato"} hours={current.sleep_hours} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Guardar horas con un toque">
            {QUICK_SLEEP_HOURS.map((hours) => {
              const selected = current.sleep_hours === hours;
              return (
                <button
                  key={hours}
                  type="button"
                  onClick={() => onSaveSleep(hours)}
                  aria-pressed={selected}
                  className={`min-h-12 min-w-[3.5rem] flex-1 rounded-full border px-3 py-2 text-base font-semibold transition active:scale-95 ${
                    selected ? "border-indigo-700 bg-indigo-700 text-white" : "border-black/10 bg-white text-ink hover:bg-slate-50"
                  }`}
                >
                  {hours} h
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveSleep} className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="number"
              inputMode="decimal"
              value={sleepInput}
              onChange={(e) => setSleepInput(e.target.value)}
              min="0"
              max="24"
              step="any"
              placeholder="Ej. 7.5"
              aria-label="Horas de sueño"
              className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
            />
            <button
              type="submit"
              className="rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              Guardar sueño
            </button>
          </form>

          {sleepError ? (
            <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{sleepError}</p>
          ) : null}

          <p className="mt-3 text-sm text-muted">
            {current.sleep_hours === null
              ? "Sin registrar."
              : `Guardado: ${formatHours(current.sleep_hours)} h · ${
                  current.sleep_hours >= SLEEP_GOAL_HOURS ? "Meta cumplida" : `Meta: ${SLEEP_GOAL_HOURS} horas o más`
                }`}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">Para borrar el dato, deja el campo vacío y guarda.</p>

          <details className="mt-4 rounded-3xl border border-black/5 bg-white p-4">
            <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-base font-semibold text-ink">
              <Calculator className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              Calcular mi sueño
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Me acosté</span>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-background px-3 py-4 text-base outline-none"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Me levanté</span>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-background px-3 py-4 text-base outline-none"
                />
              </label>
            </div>
            {calculatedHours !== null ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-semibold text-ink">Dormiste {formatHours(calculatedHours)} h</p>
                <button
                  type="button"
                  onClick={() => onSaveSleep(calculatedHours)}
                  className="rounded-full bg-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 active:scale-95"
                >
                  Guardar estas horas
                </button>
              </div>
            ) : bedTime && wakeTime ? (
              <p className="mt-3 text-sm font-semibold text-danger">Las dos horas no pueden ser iguales.</p>
            ) : null}
          </details>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <MiniBars
          title="Agua, últimos 7 días"
          unit="vasos"
          days={days.map((day) => ({ ...day, value: day.water }))}
          max={waterMax}
          color="#0ea5e9"
          selectedDate={date}
        />
        <MiniBars
          title="Sueño, últimos 7 días"
          unit="horas"
          days={days.map((day) => ({ ...day, value: day.sleep }))}
          max={sleepMax}
          color="#6366f1"
          selectedDate={date}
        />
      </div>
    </SectionCard>
  );
}
