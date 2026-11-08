"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SectionCard } from "@/components/section-card";
import { MedicationIntakeCard } from "@/components/habits/medication-intake-card";
import { ActivityCard } from "@/components/habits/activity-card";
import { WaterSleepCard } from "@/components/habits/water-sleep-card";
import { WeekSummaryCard } from "@/components/habits/week-summary-card";
import { SectionTabs } from "@/components/shell/section-tabs";
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
  ACTIVITY_WEEKLY_GOAL_MINUTES,
  WATER_MAX_GLASSES,
  buildDoses,
  computeWeekSummary,
  type Dose
} from "@/lib/habits-config";
import { buildHabitDays } from "@/lib/habits-insights";
import { addDays, formatDate, toDateString } from "@/lib/date-utils";
import { HABIT_TABS } from "@/lib/section-tabs";
import "./habits.css";

const EMPTY_HABIT: DailyHabitValues = { water_glasses: 0, sleep_hours: null };

// Se cargan 14 días: la semana actual y la anterior, para poder compararlas.
const HISTORY_DAYS = 14;
const MINUTES_IN_DAY = 24 * 60;

export function HabitsManager({
  medications,
  activityGoalMinutes,
  waterNotice,
  initialTab
}: {
  medications: MedicationWithSchedules[];
  activityGoalMinutes?: number;
  waterNotice?: string | null;
  initialTab: string;
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

  // Al abrir: carga las últimas dos semanas (para el resumen, la comparación y el registro de hoy).
  useEffect(() => {
    if (!today) return;
    setLoadError(null);
    loadRange(addDays(today, 1 - HISTORY_DAYS), today).catch((err) => {
      console.error("Error al cargar los hábitos:", err);
      setLoadError("No se pudieron cargar tus hábitos.");
    });
  }, [today, loadRange, reloadKey]);

  // Si eliges un día más antiguo, se carga ese día aparte.
  useEffect(() => {
    if (!today || !date) return;
    if (date >= addDays(today, 1 - HISTORY_DAYS) || loadedDays.has(date)) return;
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

  const doses = useMemo(
    () => (ready ? buildDoses(medications, intakes, date, today, nowMinutes) : []),
    [ready, medications, intakes, date, today, nowMinutes]
  );

  const dayActivities = useMemo(() => activities.filter((a) => a.activity_date === date), [activities, date]);

  const summary = useMemo(
    () => (windowReady ? computeWeekSummary({ today, nowMinutes, medications, habits, activities, intakes }) : null),
    [windowReady, today, nowMinutes, medications, habits, activities, intakes]
  );

  // Los 7 días anteriores: todos ya terminaron, por eso se calculan como al final del día.
  const previousSummary = useMemo(
    () =>
      windowReady
        ? computeWeekSummary({
            today: addDays(today, -7),
            nowMinutes: MINUTES_IN_DAY,
            medications,
            habits,
            activities,
            intakes
          })
        : null,
    [windowReady, today, medications, habits, activities, intakes]
  );

  const recentDays = useMemo(
    () => (windowReady ? buildHabitDays({ today, nowMinutes, medications, habits, activities, intakes }) : []),
    [windowReady, today, nowMinutes, medications, habits, activities, intakes]
  );

  const lastActivity = useMemo(
    () =>
      activities.reduce<ActivityRow | null>(
        (latest, activity) => (!latest || activity.created_at > latest.created_at ? activity : latest),
        null
      ),
    [activities]
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

  const saveSleep = (hours: number | null) => {
    saveHabit({ ...current, sleep_hours: hours });
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

  const loading = loadError ? null : <p className="text-center text-sm text-muted">Cargando tus hábitos...</p>;

  return (
    <div className="space-y-6">
      <SectionCard
        title="Registro del día"
        description="Elige el día que quieres registrar. Lo de las pestañas de abajo se guarda en ese día."
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

      <SectionTabs
        tabs={HABIT_TABS}
        initialTab={initialTab}
        panels={{
          medicamentos: ready ? (
            <MedicationIntakeCard
              doses={doses}
              hasMedications={medications.length > 0}
              onMark={handleMark}
              days={recentDays}
              isToday={date === today}
              nowMinutes={nowMinutes}
            />
          ) : (
            loading
          ),
          agua: ready ? (
            <WaterSleepCard
              date={date}
              current={current}
              waterNotice={waterNotice}
              days={recentDays}
              onChangeWater={changeWater}
              onSaveSleep={saveSleep}
            />
          ) : (
            loading
          ),
          actividad: ready ? (
            <ActivityCard
              activities={dayActivities}
              onAdd={handleAddActivity}
              onDelete={handleDeleteActivity}
              weekMinutes={summary?.activity.totalMinutes ?? 0}
              goalMinutes={activityGoalMinutes ?? ACTIVITY_WEEKLY_GOAL_MINUTES}
              lastActivity={lastActivity}
            />
          ) : (
            loading
          ),
          semana: summary ? (
            <WeekSummaryCard
              summary={summary}
              previous={previousSummary}
              days={recentDays}
              activityGoalMinutes={activityGoalMinutes}
              waterRestricted={Boolean(waterNotice)}
            />
          ) : (
            loading
          )
        }}
      />
    </div>
  );
}
