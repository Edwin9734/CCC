"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  Activity,
  Apple,
  Brain,
  Check,
  ChevronDown,
  CircleHelp,
  Droplets,
  Flag,
  Flame,
  type LucideIcon,
  Moon,
  Pill,
  Plus,
  Sparkles,
  Star,
  Target,
  Trophy
} from "lucide-react";
import { Confetti } from "@/components/habits/habit-visuals";
import {
  AddButton,
  ChoicePills,
  Empty,
  Expand,
  Field,
  FormSheet,
  Group,
  Hero,
  RowActions,
  SAVE_ERROR,
  fieldClass
} from "@/components/antecedentes/antecedentes-ui";
import { TargetArt } from "@/components/plan/plan-art";
import { HDL_GOAL, LDL_GOAL, RISK_DISCLAIMER, TRIGLYCERIDES_GOAL, type CholesterolGoal, type PlanData, type RiskLevel } from "@/lib/plan";
import type { ComplianceArea, PlanAdjustment } from "@/lib/plan-adjustment";
import {
  GOAL_CATEGORY_OPTIONS,
  WEEK_LETTERS,
  WEEK_NAMES,
  suggestionsFor,
  weekDates,
  weeksInARow,
  type GoalCategory,
  type GoalSuggestion,
  type PlanGoalCheck,
  type PlanGoalInput,
  type PlanGoalRow
} from "@/lib/plan-goals";
import type { ProfileExtras } from "@/lib/plan-profile";
import type { LipidMetric } from "@/lib/ranges";

const CATEGORY: Record<GoalCategory, { icon: LucideIcon; tile: string }> = {
  food: { icon: Apple, tile: "bg-emerald-100 text-emerald-800" },
  activity: { icon: Activity, tile: "bg-orange-100 text-orange-900" },
  water: { icon: Droplets, tile: "bg-sky-100 text-sky-800" },
  sleep: { icon: Moon, tile: "bg-indigo-100 text-indigo-800" },
  meds: { icon: Pill, tile: "bg-violet-100 text-violet-800" },
  mind: { icon: Brain, tile: "bg-pink-100 text-pink-800" },
  other: { icon: Star, tile: "bg-amber-100 text-amber-900" }
};

const LEVELS: { key: RiskLevel; label: string; bar: string }[] = [
  { key: "LOW", label: "Bajo", bar: "bg-emerald-500" },
  { key: "MODERATE", label: "Moderado", bar: "bg-amber-400" },
  { key: "HIGH", label: "Alto", bar: "bg-orange-500" },
  { key: "CRITICAL", label: "Crítico", bar: "bg-red-600" }
];

