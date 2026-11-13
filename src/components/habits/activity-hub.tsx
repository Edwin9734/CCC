"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Eraser,
  Footprints,
  Gauge,
  HeartPulse,
  House,
  Info,
  MapPin,
  Mars,
  MessageCircle,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  Timer,
  Trees,
  UserRound,
  Users,
  Venus,
  X,
  type LucideIcon
} from "lucide-react";
import "@/components/antecedentes/antecedentes.css";
import "@/components/plan/plan.css";
import "@/components/racha/racha.css";
import "@/components/habits/habits.css";
import { Badge, Expand, Hero, useToast } from "@/components/antecedentes/antecedentes-ui";
import { Confetti } from "@/components/habits/habit-visuals";
import { AgeArt } from "@/components/habits/exercise-art";
import { RunningPerson } from "@/components/racha/racha-art";
import {
  AGE_GROUPS,
  AUDIENCE_LABEL,
  CONDITION_GROUPS,
  GOALS,
  PLACES,
  ROUTINES,
  audiencesOfCombo,
  avoidReason,
  comboFromProfile,
  matchesOf,
  rankFor,
  recommendedFor,
  routineMinutes,
  weekPlan,
  type Combo,
  type ConditionKey,
  type ExerciseProfile,
  type GoalKey,
  type Intensity,
  type Place,
  type Routine
} from "@/lib/exercise-recommendations";
import { getStatusLabel } from "@/lib/ranges";
import { useDrawer } from "@/lib/use-drawer";

type View = "mine" | "recommended";

const INTENSITY: Record<Intensity, { label: string; level: number; chip: string; on: string; off: string }> = {
  suave: { label: "Suave", level: 1, chip: "bg-emerald-100 text-emerald-900", on: "border-emerald-700 bg-emerald-700 text-white", off: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  moderada: { label: "Moderada", level: 2, chip: "bg-amber-100 text-amber-950", on: "border-orange-700 bg-orange-700 text-white", off: "border-orange-200 bg-orange-50 text-orange-950" },
  vigorosa: { label: "Vigorosa", level: 3, chip: "bg-rose-100 text-rose-900", on: "border-rose-700 bg-rose-700 text-white", off: "border-rose-200 bg-rose-50 text-rose-950" }
};

const PLACE_ICON: Record<Place, LucideIcon> = { casa: House, oficina: Briefcase, calle: Trees };
const PLACE_LABEL = Object.fromEntries(PLACES.map((place) => [place.key, place.label])) as Record<Place, string>;
const GOAL_LABEL = Object.fromEntries(GOALS.map((goal) => [goal.key, goal.label])) as Record<GoalKey, string>;
const FAVORITES_KEY = "habitos-rutinas-favoritas";
const WEEK = ["L", "M", "M", "J", "V", "S", "D"];
const WEEK_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const PAGE = 6;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

// Rayitas de intensidad: 1 suave, 2 moderada, 3 vigorosa.
function Bars({ level }: { level: number }) {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((bar) => (
        <span key={bar} className={`w-1.5 rounded-sm bg-current ${bar <= level ? "" : "opacity-25"}`} style={{ height: `${bar * 5 + 1}px` }} />
      ))}
    </span>
  );
}

function sameCombo(a: Combo, b: Combo) {
  return a.age === b.age && a.sex === b.sex && a.conditions.length === b.conditions.length && a.conditions.every((key) => b.conditions.includes(key));
}

