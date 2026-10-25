import Link from "next/link";
import { Activity, AlertTriangle, Droplets, Dumbbell, Info, Lightbulb, Moon, Target } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { CriticalAlert } from "@/components/measurements/critical-alert";
import { PlanAdjustmentCard } from "@/components/plan/plan-adjustment-card";
import { PlanAntecedentsCard } from "@/components/plan/plan-antecedents-card";
import { DIET_ITEMS } from "@/lib/diet-data";
import { EXERCISE_SAFETY, RISK_DISCLAIMER, type PlanData, type RiskLevel } from "@/lib/plan";
import type { PlanAdjustment } from "@/lib/plan-adjustment";
import type { ProfileExtras } from "@/lib/plan-profile";
import type { ContactsInfo } from "@/lib/contacts";

const NAME_BY_ID = new Map(DIET_ITEMS.map((item) => [item.id, item.name]));

const LEVEL_STYLE: Record<RiskLevel, { badge: string; card: string }> = {
  NONE: { badge: "bg-slate-200 text-slate-800", card: "border-slate-200 bg-slate-50" },
  LOW: { badge: "bg-emerald-600 text-white", card: "border-emerald-200 bg-emerald-50" },
  MODERATE: { badge: "bg-amber-500 text-white", card: "border-amber-200 bg-amber-50" },
  HIGH: { badge: "bg-orange-600 text-white", card: "border-orange-200 bg-orange-50" },
  CRITICAL: { badge: "bg-red-700 text-white", card: "border-red-700 bg-red-50" }
};

const STATUS_BOX: Record<string, string> = {
  LOW: "border-blue-200 bg-blue-50",
  NORMAL: "border-emerald-200 bg-emerald-50",
  PROTECTIVE: "border-emerald-200 bg-emerald-50",
  BORDERLINE: "border-amber-200 bg-amber-50",
  HIGH: "border-orange-200 bg-orange-50",
  VERY_HIGH: "border-rose-200 bg-rose-50",
  CRITICAL: "border-red-700 bg-red-100"
};

const HABIT_ICON = {
  water: Droplets,
  sleep: Moon,
  activity: Activity
} as const;

function Chips({ ids, className }: { ids: string[]; className: string }) {
  if (ids.length === 0) {
    return <p className="mt-2 text-sm text-muted">—</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {ids.map((id) => (
        <span key={id} className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
          {NAME_BY_ID.get(id) ?? id}
        </span>
      ))}
    </div>
  );
}

