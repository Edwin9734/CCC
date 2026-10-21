"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Droplets, Minus, Moon, Plus } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { MedicationIntakeCard } from "@/components/habits/medication-intake-card";
import { ActivityCard } from "@/components/habits/activity-card";
import { WeekSummaryCard } from "@/components/habits/week-summary-card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  addActivity,
  clearIntake,
  deleteActivity,
  getHabitsData,
  saveDailyHabit,
  setIntake,
  type ActivityRow,
  type DailyHabitValues,
  type IntakeRow,
  type IntakeStatus
} from "@/lib/supabase/habits";
import type { MedicationWithSchedules } from "@/lib/supabase/medications";
import {
  SLEEP_GOAL_HOURS,
  WATER_GOAL_GLASSES,
  WATER_MAX_GLASSES,
  WATER_RANGE_TEXT,
  buildDoses,
  computeWeekSummary,
  formatHours,
  type Dose
} from "@/lib/habits-config";
import { addDays, formatDate, toDateString } from "@/lib/date-utils";

const EMPTY_HABIT: DailyHabitValues = { water_glasses: 0, sleep_hours: null };

export function HabitsManager({
  medications,
  activityGoalMinutes
}: {
  medications: MedicationWithSchedules[];
  activityGoalMinutes?: number;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [nowMs, setNowMs] = useState(0);
  const [habits, setHabits] = useState<Record<string, DailyHabitValues>>({});
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [loadedDays, setLoadedDays] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sleepInput, setSleepInput] = useState("");
  const [sleepError, setSleepError] = useState<string | null>(null);

  // Cola de guardado: los cambios se envían uno tras otro, en el orden en que se hicieron.
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  // La fecha de hoy y la hora se calculan en el navegador, para usar la hora local de la persona.
  useEffect(() => {
    const current = toDateString(new Date());
    setToday(current);
    setDate(current);
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  // Carga un rango de días y reemplaza lo que había de esos días.
  const loadRange = useCallback(
    async (from: string, to: string) => {
      const data = await getHabitsData(supabase, from, to);

      setHabits((prev) => {
        const next: Record<string, DailyHabitValues> = {};
        for (const [day, values] of Object.entries(prev)) {
          if (day < from || day > to) next[day] = values;
        }
        for (const row of data.habits) {
          next[row.habit_date] = { water_glasses: row.water_glasses, sleep_hours: row.sleep_hours };
        }
        return next;
      });
      setActivities((prev) => [
        ...prev.filter((a) => a.activity_date < from || a.activity_date > to),
        ...data.activities
      ]);
      setIntakes((prev) => [...prev.filter((i) => i.intake_date < from || i.intake_date > to), ...data.intakes]);
      setLoadedDays((prev) => {
        const next = new Set(prev);
        let day = from;
        while (day <= to) {
          next.add(day);
          day = addDays(day, 1);
        }
        return next;
      });
    },
    [supabase]
  );

  // Al abrir: carga los últimos 7 días (para el resumen y el registro de hoy).
  useEffect(() => {
    if (!today) return;
    setLoadError(null);
    loadRange(addDays(today, -6), today).catch((err) => {
      console.error("Error al cargar los hábitos:", err);
      setLoadError("No se pudieron cargar tus hábitos.");
    });
  }, [today, loadRange, reloadKey]);

  // Si eliges un día más antiguo que la última semana, se carga ese día aparte.
  useEffect(() => {
    if (!today || !date) return;
    if (date >= addDays(today, -6) || loadedDays.has(date)) return;
    setLoadError(null);
    loadRange(date, date).catch((err) => {
      console.error("Error al cargar el día:", err);
      setLoadError("No se pudo cargar ese día.");
    });
  }, [date, today, loadedDays, loadRange, reloadKey]);

  const ready = date !== "" && loadedDays.has(date);
  const windowReady = today !== "" && loadedDays.has(today);

  const nowDate = new Date(nowMs);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  const current = habits[date] ?? EMPTY_HABIT;

  // Mantiene el campo de sueño igual al valor guardado de la fecha elegida.
  useEffect(() => {
    setSleepInput(current.sleep_hours === null ? "" : String(current.sleep_hours));
    setSleepError(null);
  }, [date, ready, current.sleep_hours]);

  const doses = useMemo(
    () => (ready ? buildDoses(medications, intakes, date, today, nowMinutes) : []),
    [ready, medications, intakes, date, today, nowMinutes]
  );

  const dayActivities = useMemo(() => activities.filter((a) => a.activity_date === date), [activities, date]);

  const summary = useMemo(
    () => (windowReady ? computeWeekSummary({ today, nowMinutes, medications, habits, activities, intakes }) : null),
    [windowReady, today, nowMinutes, medications, habits, activities, intakes]
  );

  // Pone un guardado en la cola. Si falla, avisa y recarga ese día desde la base.
  const enqueue = (task: () => Promise<unknown>, day: string) => {
    setSaveError(null);
    queueRef.current = queueRef.current
      .then(async () => {
        await task();
      })
      .catch(async (err) => {
        console.error("Error al guardar:", err);
        setSaveError("No se pudo guardar el último cambio. Se recargó la información de ese día.");
        try {
          await loadRange(day, day);
        } catch (reloadError) {
          console.error("Error al recargar:", reloadError);
        }
      });
  };

  const saveHabit = (next: DailyHabitValues) => {
    const day = date;
    setHabits((prev) => ({ ...prev, [day]: next }));
    enqueue(
      () =>
        saveDailyHabit(supabase, {
          habit_date: day,
          water_glasses: next.water_glasses,
          sleep_hours: next.sleep_hours
        }),
      day
    );
  };

  const changeWater = (delta: number) => {
    const glasses = Math.min(WATER_MAX_GLASSES, Math.max(0, current.water_glasses + delta));
    if (glasses === current.water_glasses) return;
    saveHabit({ ...current, water_glasses: glasses });
  };

  const handleSaveSleep = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSleepError(null);

    const text = sleepInput.trim().replace(",", ".");

    // Campo vacío = quitar el dato de sueño de ese día.
    if (text === "") {
      if (current.sleep_hours !== null) saveHabit({ ...current, sleep_hours: null });
      return;
    }

    const hours = Number(text);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      setSleepError("Escribe un número de horas entre 0 y 24.");
      return;
    }

    const rounded = Math.round(hours * 10) / 10;
    saveHabit({ ...current, sleep_hours: rounded });
    setSleepInput(String(rounded));
  };

  const handleMark = (dose: Dose, status: IntakeStatus) => {
    const day = date;
    const same = (i: IntakeRow) => i.schedule_id === dose.scheduleId && i.intake_date === day;
    const existing = intakes.find(same);

    // Tocar otra vez el botón ya marcado quita la marca.
    if (existing && existing.status === status) {
      setIntakes((prev) => prev.filter((i) => !same(i)));
      enqueue(() => clearIntake(supabase, dose.scheduleId, day), day);
      return;
    }

    const optimistic: IntakeRow = {
      id: `temp-${dose.scheduleId}-${day}`,
      user_id: "",
      medication_id: dose.medicationId,
      schedule_id: dose.scheduleId,
      intake_date: day,
      status,
      created_at: "",
      updated_at: ""
    };
    setIntakes((prev) => [...prev.filter((i) => !same(i)), optimistic]);
    enqueue(
      () =>
        setIntake(supabase, {
          medication_id: dose.medicationId,
          schedule_id: dose.scheduleId,
          intake_date: day,
          status
        }),
      day
    );
  };

  const handleAddActivity = async (input: { activity_type: string; minutes: number; notes: string }) => {
    const row = await addActivity(supabase, { activity_date: date, ...input });
    setActivities((prev) => [...prev, row]);
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(supabase, id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const dateTitle = date
    ? date === today
      ? "Hoy"
      : formatDate(date, { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div className="space-y-6">
      <SectionCard
        title="Registro del día"
        description="Elige el día que quieres registrar. Todo lo de abajo se guarda en ese día."
      >
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Fecha</span>
            <input
              type="date"
              value={date}
              max={today || undefined}
              onChange={(e) => {
                const value = e.target.value;
                if (value && (!today || value <= today)) setDate(value);
              }}
              className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
            />
          </label>

          {today && date !== today ? (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="rounded-full border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              Ir a hoy
            </button>
          ) : null}
        </div>

        {dateTitle ? <p className="mt-3 text-base font-semibold capitalize text-ink">{dateTitle}</p> : null}

        {saveError ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{saveError}</p>
        ) : null}
      </SectionCard>

      {loadError ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm font-semibold text-danger">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-danger transition hover:bg-rose-100"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!ready && !loadError ? <p className="text-center text-sm text-muted">Cargando tus hábitos...</p> : null}

      {ready ? (
        <>
          <MedicationIntakeCard doses={doses} hasMedications={medications.length > 0} onMark={handleMark} />

          <SectionCard
            title="Agua y sueño"
            description="Cuenta los vasos de agua que tomas y anota cuántas horas dormiste."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Droplets className="h-4 w-4 text-sky-600" />
                  Vasos de agua
                </p>

                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => changeWater(-1)}
                    disabled={current.water_glasses <= 0}
                    aria-label="Quitar un vaso"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-soft transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-6 w-6" />
                  </button>

                  <div className="min-w-[5rem] text-center">
                    <p className="text-4xl font-semibold text-ink">{current.water_glasses}</p>
                    <p className="text-sm text-muted">{current.water_glasses === 1 ? "vaso" : "vasos"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => changeWater(1)}
                    disabled={current.water_glasses >= WATER_MAX_GLASSES}
                    aria-label="Agregar un vaso"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-soft transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>

                <p
                  className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    current.water_glasses >= WATER_GOAL_GLASSES
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-muted"
                  }`}
                >
                  {current.water_glasses >= WATER_GOAL_GLASSES
                    ? "Meta cumplida"
                    : `Meta: ${WATER_RANGE_TEXT} al día`}
                </p>

                <p className="mt-3 text-xs leading-5 text-muted">
                  Si tu médico te limitó los líquidos (por ejemplo, por problemas del corazón o de los riñones), sigue
                  su indicación y no uses esta meta.
                </p>
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Moon className="h-4 w-4 text-indigo-600" />
                  Horas de sueño
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">Horas que dormiste la noche anterior a este día.</p>

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
                    className="rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-teal-700"
                  >
                    Guardar sueño
                  </button>
                </form>

                {sleepError ? (
                  <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">
                    {sleepError}
                  </p>
                ) : null}

                <p className="mt-3 text-sm text-muted">
                  {current.sleep_hours === null
                    ? "Sin registrar."
                    : `Guardado: ${formatHours(current.sleep_hours)} h · ${
                        current.sleep_hours >= SLEEP_GOAL_HOURS
                          ? "Meta cumplida"
                          : `Meta: ${SLEEP_GOAL_HOURS} horas o más`
                      }`}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Para borrar el dato, deja el campo vacío y guarda.
                </p>
              </div>
            </div>
          </SectionCard>

          <ActivityCard activities={dayActivities} onAdd={handleAddActivity} onDelete={handleDeleteActivity} />
        </>
      ) : null}

            {summary ? <WeekSummaryCard summary={summary} activityGoalMinutes={activityGoalMinutes} /> : null}
    </div>
  );
}