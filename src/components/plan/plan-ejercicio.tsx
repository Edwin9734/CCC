"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Check, ChevronDown, Dumbbell, Footprints, HeartPulse, type LucideIcon, MessageCircle, Moon, Music, Pause, PersonStanding, Play, Plus, Siren, Timer, Wind } from "lucide-react";
import { Confetti } from "@/components/habits/habit-visuals";
import { CountUp, Expand, FormSheet, Hero, SAVE_ERROR } from "@/components/antecedentes/antecedentes-ui";
import { RunningPerson } from "@/components/racha/racha-art";
import { EXERCISE_SAFETY, type PlanData } from "@/lib/plan";
import type { PlanAdjustment } from "@/lib/plan-adjustment";
import { WEEK_LETTERS, activityTypeFor, weekDates, type NewActivity } from "@/lib/plan-goals";
import type { ProfileExtras } from "@/lib/plan-profile";
import type { ActivityRow } from "@/lib/supabase/habits";

const TYPE_ICON: Record<string, LucideIcon> = {
  caminata: Footprints,
  estiramientos: PersonStanding,
  ejercicios_casa: Dumbbell,
  otra: Music
};

const TALK_TEST: { label: string; text: string; color: string }[] = [
  { label: "Puedo cantar", text: "Vas muy suave. Si te sientes bien, sube un poquito el ritmo.", color: "bg-sky-100 text-sky-950" },
  { label: "Puedo conversar", text: "¡Ese es el ritmo ideal! Mantenlo.", color: "bg-emerald-100 text-emerald-950" },
  { label: "Me cuesta hablar", text: "Baja el ritmo y descansa un momento.", color: "bg-amber-100 text-amber-950" }
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

// Cuenta con la hora real, así sigue bien aunque se bloquee la pantalla.
function SessionDialog({
  activity,
  minutes,
  onClose,
  onFinish
}: {
  activity: string;
  minutes: number;
  onClose: () => void;
  onFinish: (minutes: number) => Promise<void>;
}) {
  const [running, setRunning] = useState(false);
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [total, setTotal] = useState(minutes * 60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsed = elapsedBefore + (running ? Math.max(0, (now - startedAt) / 1000) : 0);
  const left = Math.max(0, Math.ceil(total - elapsed));
  const progress = Math.min(1, elapsed / total);
  const circumference = 2 * Math.PI * 52;
  const phase = elapsed === 0 ? "Listo cuando quieras" : left === 0 ? "¡Tiempo cumplido!" : elapsed < 180 ? "Calienta despacio" : left < 120 ? "Baja el ritmo y estira" : "Sigue a tu ritmo";

  const toggle = () => {
    const stamp = Date.now();
    if (running) setElapsedBefore(elapsed);
    else setStartedAt(stamp);
    setNow(stamp);
    setRunning(!running);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      // Si no usó el contador, se guardan los minutos del plan; si lo usó, los que realmente hizo.
      await onFinish(elapsed < 30 ? minutes : Math.max(1, Math.round(elapsed / 60)));
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  return (
    <FormSheet tone="orange" title={activity} icon={<Timer className="h-7 w-7" />} saving={saving} error={error} submitLabel="Terminé, guardar" onClose={onClose} onSubmit={finish}>
      <div className="flex flex-col items-center text-center">
        <div className="relative h-52 w-52">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#ffedd5" strokeWidth="9" />
            <circle className="pln-ring" cx="60" cy="60" r="52" fill="none" stroke="#c2410c" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums text-ink" role="timer">
              {pad(Math.floor(left / 60))}:{pad(left % 60)}
            </span>
            <span className="mt-1 px-6 text-sm font-semibold leading-4 text-muted">{phase}</span>
          </div>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          <button type="button" onClick={toggle} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-lg font-bold text-white transition active:scale-95">
            {running ? <Pause className="h-6 w-6 shrink-0" aria-hidden="true" /> : <Play className="h-6 w-6 shrink-0" aria-hidden="true" />}
            {running ? "Pausar" : elapsed > 0 ? "Seguir" : "Empezar"}
          </button>
          <button type="button" onClick={() => setTotal(total + 300)} className="flex min-h-14 items-center justify-center gap-1 rounded-full border-2 border-black/10 bg-white px-4 py-2 text-lg font-bold text-ink transition active:scale-95">
            <Plus className="h-6 w-6 shrink-0" aria-hidden="true" />5 min
          </button>
        </div>
      </div>
    </FormSheet>
  );
}

export function PlanEjercicio({
  plan,
  adjustment,
  extras,
  today,
  activities,
  onAddActivity,
  notify
}: {
  plan: PlanData;
  adjustment: PlanAdjustment;
  extras: ProfileExtras;
  today: string;
  activities: ActivityRow[];
  onAddActivity: (input: NewActivity) => Promise<void>;
  notify: (text: string, error?: boolean) => void;
}) {
  const week = weekDates(today);
  const [selected, setSelected] = useState(today);
  const [session, setSession] = useState(false);
  const [talk, setTalk] = useState<number | null>(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [cheer, setCheer] = useState(0);

  const dayIndex = Math.max(0, week.indexOf(selected));
  const routineDay = plan.routine.days[dayIndex];
  const minutesOn = (date: string) => activities.filter((item) => item.activity_date === date).reduce((sum, item) => sum + item.minutes, 0);
  const weekTotal = week.reduce((sum, date) => sum + minutesOn(date), 0);
  const activeDays = week.filter((date) => minutesOn(date) > 0).length;
  const goal = adjustment.activity.minutes;
  const percent = Math.min(100, Math.round((weekTotal / goal) * 100));
  const doneToday = minutesOn(selected);
  const future = selected > today;
  const rest = routineDay.minutes === 0;
  const Icon = rest ? Moon : (TYPE_ICON[activityTypeFor(routineDay.activity)] ?? Dumbbell);

  const finishSession = async (minutes: number) => {
    await onAddActivity({ activity_date: selected, activity_type: activityTypeFor(routineDay.activity), minutes, notes: null });
    setSession(false);
    setCheer(Date.now());
    notify(`¡Bien hecho! ${minutes} min guardados`);
  };

  return (
    <div className="relative space-y-4">
      {cheer ? <Confetti key={cheer} /> : null}

      <Hero
        tone="orange"
        art={<RunningPerson className="h-full w-full" />}
        title={`Rutina «${plan.routine.name}»`}
        text="Tu semana de movimiento, un día a la vez."
        stats={[
          { label: "Meta en min", value: goal },
          { label: "Hechos", value: weekTotal },
          { label: "Días activos", value: activeDays }
        ]}
      >
        <div className="h-4 overflow-hidden rounded-sm bg-black/25">
          <div className="pln-grow h-full rounded-sm bg-amber-300" style={{ "--to": `${percent}%` } as CSSProperties} />
        </div>
        <p className="mt-1 text-sm font-bold">{percent}% de tu meta semanal</p>
      </Hero>

      {extras.cardiacClearance ? (
        <p className="rounded-2xl bg-amber-100 p-3 text-base font-bold leading-5 text-amber-950">
          Por tus antecedentes ({extras.cardiacConditions.join(", ")}), no empieces ni aumentes esta rutina sin la autorización de tu médico.
        </p>
      ) : null}

      <div className="pln-week grid grid-cols-7 gap-1.5" role="group" aria-label="Día de la semana">
        {week.map((date, index) => {
          const isSelected = date === selected;
          const did = minutesOn(date) > 0;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              aria-pressed={isSelected}
              aria-label={`${plan.routine.days[index].day}${date === today ? " (hoy)" : ""}`}
              className={`relative flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 text-lg font-bold transition active:scale-90 ${
                isSelected ? "border-orange-700 bg-orange-700 text-white shadow-soft" : date === today ? "border-orange-400 bg-orange-50 text-ink" : "border-black/10 bg-white text-ink"
              }`}
            >
              {WEEK_LETTERS[index]}
              {did ? <Check className="ant-pop h-5 w-5" aria-hidden="true" /> : <span className="text-xs font-semibold opacity-80">{plan.routine.days[index].minutes || "—"}</span>}
            </button>
          );
        })}
      </div>

      <section key={selected} className="ant-rise ab-card rounded-[1.75rem] p-4">
        <div className="flex items-start gap-3">
          <span className={`ant-tile flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl ${rest ? "bg-indigo-100 text-indigo-700" : "bg-orange-100 text-orange-800"}`} aria-hidden="true">
            <Icon className="pln-updown h-10 w-10" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">
              {routineDay.day}
              {selected === today ? " · hoy" : ""}
            </p>
            <p className="text-xl font-bold leading-6 text-ink">{routineDay.activity}</p>
            {!rest ? <p className="mt-1 text-2xl font-bold tabular-nums text-orange-800">{routineDay.minutes} min</p> : null}
          </div>
        </div>

        {doneToday > 0 ? (
          <p className="ant-pop mt-3 flex items-center gap-2 rounded-2xl bg-emerald-100 p-3 text-base font-bold text-emerald-950">
            <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
            Registraste <CountUp value={doneToday} /> min este día
          </p>
        ) : null}

        {!rest && !future && doneToday === 0 ? (
          <button type="button" onClick={() => setSession(true)} className="mt-3 flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-orange-700 px-5 py-3 text-xl font-bold text-white shadow-soft transition hover:bg-orange-800 active:scale-[0.98]">
            <Play className="h-7 w-7 shrink-0" aria-hidden="true" />
            Hacer esta actividad
          </button>
        ) : null}
        {future ? <p className="mt-3 text-base font-semibold text-muted">Este día aún no llega.</p> : null}

        {!future ? (
          <Link href="/habitos?tab=actividad" className="mt-2 flex min-h-12 items-center justify-center rounded-full border-2 border-black/10 bg-white px-4 py-2 text-center text-base font-semibold text-ink transition active:scale-[0.98]">
            Registrar otra actividad
          </Link>
        ) : null}
      </section>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <section className="ant-rise ab-card rounded-[1.75rem] p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
            <MessageCircle className="h-5 w-5 text-orange-700" aria-hidden="true" />
            ¿Cómo vas de ritmo?
          </h3>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {TALK_TEST.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setTalk(index)}
                aria-pressed={talk === index}
                className={`min-h-12 rounded-2xl border-2 px-2 py-1 text-base font-semibold leading-5 transition active:scale-95 ${talk === index ? "border-orange-700 bg-orange-700 text-white" : "border-black/10 bg-white text-ink"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {talk !== null ? (
            <p key={talk} className={`ant-pop mt-2 rounded-2xl p-3 text-base font-bold leading-5 ${TALK_TEST[talk].color}`}>
              {TALK_TEST[talk].text}
            </p>
          ) : null}
        </section>

        <section className="ant-rise ab-card rounded-[1.75rem] p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Wind className="h-5 w-5 text-orange-700" aria-hidden="true" />
            Tres pasos
          </h3>
          <ol className="mt-2 grid grid-cols-3 gap-1.5 text-center">
            {[
              { icon: Footprints, label: "5 min para calentar" },
              { icon: HeartPulse, label: "Muévete a tu ritmo" },
              { icon: PersonStanding, label: "Estira suave" }
            ].map((step, index) => {
              const StepIcon = step.icon;
              return (
                <li key={step.label} className="ant-pop rounded-2xl bg-orange-50 p-2 text-sm font-semibold leading-4 text-ink [overflow-wrap:anywhere]" style={{ "--i": index } as CSSProperties}>
                  <StepIcon className="pln-updown mx-auto mb-1 h-7 w-7 text-orange-700" aria-hidden="true" />
                  {step.label}
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="rounded-[1.75rem] border-2 border-red-300 bg-red-50 p-4">
        <p className="flex items-start gap-2 text-base font-bold leading-5 text-red-950">
          <Siren className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">Detente y busca emergencia si sientes dolor en el pecho, mucha falta de aire o desmayo.</span>
        </p>
        <button type="button" onClick={() => setSafetyOpen(!safetyOpen)} aria-expanded={safetyOpen} className="mt-1 flex min-h-11 items-center gap-1 text-base font-semibold text-red-900">
          Más cuidados
          <ChevronDown className="ant-chevron h-5 w-5" aria-hidden="true" />
        </button>
        <Expand open={safetyOpen}>
          <ul className="list-disc space-y-1 pl-5 text-base leading-6 text-ink">
            <li>
              {plan.level === "CRITICAL"
                ? "Con un valor crítico, consulta a tu médico antes de empezar cualquier rutina."
                : "Consulta a tu médico antes de empezar o aumentar la actividad física, sobre todo si tienes problemas del corazón, presión alta, diabetes o dolor en las articulaciones."}
            </li>
            {EXERCISE_SAFETY.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </Expand>
      </section>

      {session ? <SessionDialog activity={routineDay.activity} minutes={routineDay.minutes} onClose={() => setSession(false)} onFinish={finishSession} /> : null}
    </div>
  );
}
