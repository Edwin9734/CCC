"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RoutinePanel } from "@/components/habits/routine-panel";
import { SectionCard } from "@/components/section-card";
import type { ContactsInfo } from "@/lib/contacts";
import { addDays } from "@/lib/date-utils";
import type { GoalMode, RoutineEntries, RoutineGoal } from "@/lib/routine-config";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createRoutineGoal,
  deleteRoutineGoal,
  getLastUseBefore,
  getRoutineEntries,
  getRoutineGoals,
  isRoutineTableMissing,
  saveRoutineAmount
} from "@/lib/supabase/routine";

const HISTORY_DAYS = 14;

type Status = "loading" | "ready" | "missing" | "error";

export function RoutineManager({
  date,
  today,
  contacts
}: {
  date: string;
  today: string;
  contacts: ContactsInfo | null;
}) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [status, setStatus] = useState<Status>("loading");
  const [entries, setEntries] = useState<RoutineEntries>({});
  const [goals, setGoals] = useState<RoutineGoal[]>([]);
  const [lastUseBefore, setLastUseBefore] = useState<Record<string, string | null>>({});
  const [loadedDays, setLoadedDays] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const loadRange = useCallback(
    async (from: string, to: string) => {
      const rows = await getRoutineEntries(supabase, from, to);

      setEntries((previous) => {
        const next: RoutineEntries = {};
        for (const [day, values] of Object.entries(previous)) {
          if (day < from || day > to) next[day] = values;
        }
        for (const row of rows) {
          next[row.entry_date] = { ...next[row.entry_date], [row.item_key]: row.amount };
        }
        return next;
      });
      setLoadedDays((previous) => {
        const next = new Set(previous);
        for (let day = from; day <= to; day = addDays(day, 1)) next.add(day);
        return next;
      });
    },
    [supabase]
  );

  useEffect(() => {
    if (!today) return;
    let active = true;
    const from = addDays(today, 1 - HISTORY_DAYS);

    (async () => {
      try {
        setStatus("loading");
        const [loadedGoals] = await Promise.all([getRoutineGoals(supabase), loadRange(from, today)]);

        // Solo hace falta buscar más atrás en planes que empezaron antes de los días cargados.
        const older = loadedGoals.filter((goal) => goal.started_on < from);
        const lastUses = await Promise.all(
          older.map(async (goal) => [goal.item_key, await getLastUseBefore(supabase, goal.item_key, from)] as const)
        );

        if (!active) return;
        setGoals(loadedGoals);
        setLastUseBefore(Object.fromEntries(lastUses));
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        if (isRoutineTableMissing(err)) {
          setStatus("missing");
        } else {
          console.error("Error al cargar la rutina:", err);
          setStatus("error");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [today, loadRange, supabase, reloadKey]);

  // Si se elige un día más antiguo, se carga ese día aparte.
  useEffect(() => {
    if (status !== "ready" || !date || loadedDays.has(date)) return;
    loadRange(date, date).catch((err) => {
      console.error("Error al cargar el día de la rutina:", err);
      setSaveError("No se pudo cargar ese día.");
    });
  }, [status, date, loadedDays, loadRange]);

  const setAmount = (key: string, amount: number) => {
    const day = date;
    setSaveError(null);
    setEntries((previous) => {
      const values = { ...previous[day] };
      if (amount > 0) values[key] = amount;
      else delete values[key];
      return { ...previous, [day]: values };
    });

    // Cola de guardado: los cambios se envían uno tras otro, en el orden en que se hicieron.
    queueRef.current = queueRef.current
      .then(() => saveRoutineAmount(supabase, { entry_date: day, item_key: key, amount }))
      .catch(async (err) => {
        console.error("Error al guardar la rutina:", err);
        setSaveError("No se pudo guardar el último cambio. Se recargó la información de ese día.");
        try {
          await loadRange(day, day);
        } catch (reloadError) {
          console.error("Error al recargar la rutina:", reloadError);
        }
      });
  };

  const createGoal = async (input: {
    item_key: string;
    mode: GoalMode;
    daily_limit: number | null;
    replacement_key: string | null;
  }) => {
    const goal = await createRoutineGoal(supabase, { ...input, started_on: today });
    setGoals((previous) => [...previous, goal]);
  };

  const deleteGoal = async (goal: RoutineGoal) => {
    await deleteRoutineGoal(supabase, goal.id);
    setGoals((previous) => previous.filter((item) => item.id !== goal.id));
  };

  if (status === "missing") {
    return (
      <SectionCard
        title="Falta activar Rutina"
        description="Para guardar estos datos hay que crear sus tablas en la base de datos."
      >
        <p className="text-sm leading-6 text-muted">
          Ejecuta el archivo <span className="font-semibold text-ink">supabase/rutina.sql</span> en el editor SQL de
          Supabase y vuelve a abrir esta pestaña.
        </p>
      </SectionCard>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm font-semibold text-danger">
        <p>No se pudo cargar tu rutina.</p>
        <button
          type="button"
          onClick={() => setReloadKey((value) => value + 1)}
          className="mt-3 rounded-full border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-danger transition hover:bg-rose-100"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (status === "loading" || !date || !loadedDays.has(date)) {
    return <p className="text-center text-sm text-muted">Cargando tu rutina...</p>;
  }

  return (
    <RoutinePanel
      date={date}
      today={today}
      entries={entries}
      goals={goals}
      lastUseBefore={lastUseBefore}
      contacts={contacts}
      saveError={saveError}
      onSetAmount={setAmount}
      onCreateGoal={createGoal}
      onDeleteGoal={deleteGoal}
    />
  );
}
