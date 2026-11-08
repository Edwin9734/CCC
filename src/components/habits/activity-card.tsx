"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  Bike,
  Dumbbell,
  Flag,
  Footprints,
  Music,
  Pause,
  PersonStanding,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Sprout,
  Timer,
  Trash2,
  Waves,
  type LucideIcon
} from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { Confetti, ProgressRing } from "@/components/habits/habit-visuals";
import { ACTIVITY_TYPES, activityLabel } from "@/lib/habits-config";
import type { ActivityRow } from "@/lib/supabase/habits";

const QUICK_MINUTES = [15, 30, 45, 60];
const TIMER_STORAGE_KEY = "habitos-cronometro";

const ACTIVITY_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  caminata: { icon: Footprints, color: "bg-emerald-600" },
  bicicleta: { icon: Bike, color: "bg-sky-600" },
  natacion: { icon: Waves, color: "bg-cyan-600" },
  ejercicios_casa: { icon: Dumbbell, color: "bg-orange-600" },
  estiramientos: { icon: PersonStanding, color: "bg-violet-600" },
  baile: { icon: Music, color: "bg-rose-600" },
  jardineria: { icon: Sprout, color: "bg-green-600" },
  otra: { icon: Sparkles, color: "bg-amber-600" }
};

interface TimerState {
  running: boolean;
  startedAt: number;
  accumulated: number;
}

const STOPPED_TIMER: TimerState = { running: false, startedAt: 0, accumulated: 0 };

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// El cronómetro guarda su inicio, así sigue contando aunque se cambie de pantalla o se bloquee el celular.
function useStopwatch() {
  const [timer, setTimer] = useState<TimerState>(STOPPED_TIMER);
  const [now, setNow] = useState(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) setTimer({ ...STOPPED_TIMER, ...(JSON.parse(saved) as Partial<TimerState>) });
    } catch {
      // Sin almacenamiento, el cronómetro funciona igual mientras la pantalla siga abierta.
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!timer.running) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer.running]);

  const update = (next: TimerState) => {
    setTimer(next);
    setNow(Date.now());
    try {
      if (next.running || next.accumulated > 0) window.localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(TIMER_STORAGE_KEY);
    } catch {
      // Ver arriba.
    }
  };

  const elapsed = timer.accumulated + (timer.running ? Math.max(0, now - timer.startedAt) : 0);

  return {
    elapsed,
    running: timer.running,
    start: () => update({ running: true, startedAt: Date.now(), accumulated: timer.accumulated }),
    pause: () => update({ running: false, startedAt: 0, accumulated: elapsed }),
    reset: () => update(STOPPED_TIMER)
  };
}