function RiskMeter({ plan }: { plan: PlanData }) {
  const [open, setOpen] = useState(false);
  const index = LEVELS.findIndex((item) => item.key === plan.level);

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold leading-6 text-ink">Mi nivel de riesgo</h3>
        <span className="rounded-full bg-ink px-4 py-1 text-base font-bold text-white">{plan.levelLabel}</span>
      </div>

      {index >= 0 ? (
        <div className="relative mt-7">
          <div className="grid grid-cols-4 gap-1">
            {LEVELS.map((item, itemIndex) => (
              <div key={item.key} className={`h-4 rounded-sm ${item.bar} ${itemIndex === index ? "" : "opacity-30"}`} />
            ))}
          </div>
          <span
            className="pln-marker absolute -top-6 flex -translate-x-1/2 flex-col items-center text-ink"
            style={{ "--to": `${(index + 0.5) * 25}%` } as CSSProperties}
            aria-hidden="true"
          >
            <ChevronDown className="pln-updown h-6 w-6" strokeWidth={3} />
          </span>
          <div className="mt-1 grid grid-cols-4 gap-1 text-center text-xs font-semibold text-muted">
            {LEVELS.map((item) => (
              <span key={item.key} className="[overflow-wrap:anywhere]">{item.label}</span>
            ))}
          </div>
        </div>
      ) : null}

      {plan.driversText ? <p className="mt-3 text-base font-semibold leading-6 text-ink">{plan.driversText}</p> : null}
      <p className="mt-1 text-base leading-6 text-ink">{plan.levelMessage}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {plan.level === "NONE" ? (
          <Link href="/mediciones" className="flex min-h-12 items-center rounded-full bg-accent px-5 py-2 text-base font-semibold text-white shadow-soft transition active:scale-95">
            Registrar una medición
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex min-h-11 items-center gap-1.5 rounded-full border-2 border-black/10 bg-white px-4 py-1.5 text-base font-semibold text-ink transition active:scale-95"
        >
          <CircleHelp className="h-5 w-5 shrink-0" aria-hidden="true" />
          ¿Cómo se calcula?
        </button>
      </div>
      <Expand open={open}>
        <p className="mt-2 rounded-2xl bg-sky-50 p-3 text-sm leading-6 text-sky-950">{RISK_DISCLAIMER}</p>
      </Expand>
    </section>
  );
}

function goalNumber(metric: LipidMetric, hdlMinimum: number) {
  return metric === "LDL" ? LDL_GOAL : metric === "TRIGLYCERIDES" ? TRIGLYCERIDES_GOAL : hdlMinimum;
}

function CholesterolCard({
  goal,
  value,
  hdlMinimum,
  nextGoal,
  index
}: {
  goal: CholesterolGoal;
  value: number | null;
  hdlMinimum: number;
  nextGoal?: { targetText: string; reason: string };
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const target = goalNumber(goal.metric, hdlMinimum);
  const max = Math.max(target * 1.8, (value ?? 0) * 1.15);
  const targetPct = (target / max) * 100;
  const valuePct = value === null ? 0 : Math.min(100, (value / max) * 100);
  const higherIsBetter = goal.metric === "HDL";

  return (
    <article className={`ant-rise rounded-3xl border-2 bg-white p-4 ${goal.met ? "border-emerald-400" : "border-black/10"}`} style={{ "--i": index } as CSSProperties}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-base font-bold leading-5 text-ink">{goal.label}</p>
        {goal.met ? (
          <span className="ant-pop flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-5 w-5" aria-label="Meta cumplida" />
          </span>
        ) : null}
      </div>

      {goal.valueText ? (
        <p className="mt-1 text-4xl font-bold leading-10 text-ink tabular-nums">
          {goal.valueText} <span className="text-base font-semibold text-muted">mg/dL</span>
        </p>
      ) : (
        <p className="mt-2 text-base font-semibold text-muted">Sin medición</p>
      )}

      {value !== null ? (
        <div className="relative mt-3 pt-6">
          <div className="relative h-4 overflow-hidden rounded-sm bg-orange-200">
            <div
              className="absolute inset-y-0 bg-emerald-400"
              style={higherIsBetter ? { left: `${targetPct}%`, right: 0 } : { left: 0, width: `${targetPct}%` }}
            />
          </div>
          <span className="pln-marker absolute top-0 -translate-x-1/2 text-ink" style={{ "--to": `${valuePct}%` } as CSSProperties} aria-hidden="true">
            <ChevronDown className="h-6 w-6" strokeWidth={3} />
          </span>
          <span className="absolute top-[1.1rem] h-7 w-1 -translate-x-1/2 rounded-sm bg-ink" style={{ left: `${targetPct}%` }} aria-hidden="true" />
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-muted">
            <Flag className="h-4 w-4 shrink-0" aria-hidden="true" />
            Meta: {goal.targetText}
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm font-semibold text-muted">Meta: {goal.targetText}</p>
      )}

      <p className={`mt-2 text-base font-bold leading-5 ${goal.met ? "text-emerald-800" : "text-ink"}`}>{goal.gapText}</p>

      {nextGoal ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="mt-2 flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl bg-accentSoft px-3 py-2 text-left text-base font-semibold leading-5 text-ink transition active:scale-[0.98]"
          >
            <span className="min-w-0">Próximo control: {nextGoal.targetText}</span>
            <ChevronDown className="ant-chevron h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
          <Expand open={open}>
            <p className="px-1 pt-2 text-sm leading-5 text-muted">{nextGoal.reason}</p>
          </Expand>
        </>
      ) : null}
    </article>
  );
}

const HABIT_META: Record<string, { icon: LucideIcon; tile: string; href: string }> = {
  water: { icon: Droplets, tile: "bg-sky-100 text-sky-700", href: "/habitos?tab=agua" },
  sleep: { icon: Moon, tile: "bg-indigo-100 text-indigo-700", href: "/habitos?tab=agua" },
  activity: { icon: Activity, tile: "bg-orange-100 text-orange-800", href: "/habitos?tab=actividad" }
};

function HabitTile({ goal, area, index }: { goal: PlanData["habitGoals"][number]; area?: ComplianceArea; index: number }) {
  const meta = HABIT_META[goal.key];
  const Icon = meta.icon;
  const progress = area?.progress ?? 0;

  return (
    <Link href={meta.href} className="ant-rise flex items-center gap-3 rounded-3xl border-2 border-black/10 bg-white p-3 transition active:scale-[0.98]" style={{ "--i": index } as CSSProperties}>
      <span className={`ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${meta.tile}`} aria-hidden="true">
        <Icon className="h-7 w-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold leading-5 text-ink">{goal.target}</span>
        <span className="mt-1.5 block h-3 overflow-hidden rounded-sm bg-slate-100">
          <span className="pln-grow block h-full rounded-sm bg-accent" style={{ "--to": `${Math.round(progress * 100)}%`, "--i": index } as CSSProperties} />
        </span>
        <span className="mt-1 block text-sm leading-5 text-muted">{area ? area.value : goal.label}</span>
      </span>
    </Link>
  );
}

function GoalForm({
  initial,
  editing,
  onSave,
  onClose
}: {
  initial: PlanGoalInput;
  editing: boolean;
  onSave: (input: PlanGoalInput) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const title = draft.title.trim();
    if (title === "") {
      setError("Escribe cuál es tu meta.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...draft, title });
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  return (
    <FormSheet tone="rose" title={editing ? "Editar mi meta" : "Crear una meta"} icon={<Target className="h-7 w-7" />} saving={saving} error={error} onClose={onClose} onSubmit={submit}>
      <Field label="¿Qué quieres lograr?">
        <input
          type="text"
          value={draft.title}
          maxLength={120}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder="Ej. Caminar con mi vecina"
          className={fieldClass("rose")}
        />
      </Field>
      <Group label="¿De qué se trata?">
        <ChoicePills tone="rose" options={GOAL_CATEGORY_OPTIONS} value={draft.category} onChange={(category) => setDraft({ ...draft, category })} columns="grid-cols-2 sm:grid-cols-4" />
      </Group>
      <Group label="¿Cuántos días por semana?">
        <div className="pln-week grid grid-cols-7 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDraft({ ...draft, days_per_week: days })}
              aria-pressed={draft.days_per_week === days}
              className={`min-h-12 rounded-2xl border-2 text-lg font-bold transition active:scale-90 ${
                draft.days_per_week === days ? "border-rose-700 bg-rose-700 text-white" : "border-black/10 bg-white text-ink"
              }`}
            >
              {days}
            </button>
          ))}
        </div>
      </Group>
    </FormSheet>
  );
}

function GoalCard({
  goal,
  index,
  today,
  dates,
  onToggle,
  onEdit,
  onDone,
  onDelete
}: {
  goal: PlanGoalRow;
  index: number;
  today: string;
  dates: Set<string>;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onDone: () => void;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY[goal.category];
  const Icon = meta.icon;
  const week = weekDates(today);
  const count = week.filter((day) => dates.has(day)).length;
  const complete = count >= goal.days_per_week;
  const streak = weeksInARow(goal, dates, today);
  const isDone = goal.done_at !== null;

  return (
    <li className={`ant-rise relative overflow-hidden rounded-3xl border-2 bg-white p-3 transition-colors duration-300 ${complete && !isDone ? "border-emerald-400" : "border-black/10"}`} style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 text-left">
        <span className={`ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${meta.tile}`} aria-hidden="true">
          <Icon className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{goal.title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-base font-semibold leading-5 text-muted">
            <span>{isDone ? "¡Lograda!" : `${count} de ${goal.days_per_week} días`}</span>
            {streak > 0 ? (
              <span className="flex items-center gap-1 text-orange-800">
                <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
                {streak} {streak === 1 ? "semana" : "semanas"}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown className="ant-chevron mt-1 h-6 w-6 shrink-0 text-muted" aria-hidden="true" />
      </button>

      {!isDone ? (
        <div className="pln-week mt-3 grid grid-cols-7 gap-1.5">
          {week.map((day, dayIndex) => {
            const on = dates.has(day);
            const future = day > today;
            return (
              <button
                key={day}
                type="button"
                disabled={future}
                onClick={() => onToggle(day)}
                aria-pressed={on}
                aria-label={`${WEEK_NAMES[dayIndex]}${day === today ? " (hoy)" : ""}`}
                className={`flex min-h-12 flex-col items-center justify-center rounded-2xl border-2 text-base font-bold transition active:scale-90 disabled:opacity-40 ${
                  on ? "border-emerald-600 bg-emerald-600 text-white" : day === today ? "border-accent bg-accentSoft text-ink" : "border-black/10 bg-white text-ink"
                }`}
              >
                {on ? <Check key="on" className="ant-pop h-6 w-6" aria-hidden="true" /> : WEEK_LETTERS[dayIndex]}
              </button>
            );
          })}
        </div>
      ) : null}

      <Expand open={open}>
        <div className="pt-3">
          <RowActions
            onEdit={onEdit}
            onDelete={onDelete}
            extra={
              <button
                type="button"
                onClick={onDone}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition active:scale-[0.98] ${isDone ? "bg-slate-100 text-ink" : "bg-emerald-700 text-white"}`}
              >
                <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />
                {isDone ? "Volver a activas" : "¡La logré!"}
              </button>
            }
          />
        </div>
      </Expand>
    </li>
  );
}

export function PlanMetas({
  plan,
  adjustment,
  extras,
  today,
  latestValues,
  goals,
  checks,
  onSaveGoal,
  onDeleteGoal,
  onToggleCheck,
  notify
}: {
  plan: PlanData;
  adjustment: PlanAdjustment;
  extras: ProfileExtras;
  today: string;
  latestValues: Partial<Record<LipidMetric, number>>;
  goals: PlanGoalRow[];
  checks: PlanGoalCheck[];
  onSaveGoal: (input: PlanGoalInput, id?: string) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onToggleCheck: (goalId: string, date: string, on: boolean) => Promise<void>;
  notify: (text: string, error?: boolean) => void;
}) {
  const [view, setView] = useState<"active" | "done">("active");
  const [form, setForm] = useState<{ initial: PlanGoalInput; id: string | null } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [cheer, setCheer] = useState(0);

  const active = goals.filter((goal) => !goal.done_at);
  const done = goals.filter((goal) => goal.done_at);
  const list = view === "active" ? active : done;

  const datesOf = (goalId: string) => new Set(checks.filter((check) => check.goal_id === goalId).map((check) => check.check_date));
  const week = weekDates(today);
  const metThisWeek = active.filter((goal) => week.filter((day) => datesOf(goal.id).has(day)).length >= goal.days_per_week).length;
  const lipidsMet = plan.cholesterolGoals.filter((goal) => goal.met).length;

  const needs = plan.cholesterolGoals.filter((goal) => goal.met === false).map((goal) => goal.metric);
  const suggestions = suggestionsFor(needs, goals, extras.waterRestricted);
  const shown = showAll ? suggestions : suggestions.slice(0, 3);

  const addSuggestion = async (item: GoalSuggestion) => {
    try {
      await onSaveGoal({ title: item.title, category: item.category, days_per_week: item.days, suggestion_key: item.key, done_at: null });
      notify("¡Meta agregada!");
    } catch {
      notify(SAVE_ERROR, true);
    }
  };

  const toggle = async (goal: PlanGoalRow, date: string) => {
    const dates = datesOf(goal.id);
    const on = !dates.has(date);
    const before = week.filter((day) => dates.has(day)).length;
    try {
      await onToggleCheck(goal.id, date, on);
      if (on && week.includes(date) && before + 1 === goal.days_per_week) {
        setCheer(Date.now());
        notify("¡Cumpliste tu meta de esta semana!");
      }
    } catch {
      notify(SAVE_ERROR, true);
    }
  };

  const tabButton = (value: "active" | "done", label: string, count: number) => (
    <button
      type="button"
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={`min-h-12 rounded-full px-4 py-2 text-base font-semibold transition active:scale-95 ${view === value ? "bg-accent text-white shadow-soft" : "text-ink"}`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="relative space-y-5">
      {cheer ? <Confetti key={cheer} /> : null}

      <Hero
        tone="rose"
        art={<TargetArt />}
        title="Mis metas"
        text="Paso a paso, tú decides hasta dónde llegar."
        stats={[
          { label: "Activas", value: active.length },
          { label: "Esta semana", value: metThisWeek },
          { label: "Colesterol", value: lipidsMet }
        ]}
      />

      <RiskMeter plan={plan} />

      <section aria-label="Metas de colesterol">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
          <Target className="h-5 w-5 text-accent" aria-hidden="true" />
          Mi colesterol
        </h3>
        <div className="grid gap-3 md:grid-cols-3 md:items-start">
          {plan.cholesterolGoals.map((goal, index) => (
            <CholesterolCard
              key={goal.metric}
              goal={goal}
              index={index}
              value={latestValues[goal.metric] ?? null}
              hdlMinimum={extras.hdlMinimum || HDL_GOAL}
              nextGoal={adjustment.nextGoals.find((item) => item.metric === goal.metric)}
            />
          ))}
        </div>
      </section>

      <section aria-label="Metas de hábitos">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-ink">
          <Activity className="h-5 w-5 text-accent" aria-hidden="true" />
          Mis hábitos, últimos 7 días
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {plan.habitGoals.map((goal, index) => (
            <HabitTile key={goal.key} goal={goal} index={index} area={adjustment.compliance.areas.find((area) => area.key === goal.key)} />
          ))}
        </div>
      </section>

      <section aria-label="Mis metas personales" className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
          Mis metas personales
        </h3>

        <AddButton
          tone="rose"
          label="Crear una meta"
          onClick={() => setForm({ initial: { title: "", category: "food", days_per_week: 5, suggestion_key: null, done_at: null }, id: null })}
        />

        <div className="ab-card grid grid-cols-2 gap-1 rounded-full p-1.5" role="group" aria-label="Estado de las metas">
          {tabButton("active", "Activas", active.length)}
          {tabButton("done", "Logradas", done.length)}
        </div>

        {list.length === 0 ? (
          <Empty
            tone="rose"
            icon={view === "active" ? <Target className="h-10 w-10" /> : <Trophy className="h-10 w-10" />}
            title={view === "active" ? "Aún no tienes metas" : "Todavía sin metas logradas"}
            text={view === "active" ? "Crea una o toca + en las sugerencias de abajo." : "Cuando cumplas una, márcala con «¡La logré!»."}
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
            {list.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                today={today}
                dates={datesOf(goal.id)}
                onToggle={(date) => toggle(goal, date)}
                onEdit={() =>
                  setForm({
                    initial: { title: goal.title, category: goal.category, days_per_week: goal.days_per_week, suggestion_key: goal.suggestion_key, done_at: goal.done_at },
                    id: goal.id
                  })
                }
                onDone={async () => {
                  try {
                    const finishing = goal.done_at === null;
                    await onSaveGoal(
                      { title: goal.title, category: goal.category, days_per_week: goal.days_per_week, suggestion_key: goal.suggestion_key, done_at: finishing ? new Date().toISOString() : null },
                      goal.id
                    );
                    if (finishing) {
                      setCheer(Date.now());
                      notify("¡Felicidades, meta lograda!");
                    }
                  } catch {
                    notify(SAVE_ERROR, true);
                  }
                }}
                onDelete={async () => {
                  try {
                    await onDeleteGoal(goal.id);
                    notify("Borrada");
                  } catch {
                    notify("No se pudo borrar. Inténtalo de nuevo.", true);
                  }
                }}
              />
            ))}
          </ul>
        )}

        {view === "active" && suggestions.length > 0 ? (
          <div className="ab-card rounded-[1.75rem] p-4">
            <p className="flex items-center gap-2 text-base font-bold text-ink">
              <Sparkles className="h-5 w-5 text-amber-600" aria-hidden="true" />
              Sugeridas para ti
            </p>
            <ul className="mt-2 grid gap-2 md:grid-cols-3">
              {shown.map((item, index) => {
                const meta = CATEGORY[item.category];
                const Icon = meta.icon;
                return (
                  <li key={item.key} className="ant-pop flex items-center gap-2 rounded-2xl bg-white p-2" style={{ "--i": index } as CSSProperties}>
                    <span className={`ant-tile flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.tile}`} aria-hidden="true">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1 text-base font-semibold leading-5 text-ink">
                      {item.title}
                      <span className="block text-sm font-normal text-muted">{item.days} días por semana</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addSuggestion(item)}
                      aria-label={`Agregar ${item.title}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-700 text-white transition active:scale-90"
                    >
                      <Plus className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
            {suggestions.length > 3 ? (
              <button type="button" onClick={() => setShowAll(!showAll)} className="mt-2 min-h-11 text-base font-semibold text-accent underline">
                {showAll ? "Ver menos" : `Ver todas (${suggestions.length})`}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {form ? (
        <GoalForm
          initial={form.initial}
          editing={form.id !== null}
          onClose={() => setForm(null)}
          onSave={async (input) => {
            await onSaveGoal(input, form.id ?? undefined);
            setForm(null);
            notify("¡Guardada!");
          }}
        />
      ) : null}
    </div>
  );
}
