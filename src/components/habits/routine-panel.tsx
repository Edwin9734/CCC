"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  BookOpen,
  Briefcase,
  Candy,
  Check,
  Cigarette,
  Coffee,
  Dices,
  Flower2,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  LockKeyhole,
  Minus,
  Music,
  Palette,
  PenLine,
  Phone,
  Pill,
  Plus,
  Puzzle,
  ShieldAlert,
  Smartphone,
  Sun,
  Syringe,
  Tv,
  Users,
  Wind,
  Wine,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import { Butterfly, GrowingPlant, ReadingBook } from "@/components/habits/routine-art";
import { Confetti, MiniBars } from "@/components/habits/habit-visuals";
import { SectionCard } from "@/components/section-card";
import { telHref, type ContactsInfo } from "@/lib/contacts";
import { addDays, isoWeekday } from "@/lib/date-utils";
import { WEEKDAY_LETTERS, WEEKDAY_NAMES } from "@/lib/habits-insights";
import {
  HEALTHY_ITEMS,
  ROUTINE_MAX_AMOUNT,
  VICE_INFO,
  VICE_ITEMS,
  amountOn,
  daysFree,
  encouragementFor,
  formatAmount,
  goalWeek,
  healthyMinutesOn,
  phraseOfDay,
  plantStage,
  routineItem,
  suggestPositive,
  type GoalMode,
  type RoutineEntries,
  type RoutineGoal,
  type RoutineItem
} from "@/lib/routine-config";

const ITEM_VISUALS: Record<string, { icon: LucideIcon; color: string }> = {
  lectura: { icon: BookOpen, color: "bg-violet-600" },
  meditacion: { icon: Flower2, color: "bg-pink-600" },
  escritura: { icon: PenLine, color: "bg-indigo-600" },
  trabajo: { icon: Briefcase, color: "bg-slate-600" },
  oracion: { icon: HandHeart, color: "bg-amber-600" },
  musica: { icon: Music, color: "bg-rose-600" },
  manualidades: { icon: Palette, color: "bg-orange-600" },
  juegos_mente: { icon: Puzzle, color: "bg-cyan-600" },
  familia: { icon: Users, color: "bg-emerald-600" },
  aire_libre: { icon: Sun, color: "bg-yellow-600" },
  voluntariado: { icon: HeartHandshake, color: "bg-red-600" },
  aprender: { icon: GraduationCap, color: "bg-sky-600" },
  fumar: { icon: Cigarette, color: "bg-slate-500" },
  alcohol: { icon: Wine, color: "bg-slate-500" },
  drogas: { icon: Syringe, color: "bg-slate-500" },
  energizantes: { icon: Zap, color: "bg-slate-500" },
  celular: { icon: Smartphone, color: "bg-slate-500" },
  television: { icon: Tv, color: "bg-slate-500" },
  cafe: { icon: Coffee, color: "bg-slate-500" },
  dulces: { icon: Candy, color: "bg-slate-500" },
  azar: { icon: Dices, color: "bg-slate-500" },
  automedicacion: { icon: Pill, color: "bg-slate-500" }
};

function visualOf(key: string) {
  return ITEM_VISUALS[key] ?? { icon: Check, color: "bg-slate-500" };
}

function dayWord(count: number) {
  return count === 1 ? "día" : "días";
}

function Stepper({
  item,
  amount,
  stacked = false,
  onChange
}: {
  item: RoutineItem;
  amount: number;
  stacked?: boolean;
  onChange: (amount: number) => void;
}) {
  const buttonClass =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-ink shadow-soft transition hover:bg-slate-50 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40";

  const value = (
    <p key={amount} className="hab-pop whitespace-nowrap text-center text-base font-semibold leading-6 text-ink">
      {formatAmount(item, amount)}
    </p>
  );

  const minus = (
    <button
      type="button"
      onClick={() => onChange(Math.max(0, amount - item.step))}
      disabled={amount <= 0}
      aria-label={`Quitar de ${item.label}`}
      className={buttonClass}
    >
      <Minus className="h-5 w-5" aria-hidden="true" />
    </button>
  );

  const plus = (
    <button
      type="button"
      onClick={() => onChange(Math.min(ROUTINE_MAX_AMOUNT, amount + item.step))}
      aria-label={`Agregar a ${item.label}`}
      className={buttonClass}
    >
      <Plus className="h-5 w-5" aria-hidden="true" />
    </button>
  );

  if (stacked) {
    return (
      <div className="grid gap-2">
        {value}
        <div className="flex flex-wrap justify-center gap-3">
          {minus}
          {plus}
        </div>
        {item.showHours ? (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, amount - 60))}
              disabled={amount <= 0}
              aria-label={`Quitar una hora de ${item.label}`}
              className="min-h-11 flex-1 rounded-full border border-black/10 bg-white px-2 py-1 text-sm font-semibold text-ink transition hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              −1 h
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.min(ROUTINE_MAX_AMOUNT, amount + 60))}
              disabled={amount >= ROUTINE_MAX_AMOUNT}
              aria-label={`Agregar una hora a ${item.label}`}
              className="min-h-11 flex-1 rounded-full bg-slate-600 px-2 py-1 text-sm font-semibold text-white transition hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +1 h
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {minus}
      {value}
      {plus}
    </div>
  );
}