export function PlanView({
  plan,
  adjustment,
  extras,
  contacts
}: {
  plan: PlanData;
  adjustment: PlanAdjustment;
  extras: ProfileExtras;
  contacts: ContactsInfo | null;
}) {
  const levelStyle = LEVEL_STYLE[plan.level];
  const isCritical = plan.level === "CRITICAL";

  return (
    <div className="space-y-6">
      {isCritical ? (
        <CriticalAlert
          title="Tienes un valor crítico"
          message={plan.criticalMessages.join(" ")}
          contacts={contacts}
        />
      ) : null}

      <SectionCard title="Mi nivel de riesgo" description="Se calcula con tu último valor de HDL, LDL y triglicéridos.">
        <div className={`rounded-3xl border p-5 ${levelStyle.card}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-lg font-semibold ${levelStyle.badge}`}>
              {plan.levelLabel}
            </span>
            {plan.driversText ? <p className="text-sm font-semibold text-ink">{plan.driversText}</p> : null}
          </div>

          <p className="mt-3 text-base leading-7 text-ink">{plan.levelMessage}</p>

          {plan.level === "NONE" ? (
            <Link
              href="/mediciones"
              className="mt-4 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-soft"
            >
              Registrar una medición
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{RISK_DISCLAIMER}</p>
        </div>
      </SectionCard>

      <PlanAdjustmentCard adjustment={adjustment} />

      <PlanAntecedentsCard extras={extras} />

      <SectionCard
        title="Mis metas"
        description="Lo que buscamos lograr con tus valores de colesterol y con tus hábitos."
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Target className="h-4 w-4 text-accent" />
          Colesterol
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {plan.cholesterolGoals.map((goal) => {
            const next = adjustment.nextGoals.find((item) => item.metric === goal.metric);
            return (
              <article
                key={goal.metric}
                className={`rounded-3xl border p-5 ${
                  goal.status ? (STATUS_BOX[goal.status] ?? "border-black/5 bg-white") : "border-black/5 bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-muted">{goal.label}</p>
                <p className="mt-1 text-sm text-ink">
                  Meta final: <span className="font-semibold">{goal.targetText}</span>
                </p>

                {goal.valueText ? (
                  <>
                    <p className="mt-3 text-3xl font-semibold text-ink">
                      {goal.valueText} <span className="text-base font-normal text-muted">mg/dL</span>
                    </p>
                    <p className="text-xs text-muted">
                      {goal.statusLabel} · {goal.dateText}
                    </p>
                  </>
                ) : null}

                <p className={`mt-3 text-sm font-semibold ${goal.met ? "text-emerald-700" : "text-ink"}`}>
                  {goal.gapText}
                </p>

                {next ? (
                  <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-ink">
                    <p className="font-semibold">Próximo control: {next.targetText}</p>
                    <p className="text-xs text-muted">{next.reason}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-ink">
          <Activity className="h-4 w-4 text-accent" />
          Hábitos
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {plan.habitGoals.map((goal) => {
            const Icon = HABIT_ICON[goal.key];
            return (
              <article key={goal.key} className="rounded-3xl border border-black/5 bg-white p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                  <Icon className="h-4 w-4" />
                  {goal.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-ink">{goal.target}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{goal.note}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/mediciones"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            Registrar una medición
          </Link>
          <Link
            href="/habitos"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            Registrar mis hábitos
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Mi plan de alimentación" description="Se ajusta a tu nivel de riesgo y a tu evolución.">
        <h3 className="text-lg font-semibold text-ink">{plan.diet.headline}</h3>

        {adjustment.dietEscalated && adjustment.dietNote ? (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{adjustment.dietNote}</p>
          </div>
        ) : null}

        <div className="mt-3 space-y-2 text-base leading-7 text-ink">
          <p>
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-rose-500" />
            {plan.diet.redRule}
          </p>
          <p>
            <span className="mr-2 inline-block h-3 w-3 rounded-full bg-amber-500" />
            {plan.diet.yellowRule}
          </p>
        </div>

        <p className="mt-5 text-sm font-semibold text-ink">Conviene priorizar:</p>
        <Chips ids={plan.diet.goodIds} className="bg-emerald-100 text-emerald-800" />
        {plan.diet.omittedCount > 0 ? (
          <p className="mt-2 text-xs leading-5 text-muted">
            Se omitieron {plan.diet.omittedCount} alimento(s) de esta lista por tus alergias registradas.
          </p>
        ) : null}

        <p className="mt-5 text-sm font-semibold text-ink">Conviene evitar o limitar:</p>
        <Chips ids={plan.diet.limitIds} className="bg-rose-100 text-rose-800" />

        <ul className="mt-5 list-disc space-y-1 pl-5 text-base leading-7 text-ink">
          {plan.diet.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dietas"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            Ver la guía de alimentación
          </Link>
          <Link
            href="/diario"
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
          >
            Anotar mis comidas
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Mi rutina de ejercicio" description="Una semana de ejemplo, según tu nivel de riesgo.">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 rounded-full bg-accentSoft px-4 py-2 text-sm font-semibold text-accent">
            <Dumbbell className="h-4 w-4" />
            {plan.routine.name}
          </span>
          <p className="text-sm font-semibold text-ink">{plan.routine.weeklyMinutes} minutos por semana</p>
        </div>

        <p className="mt-3 text-base leading-7 text-ink">{plan.routine.intro}</p>

        {adjustment.activity.minutes !== plan.routine.weeklyMinutes ? (
          <p className="mt-3 rounded-2xl bg-accentSoft p-3 text-sm font-semibold leading-6 text-ink">
            Tu meta de esta semana es de {adjustment.activity.minutes} min (ajustada según tu semana anterior). Esta
            rutina es un ejemplo base de {plan.routine.weeklyMinutes} min: adáptala a tu meta.
          </p>
        ) : null}

        <ul className="mt-4 space-y-2">
          {plan.routine.days.map((day) => (
            <li
              key={day.day}
              className="flex items-start justify-between gap-3 rounded-2xl border border-black/5 bg-background px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{day.day}</p>
                <p className="text-sm leading-6 text-muted">{day.activity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-ink">
                {day.minutes > 0 ? `${day.minutes} min` : "Descanso"}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Antes y durante el ejercicio
          </p>
          {extras.cardiacClearance ? (
            <p className="mt-2 font-semibold">
              Por tus antecedentes ({extras.cardiacConditions.join(", ")}), no empieces ni aumentes esta rutina sin la
              autorización de tu médico.
            </p>
          ) : null}
          <p className="mt-2">
            {isCritical
              ? "Con un valor crítico, consulta a tu médico antes de empezar cualquier rutina."
              : "Consulta a tu médico antes de empezar o aumentar la actividad física, sobre todo si tienes problemas del corazón, presión alta, diabetes o dolor en las articulaciones."}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {EXERCISE_SAFETY.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>

        <Link
          href="/habitos"
          className="mt-4 inline-flex rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          Registrar mi actividad
        </Link>
      </SectionCard>

      <SectionCard
        title="Recomendaciones de estilo de vida"
        description="Las marcadas como prioridad se relacionan con tus valores fuera de rango."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {plan.lifestyle.map((item) => (
            <article
              key={item.id}
              className={`rounded-3xl border p-5 ${
                item.priority ? "border-accent bg-accentSoft" : "border-black/5 bg-background"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-2 text-base font-semibold text-ink">
                  <Lightbulb className="h-4 w-4 text-accent" />
                  {item.title}
                </p>
                {item.priority ? (
                  <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                    Prioridad
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-ink">{item.text}</p>
            </article>
          ))}
        </div>

        <p className="mt-4 text-xs leading-5 text-muted">
          Este plan es orientativo, se calcula con tus mediciones y lo que registras, y no reemplaza la indicación de
          tu médico o nutricionista.
        </p>
      </SectionCard>
    </div>
  );
}