// Sesión guiada: un paso a la vez, con su cuenta regresiva. Cuenta con la hora real.
function SessionDialog({ routine, dateLabel, onClose, onSave }: { routine: Routine; dateLabel: string; onClose: () => void; onSave: (minutes: number) => Promise<void> }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  useDrawer({ open: true, onClose, panelRef, returnFocusRef: returnRef });

  const [stepIndex, setStepIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [stepStart, setStepStart] = useState(0);
  const [stepBefore, setStepBefore] = useState(0);
  const [totalBefore, setTotalBefore] = useState(0);
  const [extra, setExtra] = useState(0);
  const [now, setNow] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const step = routine.steps[stepIndex];
  const live = running ? Math.max(0, (now - stepStart) / 1000) : 0;
  const stepElapsed = stepBefore + live;
  const stepTotal = step.minutes * 60 + extra;
  const left = Math.max(0, Math.ceil(stepTotal - stepElapsed));
  const progress = Math.min(1, stepElapsed / stepTotal);
  const totalElapsed = totalBefore + stepElapsed;
  const isLast = stepIndex === routine.steps.length - 1;
  const circumference = 2 * Math.PI * 52;

  // Al terminar el tiempo del paso, pasa solo al siguiente.
  useEffect(() => {
    if (!running || left > 0) return;
    try {
      navigator.vibrate?.(200);
    } catch {
      // Sin vibración disponible.
    }
    if (isLast) {
      setRunning(false);
      setStepBefore(stepTotal);
    } else {
      goTo(stepIndex + 1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running]);

  const goTo = (index: number, keepRunning: boolean) => {
    const stamp = Date.now();
    setTotalBefore(totalBefore + stepElapsed);
    setStepIndex(index);
    setStepBefore(0);
    setExtra(0);
    setStepStart(stamp);
    setNow(stamp);
    setRunning(keepRunning);
  };

  const toggle = () => {
    const stamp = Date.now();
    if (running) setStepBefore(stepElapsed);
    else setStepStart(stamp);
    setNow(stamp);
    setRunning(!running);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      // Si casi no usó el contador, se guardan los minutos de la rutina.
      await onSave(totalElapsed < 60 ? routineMinutes(routine) : Math.max(1, Math.round(totalElapsed / 60)));
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.");
      setSaving(false);
    }
  };

  return createPortal(
    <div className="ant-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={routine.name} className="ant-modal flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-surface text-ink shadow-soft">
        <header className="flex items-center gap-3 bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 px-5 py-4 text-white">
          <Timer className="h-7 w-7 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-xl font-bold leading-6">{routine.name}</p>
          <button type="button" onClick={onClose} data-autofocus aria-label="Cerrar sin guardar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink transition active:scale-95">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <ol className="flex gap-1" aria-label="Pasos">
            {routine.steps.map((item, index) => (
              <li key={item.name} className={`h-2 flex-1 rounded-full ${index < stepIndex ? "bg-teal-600" : index === stepIndex ? "bg-teal-400" : "bg-slate-200"}`} title={item.name} />
            ))}
          </ol>
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-muted">
            Paso {stepIndex + 1} de {routine.steps.length}
          </p>
          <p key={step.name} className="ant-pop text-2xl font-bold leading-7">{step.name}</p>
          <p className="mt-1 text-base leading-6 text-ink">{step.how}</p>

          <div className="relative mx-auto mt-3 h-48 w-48">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#ccfbf1" strokeWidth="9" />
              <circle className="pln-ring" cx="60" cy="60" r="52" fill="none" stroke="#0f766e" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold tabular-nums" role="timer">
                {pad(Math.floor(left / 60))}:{pad(left % 60)}
              </span>
              <span className="text-sm font-semibold text-muted">Total {Math.floor(totalElapsed / 60)} min</span>
            </span>
          </div>

          <div className="mt-3 grid grid-cols-[auto_1fr_auto] gap-2">
            <button type="button" onClick={() => goTo(stepIndex - 1, running)} disabled={stepIndex === 0} aria-label="Paso anterior" className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black/10 bg-white transition active:scale-90 disabled:opacity-30">
              <ChevronLeft className="h-7 w-7" aria-hidden="true" />
            </button>
            <button type="button" onClick={toggle} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-teal-700 px-4 text-lg font-bold text-white shadow-soft transition active:scale-95">
              {running ? <Pause className="h-6 w-6 shrink-0" aria-hidden="true" /> : <Play className="h-6 w-6 shrink-0" aria-hidden="true" />}
              {running ? "Pausar" : stepElapsed > 0 ? "Seguir" : "Empezar"}
            </button>
            <button type="button" onClick={() => goTo(stepIndex + 1, running)} disabled={isLast} aria-label="Paso siguiente" className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-black/10 bg-white transition active:scale-90 disabled:opacity-30">
              <ChevronRight className="h-7 w-7" aria-hidden="true" />
            </button>
          </div>
          <button type="button" onClick={() => setExtra(extra + 60)} className="mx-auto mt-2 flex min-h-11 items-center gap-1 rounded-full bg-slate-100 px-4 text-base font-semibold transition active:scale-95">
            <Plus className="h-5 w-5" aria-hidden="true" />1 minuto más
          </button>
          {routine.caution ? <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950">{routine.caution}</p> : null}
        </div>

        <footer className="border-t border-black/10 bg-white p-3">
          {error ? <p className="ant-shake mb-2 rounded-2xl bg-rose-50 px-4 py-2 text-base font-semibold text-red-800">{error}</p> : null}
          <button type="button" onClick={finish} disabled={saving} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 text-lg font-bold text-white shadow-soft transition active:scale-[0.98] disabled:opacity-60">
            {saving ? "Guardando…" : `Terminé, guardar en ${dateLabel}`}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

function RoutineCard({
  routine,
  index,
  avoid,
  matches,
  favorite,
  featured,
  onStart,
  onFavorite
}: {
  routine: Routine;
  index: number;
  avoid: string | null;
  matches?: string[];
  favorite: boolean;
  featured?: boolean;
  onStart: () => void;
  onFavorite: () => void;
}) {
  const [open, setOpen] = useState(false);
  const intensity = INTENSITY[routine.intensity];
  return (
    <li className={`ant-rise overflow-hidden rounded-3xl border-2 bg-white ${featured ? "border-teal-500" : avoid ? "border-rose-200" : "border-black/10"}`} style={{ "--i": index } as CSSProperties}>
      <div className="flex items-start gap-2 p-3">
        <span className={`ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${featured ? "bg-teal-700 text-white" : "bg-teal-50 text-teal-800"}`} aria-hidden="true">
          {routine.activityType === "caminata" ? <Footprints className="pln-updown h-7 w-7" /> : routine.activityType === "ejercicios_casa" ? <Dumbbell className="pln-updown h-7 w-7" /> : <Activity className="pln-updown h-7 w-7" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{routine.name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge className={intensity.chip}>
              <Bars level={intensity.level} />
              {intensity.label}
            </Badge>
            <Badge className="bg-slate-100 text-slate-800">{routineMinutes(routine)} min</Badge>
            <Badge className="bg-slate-100 text-slate-800">{routine.days}</Badge>
          </div>
        </div>
        <button type="button" onClick={onFavorite} aria-pressed={favorite} aria-label={`${routine.name} en mis favoritas`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition active:scale-90">
          <Star key={String(favorite)} className={`h-7 w-7 ${favorite ? "ant-star fill-amber-400 text-amber-600" : "text-slate-400"}`} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 px-3" aria-label="Dónde hacerla">
        {routine.places.map((place) => {
          const Icon = PLACE_ICON[place];
          return (
            <span key={place} className="flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-sm font-semibold text-sky-900">
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {PLACE_LABEL[place]}
            </span>
          );
        })}
      </div>

      {avoid ? (
        <p className="mx-3 mt-2 flex items-start gap-2 rounded-2xl bg-rose-50 p-2.5 text-sm font-semibold leading-5 text-rose-900">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          No es la mejor opción ({avoid}). Pregunta a tu médico.
        </p>
      ) : matches && matches.length > 0 ? (
        <p className="mx-3 mt-2 flex items-start gap-2 rounded-2xl bg-violet-50 p-2.5 text-sm font-semibold leading-5 text-violet-950">
          <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0">Ideal para: {matches.join(", ").toLowerCase()}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5 px-3 pt-2">
        {routine.goals.slice(0, 4).map((goal) => (
          <span key={goal} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-sm font-semibold text-amber-950">
            {GOAL_LABEL[goal]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2 p-3">
        <button type="button" onClick={onStart} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-teal-700 px-3 py-2 text-base font-bold text-white shadow-soft transition active:scale-95">
          <Play className="h-5 w-5 shrink-0" aria-hidden="true" />
          Empezar
        </button>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-12 items-center justify-center rounded-full border-2 border-black/10 bg-white px-3 py-2 text-base font-semibold text-ink transition active:scale-95">
          {open ? "Ocultar pasos" : "Ver pasos"}
        </button>
      </div>
      <Expand open={open}>
        <ol className="space-y-1.5 px-3 pb-3">
          {routine.steps.map((step, stepIndex) => (
            <li key={step.name} className="flex gap-2 rounded-2xl bg-teal-50 p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white" aria-hidden="true">
                {stepIndex + 1}
              </span>
              <span className="min-w-0 text-base leading-5 text-ink">
                <span className="font-bold">
                  {step.name} · {step.minutes} min.
                </span>{" "}
                {step.how}
              </span>
            </li>
          ))}
          {routine.caution ? <li className="rounded-2xl bg-amber-50 p-2.5 text-sm font-semibold leading-5 text-amber-950">{routine.caution}</li> : null}
        </ol>
      </Expand>
    </li>
  );
}

// Fila de botones que se desliza hacia los lados, con su título de color.
function ScrollRow({ label, icon, color, children }: { label: string; icon: ReactNode; color: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <p className={`mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide ${color}`}>
        {icon}
        {label}
      </p>
      <div className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-2 [mask-image:linear-gradient(to_right,transparent,#000_1rem,#000_calc(100%-1.5rem),transparent)] [scrollbar-width:thin]">
        {children}
      </div>
    </div>
  );
}

function Count({ value }: { value: number }) {
  return <span className="rounded-full bg-black/10 px-1.5 text-sm font-bold tabular-nums">{value}</span>;
}

function GroupTitle({ icon, children, color }: { icon: ReactNode; children: ReactNode; color: string }) {
  return (
    <p className={`mb-1.5 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide ${color}`}>
      {icon}
      {children}
    </p>
  );
}

// Armador de combinaciones: edad (con dibujos), sexo y enfermedades con palomita.
function ComboBuilder({ combo, mine, onChange, onMine }: { combo: Combo; mine: boolean; onChange: (combo: Combo) => void; onMine: () => void }) {
  const [open, setOpen] = useState(false);
  const pregnancyAllowed = combo.sex !== "male" && combo.age !== "nino" && combo.age !== "mayor";

  const setAge = (age: Combo["age"]) => {
    const next = { ...combo, age: combo.age === age ? null : age };
    if (next.age === "nino" || next.age === "mayor") next.conditions = next.conditions.filter((key) => key !== "embarazo");
    onChange(next);
  };
  const setSex = (sex: Combo["sex"]) => {
    const next = { ...combo, sex: combo.sex === sex ? null : sex };
    if (next.sex === "male") next.conditions = next.conditions.filter((key) => key !== "embarazo");
    onChange(next);
  };
  const toggle = (key: ConditionKey) => {
    if (combo.conditions.includes(key)) {
      onChange({ ...combo, conditions: combo.conditions.filter((item) => item !== key) });
      return;
    }
    // Sobrepeso y obesidad no van juntos.
    const rest = combo.conditions.filter((item) => !(key === "obesidad" && item === "sobrepeso") && !(key === "sobrepeso" && item === "obesidad"));
    onChange({ ...combo, conditions: [...rest, key] });
  };

  const ageInfo = AGE_GROUPS.find((item) => item.key === combo.age);
  const summary = [
    ageInfo?.label.toLowerCase(),
    combo.sex === "female" ? "mujer" : combo.sex === "male" ? "hombre" : null,
    combo.conditions.length > 0 ? `con ${combo.conditions.map((key) => AUDIENCE_LABEL[key].toLowerCase()).join(", ")}` : null
  ].filter(Boolean);

  return (
    <section className="ant-rise overflow-hidden rounded-[1.75rem] border-2 border-violet-200 bg-white/95 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-violet-700 to-fuchsia-700 px-4 py-3 text-white">
        <h4 className="flex items-center gap-2 text-lg font-bold">
          <Users className="h-6 w-6 shrink-0" aria-hidden="true" />
          ¿Para quién?
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={onMine} aria-pressed={mine} className={`flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-bold transition active:scale-95 ${mine ? "bg-white text-violet-900" : "bg-white/20 text-white"}`}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Mis datos
          </button>
          <button type="button" onClick={() => onChange({ age: null, sex: null, conditions: [] })} className="flex min-h-10 items-center gap-1 rounded-full bg-white/20 px-3 text-sm font-bold text-white transition active:scale-95">
            <Eraser className="h-4 w-4" aria-hidden="true" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div role="group" aria-label="Edad">
          <GroupTitle color="text-violet-800" icon={<UserRound className="h-4 w-4" aria-hidden="true" />}>
            Edad
          </GroupTitle>
          <div className="grid grid-cols-4 gap-2">
            {AGE_GROUPS.map((item, index) => {
              const on = combo.age === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAge(item.key)}
                  aria-pressed={on}
                  aria-label={`${item.label}, ${item.hint.toLowerCase()}`}
                  title={`${item.label} · ${item.hint}`}
                  className={`ant-pop relative aspect-square rounded-2xl border-2 p-1 transition active:scale-90 ${on ? "border-violet-600 bg-violet-100 shadow-soft" : "border-black/10 bg-violet-50/40 grayscale-[35%]"}`}
                  style={{ "--i": index } as CSSProperties}
                >
                  <span key={String(on)} className={`block h-full w-full ${on ? "ant-pop" : ""}`}>
                    <AgeArt group={item.key} />
                  </span>
                  {on ? (
                    <span className="ant-pop absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-violet-700 text-white shadow" aria-hidden="true">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p key={combo.age ?? "none"} className="ant-pop mt-1.5 text-center text-sm font-semibold text-violet-900">
            {ageInfo ? `${ageInfo.label} · ${ageInfo.hint}` : "Toca un dibujo para elegir la edad"}
          </p>
        </div>

        <div role="group" aria-label="Sexo">
          <GroupTitle color="text-pink-800" icon={<Venus className="h-4 w-4" aria-hidden="true" />}>
            Sexo
          </GroupTitle>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "female", label: "Mujer", Icon: Venus, on: "border-pink-600 bg-pink-600 text-white", off: "border-pink-200 bg-pink-50 text-pink-950" },
              { key: "male", label: "Hombre", Icon: Mars, on: "border-sky-700 bg-sky-700 text-white", off: "border-sky-200 bg-sky-50 text-sky-950" }
            ] as const).map(({ key, label, Icon, on, off }) => (
              <button key={key} type="button" onClick={() => setSex(key)} aria-pressed={combo.sex === key} className={`flex min-h-14 flex-wrap items-center justify-center gap-x-2 rounded-2xl border-2 px-2 py-1.5 text-lg font-bold leading-6 transition active:scale-95 ${combo.sex === key ? on : off}`}>
                <Icon key={String(combo.sex === key)} className={`h-6 w-6 shrink-0 ${combo.sex === key ? "ant-pop" : ""}`} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <GroupTitle color="text-rose-800" icon={<Stethoscope className="h-4 w-4" aria-hidden="true" />}>
            Salud
          </GroupTitle>
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-14 w-full flex-wrap items-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-left transition active:scale-[0.98]">
            <span className="min-w-[8rem] flex-1 text-base font-bold leading-5 text-rose-950">Enfermedades y condiciones</span>
            <span className="ml-auto flex shrink-0 items-center gap-2">
              <span key={combo.conditions.length} className={`ant-pop rounded-full px-2.5 py-0.5 text-sm font-bold ${combo.conditions.length > 0 ? "bg-rose-700 text-white" : "bg-white text-muted"}`}>
                {combo.conditions.length > 0 ? `${combo.conditions.length} marcada${combo.conditions.length === 1 ? "" : "s"}` : "Ninguna"}
              </span>
              <ChevronDown className="ant-chevron h-6 w-6 shrink-0 text-rose-900" aria-hidden="true" />
            </span>
          </button>

          {!open && combo.conditions.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Condiciones marcadas">
              {combo.conditions.map((key) => (
                <li key={key} className="ant-pop">
                  <button type="button" onClick={() => toggle(key)} aria-label={`Quitar ${AUDIENCE_LABEL[key]}`} className="flex min-h-9 items-center gap-1 rounded-full bg-rose-100 py-1 pl-3 pr-2 text-sm font-semibold text-rose-950 transition active:scale-95">
                    {AUDIENCE_LABEL[key]}
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <Expand open={open}>
            <div className="space-y-3 pt-3">
              {CONDITION_GROUPS.map((group) => {
                const items = group.items.filter((item) => item.key !== "embarazo" || pregnancyAllowed);
                return (
                  <fieldset key={group.title}>
                    <legend className="mb-1.5 text-sm font-bold text-muted">{group.title}</legend>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {items.map((item) => {
                        const checked = combo.conditions.includes(item.key);
                        return (
                          <label key={item.key} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 p-2.5 transition active:scale-[0.98] ${checked ? "border-rose-500 bg-rose-50" : "border-black/10 bg-white"}`}>
                            <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggle(item.key)} />
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-rose-300 ${checked ? "border-rose-700 bg-rose-700 text-white" : "border-slate-300 bg-white"}`} aria-hidden="true">
                              {checked ? <Check className="ant-pop h-5 w-5" strokeWidth={3} /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-base font-semibold leading-5 text-ink">{item.label}</span>
                              <span className="block text-sm leading-5 text-muted">{item.hint}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
              <p className="text-sm leading-5 text-muted">Marca todas las que apliquen: puedes combinar las que quieras.</p>
              <button type="button" onClick={() => setOpen(false)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rose-700 px-4 text-base font-bold text-white transition active:scale-95">
                <Check className="h-5 w-5" aria-hidden="true" />
                Listo
              </button>
            </div>
          </Expand>
        </div>

        <p key={summary.join("|")} className="ant-pop rounded-2xl bg-violet-50 p-3 text-base font-semibold leading-6 text-violet-950" aria-live="polite">
          {summary.length > 0 ? `Rutinas para: ${summary.join(" · ")}.` : "Sin datos elegidos: verás todas las rutinas."}
        </p>
      </div>
    </section>
  );
}

function Recommended({ profile, weekMinutes, dateLabel, onAdd }: { profile: ExerciseProfile; weekMinutes: number; dateLabel: string; onAdd: (input: { activity_type: string; minutes: number; notes: string }) => Promise<void> }) {
  const { combo: myCombo, audiences, needs, list } = useMemo(() => recommendedFor(profile), [profile]);
  const [combo, setCombo] = useState<Combo>(myCombo);
  const [topPlace, setTopPlace] = useState<Place | "all">("all");
  const [place, setPlace] = useState<Place | "all">("all");
  const [goal, setGoal] = useState<GoalKey | "all">("all");
  const [intensity, setIntensity] = useState<Intensity | "all">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [avoidOpen, setAvoidOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [session, setSession] = useState<Routine | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [cheer, setCheer] = useState(0);
  const { toastElement, showToast } = useToast();

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      if (Array.isArray(saved)) setFavorites(saved.filter((item) => typeof item === "string"));
    } catch {
      // Sin almacenamiento, las favoritas valen mientras la página esté abierta.
    }
  }, []);

  const comboAudiences = useMemo(() => audiencesOfCombo(combo), [combo]);
  const ranked = useMemo(() => rankFor(comboAudiences, combo.age), [comboAudiences, combo.age]);
  const signature = `${combo.age}-${combo.sex}-${combo.conditions.join(".")}-${place}-${goal}-${intensity}-${onlyFavorites}`;

  useEffect(() => {
    setShown(PAGE);
  }, [signature]);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    showToast(favorites.includes(id) ? "Quitada de tus favoritas" : "¡Guardada en tus favoritas!");
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      // Ver arriba.
    }
  };

  const top = list.filter((routine) => topPlace === "all" || routine.places.includes(topPlace)).slice(0, 3);
  const plan = weekPlan(list, audiences);
  const planMinutes = plan.reduce((sum, routine) => sum + (routine ? routineMinutes(routine) : 0), 0);
  const gentle = audiences.includes("mayores") || audiences.includes("corazon") || audiences.includes("obesidad") || profile.critical;

  // Explorador: la base es la combinación elegida (o tus favoritas) y encima van los filtros.
  const base = onlyFavorites ? ROUTINES.filter((routine) => favorites.includes(routine.id)) : ranked.list;
  const pass = (routine: Routine, p = place, g = goal, i = intensity) => (p === "all" || routine.places.includes(p)) && (g === "all" || routine.goals.includes(g)) && (i === "all" || routine.intensity === i);
  const results = base.filter((routine) => pass(routine));
  const avoidedShown = onlyFavorites ? [] : ranked.avoided.filter((routine) => pass(routine));
  const filtersOn = place !== "all" || goal !== "all" || intensity !== "all";

  const facts: string[] = [];
  if (profile.age !== null) facts.push(`${profile.age} años`);
  if (profile.sex) facts.push(profile.sex === "female" ? "Mujer" : profile.sex === "male" ? "Hombre" : "Otro");
  if (profile.bmi !== null) facts.push(`IMC ${profile.bmi.toLocaleString("es-ES", { maximumFractionDigits: 1 })}`);
  if (profile.ldl) facts.push(`LDL: ${getStatusLabel(profile.ldl).toLowerCase()}`);
  if (profile.tg) facts.push(`Triglicéridos: ${getStatusLabel(profile.tg).toLowerCase()}`);
  if (profile.hdl) facts.push(`HDL: ${getStatusLabel(profile.hdl).toLowerCase()}`);
  facts.push(...profile.conditionLabels);
  const missing = [profile.age === null ? "edad" : null, profile.sex === null ? "sexo" : null, profile.bmi === null ? "peso y estatura" : null].filter(Boolean);

  const alerts: { icon: ReactNode; text: string; tone: string }[] = [];
  if (audiences.includes("corazon")) alerts.push({ icon: <HeartPulse className="h-5 w-5 shrink-0" aria-hidden="true" />, text: "Por tu enfermedad del corazón, pide autorización a tu médico antes de empezar o aumentar cualquier rutina.", tone: "bg-red-50 text-red-900" });
  if (profile.critical) alerts.push({ icon: <Siren className="h-5 w-5 shrink-0" aria-hidden="true" />, text: "Tienes un valor crítico: consulta a tu médico antes de aumentar tu actividad.", tone: "bg-red-50 text-red-900" });
  if (audiences.includes("asma")) alerts.push({ icon: <Info className="h-5 w-5 shrink-0" aria-hidden="true" />, text: "Lleva tu inhalador, calienta más tiempo y evita el frío, el humo y el polvo.", tone: "bg-sky-50 text-sky-950" });
  if (audiences.includes("diabetes")) alerts.push({ icon: <Info className="h-5 w-5 shrink-0" aria-hidden="true" />, text: "Revisa tu glucosa y lleva algo dulce por si te baja durante el ejercicio.", tone: "bg-sky-50 text-sky-950" });
  if (audiences.includes("presion")) alerts.push({ icon: <Info className="h-5 w-5 shrink-0" aria-hidden="true" />, text: "Evita cargar mucho peso y no aguantes la respiración al hacer fuerza.", tone: "bg-sky-50 text-sky-950" });
  if (audiences.includes("articulaciones")) alerts.push({ icon: <Info className="h-5 w-5 shrink-0" aria-hidden="true" />, text: "Prefiere el agua, la bicicleta y los estiramientos; evita saltos y golpes.", tone: "bg-sky-50 text-sky-950" });

  const pill = "flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-base font-semibold transition active:scale-95 disabled:opacity-40";

  return (
    <div className="relative space-y-4">
      {cheer ? <Confetti key={cheer} /> : null}

      <Hero
        tone="teal"
        art={<RunningPerson className="h-full w-full" />}
        title="Rutinas para ti"
        text={gentle ? "Elegidas para moverte con cuidado y a tu ritmo." : "Elegidas según tu edad, tus valores y tu salud."}
        stats={[
          { label: "Meta en min", value: profile.goalMinutes },
          { label: "Hechos", value: weekMinutes },
          { label: "Para ti", value: list.length }
        ]}
      />

      <section className="ant-rise ab-card rounded-[1.75rem] p-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <UserRound className="h-5 w-5 text-teal-700" aria-hidden="true" />
          Tu perfil
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {facts.map((fact, index) => (
            <span key={fact} className="ant-pop rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-ink" style={{ "--i": index } as CSSProperties}>
              {fact}
            </span>
          ))}
        </div>
        {audiences.length > 0 ? (
          <p className="mt-2 text-base leading-6 text-ink">
            <span className="font-bold">Rutinas pensadas para: </span>
            {audiences.map((key) => AUDIENCE_LABEL[key].toLowerCase()).join(", ")}.
          </p>
        ) : null}
        {needs.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {needs.map((key) => (
              <span key={key} className="rounded-full bg-teal-100 px-3 py-1 text-sm font-bold text-teal-900">
                {GOAL_LABEL[key]}
              </span>
            ))}
          </div>
        ) : null}
        {missing.length > 0 ? (
          <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950">
            Completa tu {missing.join(", ")} en «Mis datos» (tu inicial, arriba a la derecha) para recomendaciones más precisas.
          </p>
        ) : null}
      </section>

      {alerts.length > 0 ? (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <p key={alert.text} className={`ant-rise flex items-start gap-2 rounded-2xl p-3 text-base font-semibold leading-5 ${alert.tone}`} style={{ "--i": index } as CSSProperties}>
              {alert.icon}
              <span className="min-w-0">{alert.text}</span>
            </p>
          ))}
        </div>
      ) : null}

      <section aria-label="Mejores rutinas para ti" className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Sparkles className="h-5 w-5 text-amber-600" aria-hidden="true" />
          Las mejores para ti
        </h3>
        <ScrollRow label="¿Dónde estás ahora?" color="text-sky-800" icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
          {[{ key: "all" as const, label: "Donde sea", Icon: Sparkles }, ...PLACES.map((item) => ({ ...item, Icon: PLACE_ICON[item.key] }))].map(({ key, label, Icon }) => (
            <button key={key} type="button" onClick={() => setTopPlace(key)} aria-pressed={topPlace === key} className={`${pill} ${topPlace === key ? "border-sky-700 bg-sky-700 text-white" : "border-sky-200 bg-white text-sky-950"}`}>
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </ScrollRow>
        {top.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-center text-base font-semibold text-muted">No hay rutinas para este lugar con tus datos.</p>
        ) : (
          <ul key={topPlace} className="grid gap-3 lg:grid-cols-3 lg:items-start">
            {top.map((routine, index) => (
              <RoutineCard key={routine.id} routine={routine} index={index} featured avoid={null} matches={matchesOf(routine, audiences)} favorite={favorites.includes(routine.id)} onStart={() => setSession(routine)} onFavorite={() => toggleFavorite(routine.id)} />
            ))}
          </ul>
        )}
      </section>

      <section className="ant-rise ab-card rounded-[1.75rem] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-ink">Tu semana sugerida</h3>
          <span className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${planMinutes >= profile.goalMinutes ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>
            {planMinutes} de {profile.goalMinutes} min
          </span>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1" role="group" aria-label="Días de la semana sugerida">
          {plan.map((routine, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedDay(selectedDay === index ? null : index)}
              aria-pressed={selectedDay === index}
              aria-label={`${WEEK_NAMES[index]}: ${routine ? routine.name : "descanso"}`}
              className={`ant-pop flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 text-base font-bold transition active:scale-90 ${selectedDay === index ? "border-teal-700 bg-teal-700 text-white" : routine ? "border-teal-200 bg-teal-50 text-teal-950" : "border-black/10 bg-slate-100 text-muted"}`}
              style={{ "--i": index } as CSSProperties}
            >
              {WEEK[index]}
              <span className="text-xs font-semibold">{routine ? routineMinutes(routine) : "—"}</span>
            </button>
          ))}
        </div>
        {selectedDay !== null ? (
          <div key={selectedDay} className="ant-pop mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-teal-50 p-3">
            <p className="min-w-0 text-base font-bold leading-5 text-teal-950">
              {WEEK_NAMES[selectedDay]}: {plan[selectedDay] ? `${plan[selectedDay]!.name}, ${routineMinutes(plan[selectedDay]!)} min` : "día de descanso. Puedes estirar un poco."}
            </p>
            {plan[selectedDay] ? (
              <button type="button" onClick={() => setSession(plan[selectedDay])} className="flex min-h-11 items-center gap-1.5 rounded-full bg-teal-700 px-4 text-base font-bold text-white transition active:scale-95">
                <Play className="h-5 w-5" aria-hidden="true" />
                Empezar
              </button>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-5 text-muted">Toca un día para ver su rutina.</p>
        )}
      </section>

      <section aria-label="Explorar rutinas" className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Sparkles className="h-5 w-5 text-violet-700" aria-hidden="true" />
          Explorar rutinas
        </h3>

        <ComboBuilder combo={combo} mine={sameCombo(combo, myCombo)} onChange={setCombo} onMine={() => setCombo(myCombo)} />

        <section className="ant-rise ab-card space-y-3 rounded-[1.75rem] p-4" aria-label="Filtros">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-lg font-bold text-ink">
              <SlidersHorizontal className="h-5 w-5 text-slate-700" aria-hidden="true" />
              Filtrar
            </h4>
            {filtersOn ? (
              <button
                type="button"
                onClick={() => {
                  setPlace("all");
                  setGoal("all");
                  setIntensity("all");
                }}
                className="ant-pop flex min-h-10 items-center gap-1 rounded-full bg-slate-100 px-3 text-sm font-bold text-ink transition active:scale-95"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Quitar filtros
              </button>
            ) : null}
          </div>

          <ScrollRow label="Lugar" color="text-sky-800" icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
            {[{ key: "all" as const, label: "Todos", Icon: Sparkles }, ...PLACES.map((item) => ({ ...item, Icon: PLACE_ICON[item.key] }))].map(({ key, label, Icon }) => {
              const count = base.filter((routine) => pass(routine, key)).length;
              return (
                <button key={key} type="button" onClick={() => setPlace(key)} disabled={count === 0 && place !== key} aria-pressed={place === key} className={`${pill} rounded-2xl ${place === key ? "border-sky-700 bg-sky-700 text-white" : "border-sky-200 bg-sky-50 text-sky-950"}`}>
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {label}
                  <Count value={count} />
                </button>
              );
            })}
          </ScrollRow>

          <ScrollRow label="Objetivo" color="text-amber-800" icon={<Target className="h-4 w-4" aria-hidden="true" />}>
            {[{ key: "all" as const, label: "Cualquiera" }, ...GOALS].map((item) => {
              const count = base.filter((routine) => pass(routine, place, item.key)).length;
              return (
                <button key={item.key} type="button" onClick={() => setGoal(item.key)} disabled={count === 0 && goal !== item.key} aria-pressed={goal === item.key} className={`${pill} ${goal === item.key ? "border-amber-700 bg-amber-700 text-white" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
                  <Target className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                  <Count value={count} />
                </button>
              );
            })}
          </ScrollRow>

          <ScrollRow label="Intensidad" color="text-emerald-800" icon={<Gauge className="h-4 w-4" aria-hidden="true" />}>
            {(["all", "suave", "moderada", "vigorosa"] as const).map((key) => {
              const count = base.filter((routine) => pass(routine, place, goal, key)).length;
              const style = key === "all" ? { on: "border-slate-700 bg-slate-700 text-white", off: "border-slate-200 bg-slate-50 text-ink" } : INTENSITY[key];
              return (
                <button key={key} type="button" onClick={() => setIntensity(key)} disabled={count === 0 && intensity !== key} aria-pressed={intensity === key} className={`${pill} ${intensity === key ? style.on : style.off}`}>
                  {key === "all" ? <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" /> : <Bars level={INTENSITY[key].level} />}
                  {key === "all" ? "Cualquiera" : INTENSITY[key].label}
                  <Count value={count} />
                </button>
              );
            })}
          </ScrollRow>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p key={results.length} className="ant-pop text-base font-bold text-ink" aria-live="polite">
            {results.length} {results.length === 1 ? "rutina" : "rutinas"} {onlyFavorites ? "favoritas" : "recomendadas"}
          </p>
          <button type="button" onClick={() => setOnlyFavorites(!onlyFavorites)} aria-pressed={onlyFavorites} className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 text-base font-semibold transition active:scale-95 ${onlyFavorites ? "border-amber-600 bg-amber-100 text-amber-950" : "border-black/10 bg-white text-ink"}`}>
            <Star className={`h-5 w-5 ${onlyFavorites ? "fill-amber-400 text-amber-600" : ""}`} aria-hidden="true" />
            Solo favoritas {favorites.length}
          </button>
        </div>

        {results.length === 0 ? (
          <div className="ant-pop rounded-2xl bg-white p-4 text-center">
            <p className="text-base font-semibold text-muted">{onlyFavorites && favorites.length === 0 ? "Toca la estrella de una rutina para guardarla aquí." : "Ninguna rutina cumple todos los filtros."}</p>
            {filtersOn ? (
              <button
                type="button"
                onClick={() => {
                  setPlace("all");
                  setGoal("all");
                  setIntensity("all");
                }}
                className="mx-auto mt-2 flex min-h-11 items-center gap-1 rounded-full bg-teal-700 px-4 text-base font-bold text-white transition active:scale-95"
              >
                Quitar filtros
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <ul key={signature} className="grid gap-3 lg:grid-cols-2 lg:items-start">
              {results.slice(0, shown).map((routine, index) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  index={index % PAGE}
                  avoid={avoidReason(routine, comboAudiences)}
                  matches={matchesOf(routine, comboAudiences)}
                  favorite={favorites.includes(routine.id)}
                  onStart={() => setSession(routine)}
                  onFavorite={() => toggleFavorite(routine.id)}
                />
              ))}
            </ul>
            {results.length > shown ? (
              <button type="button" onClick={() => setShown(shown + PAGE)} className="mx-auto flex min-h-12 items-center gap-2 rounded-full border-2 border-teal-600 bg-white px-5 text-base font-bold text-teal-900 transition active:scale-95">
                <Plus className="h-5 w-5" aria-hidden="true" />
                Ver más ({results.length - shown})
              </button>
            ) : null}
          </>
        )}

        {avoidedShown.length > 0 ? (
          <div className="rounded-[1.75rem] border-2 border-rose-200 bg-white/90">
            <button type="button" onClick={() => setAvoidOpen(!avoidOpen)} aria-expanded={avoidOpen} className="flex min-h-14 w-full items-center gap-2 px-4 py-2 text-left">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-700" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-base font-bold leading-5 text-rose-950 [overflow-wrap:anywhere]">No recomendadas para esta combinación ({avoidedShown.length})</span>
              <ChevronDown className="ant-chevron h-6 w-6 shrink-0 text-rose-900" aria-hidden="true" />
            </button>
            <Expand open={avoidOpen}>
              <ul className="space-y-1.5 px-4 pb-4">
                {avoidedShown.map((routine) => (
                  <li key={routine.id} className="rounded-2xl bg-rose-50 p-2.5 text-base leading-5">
                    <span className="font-bold text-ink">{routine.name}</span>
                    <span className="block text-sm font-semibold text-rose-900">Por: {avoidReason(routine, comboAudiences)}</span>
                  </li>
                ))}
              </ul>
            </Expand>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="ab-card rounded-[1.75rem] p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
            <MessageCircle className="h-5 w-5 text-teal-700" aria-hidden="true" />
            ¿Vas al ritmo correcto?
          </h3>
          <ul className="mt-2 space-y-1.5 text-base leading-5">
            <li className="rounded-2xl bg-sky-50 p-2.5"><span className="font-bold">Puedes cantar:</span> vas suave, ideal para empezar.</li>
            <li className="rounded-2xl bg-emerald-50 p-2.5"><span className="font-bold">Puedes conversar:</span> ritmo moderado, el mejor para tu colesterol.</li>
            <li className="rounded-2xl bg-amber-50 p-2.5"><span className="font-bold">Te cuesta hablar:</span> baja el ritmo.</li>
          </ul>
        </section>
        <section className="rounded-[1.75rem] border-2 border-red-300 bg-red-50 p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-red-950">
            <Siren className="h-5 w-5" aria-hidden="true" />
            Detente si sientes
          </h3>
          <p className="mt-2 text-base leading-6 text-red-950">Dolor o presión en el pecho, mucha falta de aire, mareo, desmayo o latidos muy irregulares. Si no pasa al descansar, busca emergencia.</p>
        </section>
      </div>
      <p className="text-xs leading-5 text-muted">Recomendaciones generales según tus datos. No reemplazan la indicación de tu médico.</p>

      {session ? (
        <SessionDialog
          routine={session}
          dateLabel={dateLabel}
          onClose={() => setSession(null)}
          onSave={async (minutes) => {
            await onAdd({ activity_type: session.activityType, minutes, notes: session.name });
            setSession(null);
            setCheer(Date.now());
            showToast(`¡Muy bien! Guardaste ${minutes} min`);
          }}
        />
      ) : null}
      {toastElement}
    </div>
  );
}


export function ActivityHub({
  profile,
  myActivities,
  weekMinutes,
  dateLabel,
  onAdd
}: {
  profile: ExerciseProfile | null;
  myActivities: ReactNode;
  weekMinutes: number;
  dateLabel: string;
  onAdd: (input: { activity_type: string; minutes: number; notes: string }) => Promise<void>;
}) {
  const [view, setView] = useState<View>("mine");
  const topRef = useRef<HTMLDivElement>(null);

  const change = (next: View) => {
    setView(next);
    const box = topRef.current;
    if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  const tabButton = (value: View, label: string, icon: ReactNode) => (
    <button
      type="button"
      onClick={() => change(value)}
      aria-pressed={view === value}
      className={`flex min-h-12 items-center justify-center gap-1.5 rounded-full px-2 py-2 hab-toggle-text font-semibold leading-5 transition active:scale-95 ${view === value ? "bg-accent text-white shadow-soft" : "text-ink"}`}
    >
      {icon}
      <span className="min-w-0">{label}</span>
    </button>
  );

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-4">
      {/* Los botones quedan fijos debajo de la barra superior al bajar */}
      <div className="sticky top-[calc(4.25rem+1px)] z-20 -mx-4 bg-[#fff1f3]/90 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="ab-card grid grid-cols-2 gap-1 rounded-full p-1.5" role="group" aria-label="Tipo de actividad">
          {tabButton("mine", "Mis actividades", <Activity className="hidden h-5 w-5 shrink-0 min-[400px]:block" aria-hidden="true" />)}
          {tabButton("recommended", "Recomendadas", <Sparkles className="hidden h-5 w-5 shrink-0 min-[400px]:block" aria-hidden="true" />)}
        </div>
      </div>

      {view === "mine" ? (
        <div key="mine" className="ant-rise">
          {myActivities}
        </div>
      ) : profile ? (
        <div key="recommended">
          <Recommended profile={profile} weekMinutes={weekMinutes} dateLabel={dateLabel} onAdd={onAdd} />
        </div>
      ) : (
        <p className="rounded-2xl bg-white p-4 text-center text-base font-semibold text-muted">Inicia sesión para ver tus rutinas recomendadas.</p>
      )}
    </div>
  );
}