const BREATHING_SECONDS = 60;

function BreathingExercise({
  replacement,
  onUseReplacement,
  onClose
}: {
  replacement: RoutineItem | null;
  onUseReplacement: () => void;
  onClose: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const finished = elapsed >= BREATHING_SECONDS;

  useEffect(() => {
    if (finished) return;
    const id = window.setTimeout(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearTimeout(id);
  }, [elapsed, finished]);

  return (
    <div className="mt-4 rounded-3xl bg-sky-50 p-4 text-center">
      {finished ? (
        <>
          <p className="text-xl font-semibold text-ink">¡Lo lograste!</p>
          <p className="mt-1 text-base leading-7 text-ink">
            Las ganas suelen pasar en unos minutos. Ahora haz algo que te haga bien.
          </p>
        </>
      ) : (
        <>
          <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
            <div className="hab-breath absolute inset-2 rounded-full bg-sky-400/40" aria-hidden="true" />
            <div className="hab-breath absolute inset-8 rounded-full bg-sky-500/50" aria-hidden="true" />
            <p aria-live="polite" className="relative text-2xl font-semibold text-sky-950">
              {elapsed % 10 < 4 ? "Inhala" : "Exhala"}
            </p>
          </div>
          <p className="text-sm font-semibold text-sky-900">Quedan {BREATHING_SECONDS - elapsed} segundos</p>
        </>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {finished && replacement ? (
          <button
            type="button"
            onClick={onUseReplacement}
            className="min-h-12 rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 active:scale-95"
          >
            Sumar {replacement.step} min de {replacement.label}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50 active:scale-95"
        >
          {finished ? "Cerrar" : "Terminar"}
        </button>
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  today,
  entries,
  lastUseBefore,
  onAddReplacement,
  onDelete
}: {
  goal: RoutineGoal;
  today: string;
  entries: RoutineEntries;
  lastUseBefore: string | null;
  onAddReplacement: (item: RoutineItem) => void;
  onDelete: () => Promise<void>;
}) {
  const [breathing, setBreathing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const item = routineItem(goal.item_key);
  if (!item) return null;

  const info = VICE_INFO[item.key];
  const replacement = goal.replacement_key ? (routineItem(goal.replacement_key) ?? null) : null;
  const free = daysFree(goal, today, entries, lastUseBefore);
  const week = goalWeek(goal, today, entries);
  const todayAmount = amountOn(entries, today, item.key);
  const limit = goal.daily_limit ?? 0;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      console.error("Error al terminar el plan:", err);
      setError("No se pudo terminar el plan. Inténtalo de nuevo.");
      setDeleting(false);
    }
  };

  return (
    <article className="hab-rise rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-3">
        <GrowingPlant stage={plantStage(goal, free, week)} className="h-28 w-auto shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            {goal.mode === "quit" ? `Dejar: ${item.label}` : `Reducir: ${item.label}`}
          </p>
          {goal.mode === "quit" ? (
            <>
              <p className="text-3xl font-semibold leading-9 text-ink">
                {free} {dayWord(free)}
              </p>
              <p className="text-sm font-semibold text-ink">sin registrar consumo</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-semibold leading-9 text-ink">
                {todayAmount} de {limit}
              </p>
              <p className="text-sm font-semibold text-ink">
                {item.unit} hoy · {todayAmount <= limit ? "dentro de tu límite" : "pasaste tu límite"}
              </p>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-base leading-7 text-ink">
        {goal.mode === "quit"
          ? encouragementFor(free)
          : todayAmount <= limit
            ? "Vas bien. Cada vez que te mantienes en tu límite, ganas tú."
            : "Un mal día no borra tu esfuerzo. Mañana empiezas de nuevo."}
      </p>

      <ul className="mt-3 grid grid-cols-7 gap-1">
        {week.map((day, index) => (
          <li
            key={day.date}
            aria-label={`${day.dayName}: ${
              day.state === "ok" ? "cumplido" : day.state === "over" ? "con consumo" : "antes del plan"
            }`}
            className="hab-pop flex flex-col items-center gap-1"
            style={{ "--i": index } as CSSProperties}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                day.state === "ok"
                  ? "bg-emerald-600 text-white"
                  : day.state === "over"
                    ? "bg-amber-400 text-amber-950"
                    : "bg-white text-black/25"
              }`}
              aria-hidden="true"
            >
              {day.state === "ok" ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            </span>
            <span className="text-xs font-semibold text-muted" aria-hidden="true">
              {day.letter}
            </span>
          </li>
        ))}
      </ul>

      {info ? (
        <div className="mt-3 rounded-2xl bg-white/80 p-3 text-sm leading-6 text-ink">
          <p className="font-semibold">{info.why}</p>
          <ul className="mt-1 list-disc pl-5">
            {info.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {breathing ? (
        <BreathingExercise
          replacement={replacement}
          onClose={() => setBreathing(false)}
          onUseReplacement={() => {
            if (replacement) onAddReplacement(replacement);
            setBreathing(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setBreathing(true)}
          className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-sky-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-sky-800 active:scale-[0.98]"
        >
          <Wind className="h-5 w-5" aria-hidden="true" />
          Tengo ganas: respirar 1 minuto
        </button>
      )}

      {replacement && !breathing ? (
        <button
          type="button"
          onClick={() => onAddReplacement(replacement)}
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-violet-300 bg-white px-5 py-3 text-sm font-semibold text-violet-900 transition hover:bg-violet-50 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          En su lugar: {replacement.step} min de {replacement.label}
        </button>
      ) : null}

      {error ? <p className="mt-2 text-sm font-semibold text-danger">{error}</p> : null}

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="min-h-11 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {deleting ? "Terminando..." : "Sí, terminar el plan"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink"
            >
              Seguir con el plan
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-muted underline"
          >
            Terminar este plan
          </button>
        )}
      </div>
    </article>
  );
}

function GoalForm({
  item,
  amountToday,
  onCreate,
  onCancel
}: {
  item: RoutineItem;
  amountToday: number;
  onCreate: (input: { mode: GoalMode; daily_limit: number | null; replacement_key: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<GoalMode>("quit");
  const [limit, setLimit] = useState(Math.max(item.step, amountToday > item.step ? amountToday - item.step : item.step));
  const [replacement, setReplacement] = useState(HEALTHY_ITEMS[0].key);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onCreate({ mode, daily_limit: mode === "reduce" ? limit : null, replacement_key: replacement });
    } catch (err) {
      console.error("Error al crear el plan:", err);
      setError("No se pudo guardar el plan. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  const options: { value: GoalMode; label: string }[] = [
    { value: "quit", label: "Quiero dejarlo" },
    { value: "reduce", label: "Quiero reducirlo" }
  ];

  return (
    <div className="hab-rise mt-3 rounded-2xl bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            className={`min-h-12 rounded-full border px-3 py-2 text-sm font-semibold transition active:scale-95 ${
              mode === option.value ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {mode === "reduce" ? (
        <div className="mt-3">
          <p className="text-sm font-semibold text-ink">Mi límite por día</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setLimit((value) => Math.max(item.step, value - item.step))}
              aria-label="Bajar el límite"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-ink"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="min-w-[6rem] text-center text-lg font-semibold text-ink">{formatAmount(item, limit)}</p>
            <button
              type="button"
              onClick={() => setLimit((value) => Math.min(ROUTINE_MAX_AMOUNT, value + item.step))}
              aria-label="Subir el límite"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-ink"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <label className="mt-3 grid gap-2">
        <span className="text-sm font-semibold">En su lugar voy a hacer</span>
        <select
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          className="rounded-2xl border border-black/10 bg-background px-4 py-3 text-base outline-none"
        >
          {HEALTHY_ITEMS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="mt-2 text-sm font-semibold text-danger">{error}</p> : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="min-h-12 flex-1 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 active:scale-95 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Empezar mi plan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-ink"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function RoutinePanel({
  date,
  today,
  entries,
  goals,
  lastUseBefore,
  contacts,
  saveError,
  onSetAmount,
  onCreateGoal,
  onDeleteGoal
}: {
  date: string;
  today: string;
  entries: RoutineEntries;
  goals: RoutineGoal[];
  lastUseBefore: Record<string, string | null>;
  contacts: ContactsInfo | null;
  saveError: string | null;
  onSetAmount: (key: string, amount: number) => void;
  onCreateGoal: (input: {
    item_key: string;
    mode: GoalMode;
    daily_limit: number | null;
    replacement_key: string | null;
  }) => Promise<void>;
  onDeleteGoal: (goal: RoutineGoal) => Promise<void>;
}) {
  const [view, setView] = useState<"healthy" | "vice">("healthy");
  const [formFor, setFormFor] = useState<string | null>(null);
  const [cheer, setCheer] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    if (!cheer) return;
    const id = window.setTimeout(() => setCheer(null), 3200);
    return () => window.clearTimeout(id);
  }, [cheer]);

  const addHealthy = (item: RoutineItem, nextAmount: number) => {
    const previous = amountOn(entries, date, item.key);
    onSetAmount(item.key, nextAmount);
    if (nextAmount > previous) {
      setCheer((current) => ({
        id: (current?.id ?? 0) + 1,
        text: `¡Muy bien! ${item.label}: ${formatAmount(item, nextAmount)}.`
      }));
    }
  };

  const addStep = (item: RoutineItem) =>
    addHealthy(item, Math.min(ROUTINE_MAX_AMOUNT, amountOn(entries, date, item.key) + item.step));

  const suggestion = suggestPositive(entries, date, today, goals);
  const SuggestionIcon = visualOf(suggestion.key).icon;
  const goalKeys = new Set(goals.map((goal) => goal.item_key));
  const helper = contacts?.doctor?.phone
    ? { label: "Llamar a mi médico", phone: contacts.doctor.phone }
    : contacts?.emergency?.phone
      ? { label: "Llamar a mi contacto", phone: contacts.emergency.phone }
      : null;

  const weekBars = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(today, index - 6);
    const weekday = isoWeekday(day) - 1;
    return {
      date: day,
      letter: WEEKDAY_LETTERS[weekday],
      dayName: WEEKDAY_NAMES[weekday],
      value: healthyMinutesOn(entries, day)
    };
  });
  const barsMax = Math.max(60, ...weekBars.map((day) => day.value ?? 0));

  const tabButton = (value: "healthy" | "vice", label: string): ReactNode => (
    <button
      type="button"
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={`min-h-12 rounded-full px-4 py-2 text-base font-semibold transition active:scale-95 ${
        view === value ? "bg-accent text-white shadow-soft" : "text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <section className="ab-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
        {cheer ? <Confetti key={cheer.id} /> : null}
        <div className="flex flex-col items-center text-center">
          <ReadingBook className="h-28 w-auto" />
          <p className="mt-2 text-lg font-semibold leading-7 text-ink">{phraseOfDay(today)}</p>
          <button
            type="button"
            onClick={() => addStep(suggestion)}
            className="mt-3 flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-violet-800 active:scale-[0.98]"
          >
            <SuggestionIcon className="hab-activity-on h-5 w-5 shrink-0" aria-hidden="true" />
            Hoy te propongo: {suggestion.step} min de {suggestion.label}
          </button>
          {cheer ? (
            <p role="status" className="hab-pop mt-2 text-base font-semibold text-emerald-800">
              {cheer.text}
            </p>
          ) : null}
        </div>
      </section>

      {saveError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{saveError}</p>
      ) : null}

      <div className="ab-card grid grid-cols-2 gap-1 rounded-full p-1.5" role="group" aria-label="Tipo de registro">
        {tabButton("healthy", "Saludables")}
        {tabButton("vice", "Vicios")}
      </div>

      {view === "healthy" ? (
        <>
          <SectionCard title="Mis actividades saludables" description="Toca + para sumar el tiempo que le dedicaste en este día.">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {HEALTHY_ITEMS.map((item, index) => {
                const visual = visualOf(item.key);
                const Icon = visual.icon;
                const amount = amountOn(entries, date, item.key);
                return (
                  <li
                    key={item.key}
                    className={`hab-pop flex flex-col justify-between gap-2 rounded-3xl border p-3 text-center ${
                      amount > 0 ? "border-emerald-300 bg-emerald-50" : "border-black/5 bg-white"
                    }`}
                    style={{ "--i": index } as CSSProperties}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${visual.color}`} aria-hidden="true">
                        <Icon
                          className={`h-7 w-7 ${amount > 0 ? "hab-activity-on" : "hab-float"}`}
                          style={{ animationDelay: `${index * 180}ms` }}
                        />
                      </span>
                      <p className="text-base font-semibold leading-5 text-ink">{item.label}</p>
                    </div>
                    <Stepper item={item} amount={amount} stacked onChange={(next) => addHealthy(item, next)} />
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <MiniBars
            title="Tiempo saludable, últimos 7 días"
            unit="minutos"
            days={weekBars}
            max={barsMax}
            color="#7c3aed"
            selectedDate={date}
          />
        </>
      ) : (
        <>
          <section className="ab-card rounded-[1.75rem] p-5 text-center sm:p-6">
            <Butterfly className="mx-auto h-24 w-auto" />
            <h2 className="mt-2 text-xl font-semibold text-ink">Cambiar es posible</h2>
            <p className="mt-1 text-base leading-7 text-muted">
              Anota sin culpa lo que pasó y elige un vicio para dejarlo o reducirlo poco a poco.
            </p>
          </section>

          {goals.length > 0 ? (
            <SectionCard title="Mis planes para cambiar" description="Tu avance crece como una planta.">
              <div className="grid gap-4 lg:grid-cols-2">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    today={today}
                    entries={entries}
                    lastUseBefore={lastUseBefore[goal.item_key] ?? null}
                    onAddReplacement={addStep}
                    onDelete={() => onDeleteGoal(goal)}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard title="Mis vicios" description="Registra cuánto fue en este día. Si fue nada, no tienes que anotar.">
            <ul className="grid gap-3 md:grid-cols-2">
              {VICE_ITEMS.map((item, index) => {
                const visual = visualOf(item.key);
                const Icon = visual.icon;
                const amount = amountOn(entries, date, item.key);
                const hasGoal = goalKeys.has(item.key);
                return (
                  <li
                    key={item.key}
                    className="hab-rise rounded-3xl border border-black/5 bg-white p-3"
                    style={{ "--i": index } as CSSProperties}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${visual.color}`} aria-hidden="true">
                        <Icon className="hab-rock h-6 w-6" style={{ animationDelay: `${index * 200}ms` }} />
                      </span>
                      <p className="min-w-0 flex-1 text-base font-semibold leading-5 text-ink">{item.label}</p>
                    </div>
                    <div className="mt-2">
                      <Stepper item={item} amount={amount} onChange={(next) => onSetAmount(item.key, next)} />
                    </div>

                    {hasGoal ? (
                      <p className="mt-2 text-center text-sm font-semibold text-emerald-800">Tienes un plan activo</p>
                    ) : formFor === item.key ? (
                      <GoalForm
                        item={item}
                        amountToday={amount}
                        onCancel={() => setFormFor(null)}
                        onCreate={async (input) => {
                          await onCreateGoal({ item_key: item.key, ...input });
                          setFormFor(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setFormFor(item.key)}
                        className="mt-2 min-h-11 w-full rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 active:scale-[0.98]"
                      >
                        Quiero cambiar este vicio
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionCard>

          <section className="flex items-start gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-base font-semibold leading-6">Pide ayuda antes de dejarlo de golpe</p>
              <p className="mt-1 text-sm leading-6">
                Si tomas alcohol todos los días, consumes drogas o usas medicinas sin receta, dejarlas de repente puede ser
                peligroso. Habla primero con tu médico. Si te sientes muy mal o piensas en hacerte daño, busca atención de
                emergencia de inmediato.
              </p>
              {helper ? (
                <a
                  href={telHref(helper.phone)}
                  className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {helper.label}
                </a>
              ) : null}
            </div>
          </section>

          <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-muted">
            <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden="true" />
            Solo tú puedes ver estos datos.
          </p>
        </>
      )}
    </>
  );
}