export function ActivityCard({
  activities,
  onAdd,
  onDelete,
  weekMinutes,
  goalMinutes,
  lastActivity
}: {
  activities: ActivityRow[];
  onAdd: (input: { activity_type: string; minutes: number; notes: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  weekMinutes: number;
  goalMinutes: number;
  lastActivity: ActivityRow | null;
}) {
  const [type, setType] = useState(ACTIVITY_TYPES[0].key);
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [timerMessage, setTimerMessage] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ id: number; text: string } | null>(null);
  const stopwatch = useStopwatch();

  const totalMinutes = activities.reduce((sum, a) => sum + a.minutes, 0);

  useEffect(() => {
    if (!celebration) return;
    const id = window.setTimeout(() => setCelebration(null), 3500);
    return () => window.clearTimeout(id);
  }, [celebration]);

  const celebrate = (activityType: string, value: number) => {
    setCelebration((previous) => ({
      id: (previous?.id ?? 0) + 1,
      text: `¡Muy bien! Guardaste ${value} min de ${activityLabel(activityType).toLowerCase()}.`
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 600) {
      setError("Escribe los minutos con un número entero entre 1 y 600.");
      return;
    }

    setSaving(true);
    try {
      await onAdd({ activity_type: type, minutes: value, notes: notes.trim() });
      setMinutes("");
      setNotes("");
      setTimerMessage(null);
      celebrate(type, value);
    } catch (err) {
      console.error("Error al guardar la actividad:", err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleRepeat = async () => {
    if (!lastActivity) return;
    setError(null);
    setSaving(true);
    try {
      await onAdd({ activity_type: lastActivity.activity_type, minutes: lastActivity.minutes, notes: "" });
      celebrate(lastActivity.activity_type, lastActivity.minutes);
    } catch (err) {
      console.error("Error al repetir la actividad:", err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      await onDelete(id);
    } catch (err) {
      console.error("Error al eliminar la actividad:", err);
      setError("No se pudo eliminar. Inténtalo de nuevo.");
    } finally {
      setDeleting(null);
    }
  };

  const finishTimer = () => {
    const value = Math.min(600, Math.max(1, Math.round(stopwatch.elapsed / 60000)));
    setMinutes(String(value));
    setTimerMessage(`Pasamos ${value} min al formulario. Revisa los datos y toca "Agregar actividad".`);
    stopwatch.reset();
  };

  const SelectedIcon = (ACTIVITY_ICONS[type] ?? ACTIVITY_ICONS.otra).icon;

  return (
    <SectionCard
      title="Actividad física"
      description="Anota lo que hiciste hoy. Puedes agregar varias actividades en el mismo día."
      className="relative"
    >
      {celebration ? <Confetti key={celebration.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-4 rounded-3xl border border-black/5 bg-white p-4">
          <ProgressRing
            value={goalMinutes > 0 ? weekMinutes / goalMinutes : 0}
            color="#14b8a6"
            label={`${weekMinutes} de ${goalMinutes} minutos esta semana`}
          >
            <span className="text-xl font-semibold leading-6 text-ink">{weekMinutes}</span>
            <span className="text-xs text-muted">min</span>
          </ProgressRing>
          <div>
            <p className="text-base font-semibold text-ink">Meta de la semana</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {weekMinutes} de {goalMinutes} min en tus últimos 7 días, según tu plan.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-4">
          <p className="flex items-center gap-2 text-base font-semibold text-ink">
            <Timer className="h-5 w-5 text-teal-600" aria-hidden="true" />
            Cronómetro
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white ${
                stopwatch.running ? "hab-timer-on" : ""
              }`}
              aria-hidden="true"
            >
              <SelectedIcon className={`h-7 w-7 ${stopwatch.running ? "hab-activity-on" : ""}`} />
            </span>
            <p role="timer" className="text-4xl font-semibold tabular-nums text-ink">
              {formatElapsed(stopwatch.elapsed)}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stopwatch.running ? (
              <button
                type="button"
                onClick={stopwatch.pause}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition hover:bg-slate-50 active:scale-95"
              >
                <Pause className="h-5 w-5" aria-hidden="true" />
                Pausar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTimerMessage(null);
                  stopwatch.start();
                }}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-base font-semibold text-white transition hover:bg-teal-800 active:scale-95"
              >
                <Play className="h-5 w-5" aria-hidden="true" />
                {stopwatch.elapsed > 0 ? "Seguir" : "Iniciar"}
              </button>
            )}
            <button
              type="button"
              onClick={finishTimer}
              disabled={stopwatch.elapsed <= 0}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Flag className="h-5 w-5" aria-hidden="true" />
              Terminar
            </button>
          </div>
          {timerMessage ? (
            <p role="status" className="mt-3 text-sm font-semibold leading-6 text-teal-800">
              {timerMessage}
            </p>
          ) : null}
        </div>
      </div>

      {lastActivity ? (
        <button
          type="button"
          onClick={handleRepeat}
          disabled={saving}
          className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-teal-300 bg-teal-50 px-5 py-3 text-base font-semibold text-teal-900 transition hover:bg-teal-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-5 w-5 shrink-0" aria-hidden="true" />
          Repetir: {activityLabel(lastActivity.activity_type)}, {lastActivity.minutes} min
        </button>
      ) : null}

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <span className="text-sm font-semibold">Elige con un toque</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Tipo de actividad">
            {ACTIVITY_TYPES.map((item, index) => {
              const visual = ACTIVITY_ICONS[item.key] ?? ACTIVITY_ICONS.otra;
              const Icon = visual.icon;
              const selected = item.key === type;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setType(item.key)}
                  aria-pressed={selected}
                  className={`hab-pop flex min-h-[6.5rem] flex-col items-center justify-center gap-2 rounded-3xl border-2 p-2 text-center text-sm font-semibold leading-5 text-ink transition ${
                    selected ? "border-accent bg-accentSoft" : "border-black/5 bg-white hover:bg-slate-50"
                  }`}
                  style={{ "--i": index } as CSSProperties}
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${visual.color}`} aria-hidden="true">
                    <Icon className={`h-6 w-6 ${selected ? "hab-activity-on" : ""}`} />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Actividad</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none"
          >
            {ACTIVITY_TYPES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold">Minutos</span>
          <input
            type="number"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="Ej. 30"
            min="1"
            max="600"
            step="1"
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_MINUTES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMinutes(String(value))}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
              >
                {value} min
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Nota (opcional)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={300}
            placeholder="Ej. Caminé por el parque con mi vecina"
            className="rounded-2xl border border-black/10 bg-background px-4 py-4 text-base outline-none placeholder:text-muted"
          />
        </label>

        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{error}</p> : null}

        {celebration ? (
          <p role="status" className="hab-pop rounded-2xl bg-emerald-50 px-4 py-3 text-center text-base font-semibold text-emerald-800">
            {celebration.text}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Guardando..." : "Agregar actividad"}
        </button>
      </form>

      <div className="mt-5">
        {activities.length === 0 ? (
          <p className="text-sm text-muted">No hay actividad registrada en este día.</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-ink">Total del día: {totalMinutes} min</p>
            <div className="mt-3 space-y-3">
              {activities.map((activity) => {
                const visual = ACTIVITY_ICONS[activity.activity_type] ?? ACTIVITY_ICONS.otra;
                const Icon = visual.icon;
                return (
                  <article
                    key={activity.id}
                    className="hab-rise flex items-start justify-between gap-3 rounded-3xl border border-black/5 bg-background p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${visual.color}`} aria-hidden="true">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-ink">{activityLabel(activity.activity_type)}</p>
                        <p className="mt-1 text-sm text-muted">{activity.minutes} min</p>
                        {activity.notes ? <p className="mt-1 text-sm leading-6 text-muted">{activity.notes}</p> : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(activity.id)}
                      disabled={deleting === activity.id}
                      aria-label="Eliminar actividad"
                      className="rounded-2xl bg-rose-50 p-3 text-danger transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Consulta a tu médico antes de empezar o aumentar la actividad física.
      </p>
    </SectionCard>
  );
}
