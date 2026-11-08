"use client";

import { useRef, type CSSProperties } from "react";
import { CalendarDays } from "lucide-react";
import { addDays, formatDate, isoWeekday } from "@/lib/date-utils";
import { WEEKDAY_LETTERS, WEEKDAY_NAMES, type HabitDay } from "@/lib/habits-insights";

function hasRecords(day: HabitDay | undefined) {
  if (!day) return false;
  return (
    day.water > 0 ||
    day.sleep !== null ||
    day.activityMinutes > 0 ||
    day.doseState === "all" ||
    day.doseState === "partial"
  );
}

// Barra compacta para elegir el día: los últimos 7 días a la vista y un calendario para fechas anteriores.
export function DayPickerBar({
  date,
  today,
  days,
  onChange
}: {
  date: string;
  today: string;
  days: HabitDay[];
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  };

  const week = today ? Array.from({ length: 7 }, (_, index) => addDays(today, index - 6)) : [];
  const longDate = date ? formatDate(date, { weekday: "long", day: "numeric", month: "long" }) : "";

  return (
    <section aria-label="Día que estás registrando" className="ab-card rounded-3xl p-3">
      <div className="flex min-h-9 items-center justify-between gap-2 px-1">
        <p className="min-w-0 text-base font-semibold leading-6 text-ink">
          {date === today ? <span className="text-accent">Hoy</span> : null}
          {date === today && longDate ? <span className="font-normal text-muted"> · </span> : null}
          <span className={date === today ? "font-normal text-muted" : ""}>
            {longDate.charAt(0).toUpperCase() + longDate.slice(1)}
          </span>
        </p>

        {today && date !== today ? (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="shrink-0 rounded-full bg-accentSoft px-3 py-1.5 text-sm font-semibold text-accent transition active:scale-95"
          >
            Ir a hoy
          </button>
        ) : null}

        {today ? (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={openCalendar}
              aria-label="Elegir otra fecha"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-accent transition hover:bg-slate-50 active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/20"
            >
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </button>
            <input
              ref={inputRef}
              type="date"
              value={date}
              max={today}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const value = e.target.value;
                if (value && value <= today) onChange(value);
              }}
              className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-2 grid min-h-[3.75rem] grid-cols-7 gap-1">
        {week.map((day, index) => {
          const weekday = isoWeekday(day) - 1;
          const selected = day === date;
          const recorded = hasRecords(days.find((item) => item.date === day));

          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(day)}
              aria-pressed={selected}
              aria-label={`${WEEKDAY_NAMES[weekday]} ${Number(day.slice(8))}${day === today ? ", hoy" : ""}${
                recorded ? ", con registros" : ""
              }`}
              className={`hab-pop relative flex flex-col items-center justify-center rounded-2xl py-1.5 transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/20 ${
                selected
                  ? "bg-accent text-white shadow-soft"
                  : day === today
                    ? "bg-accentSoft text-accent"
                    : "text-ink hover:bg-slate-50"
              }`}
              style={{ "--i": index } as CSSProperties}
            >
              <span className={`text-xs font-semibold leading-4 ${selected ? "text-white" : "text-muted"}`} aria-hidden="true">
                {WEEKDAY_LETTERS[weekday]}
              </span>
              <span className="text-lg font-semibold leading-6" aria-hidden="true">
                {Number(day.slice(8))}
              </span>
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  recorded ? (selected ? "bg-white" : "bg-emerald-500") : "bg-transparent"
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
