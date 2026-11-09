"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { BarChart3, Check, ChevronRight, CircleCheck, CircleX, Heart, HelpCircle, RotateCcw, Sparkles } from "lucide-react";
import { FilterChips, Hero } from "@/components/antecedentes/antecedentes-ui";
import { PlanAntecedentsCard } from "@/components/plan/plan-antecedents-card";
import { BulbArt, TipArt } from "@/components/plan/plan-art";
import type { LifestyleItem, PlanData } from "@/lib/plan";
import type { ComplianceArea } from "@/lib/plan-adjustment";
import { QUIZ, TIP_DETAILS } from "@/lib/plan-goals";
import type { ProfileExtras } from "@/lib/plan-profile";

type Filter = "all" | "priority" | "fav" | "tried";
type TipMark = "tip_fav" | "tip_tried";

function dayNumber(today: string) {
  return Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
}

function TipCard({
  item,
  index,
  fav,
  tried,
  onToggle
}: {
  item: LifestyleItem;
  index: number;
  fav: boolean;
  tried: boolean;
  onToggle: (kind: TipMark) => void;
}) {
  const [open, setOpen] = useState(false);
  const detail = TIP_DETAILS[item.id];

  return (
    <li className={`ant-rise overflow-hidden rounded-3xl border-2 bg-white ${item.priority ? "border-teal-500" : "border-black/10"}`} style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left transition active:scale-[0.99]">
        <span className="ant-tile flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-teal-50">
          <TipArt id={item.id} className="h-16 w-16" />
        </span>
        <span className="min-w-0 flex-1">
          {item.priority ? <span className="mb-1 inline-block rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-bold text-white">Prioridad para ti</span> : null}
          <span className="block text-lg font-bold leading-5 text-ink">{item.title}</span>
          <span className="mt-0.5 block text-base leading-5 text-muted">{detail?.short}</span>
        </span>
        <ChevronRight className={`h-6 w-6 shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-90" : ""}`} aria-hidden="true" />
      </button>

      <div className="ant-expand" data-open={open}>
        <div inert={!open}>
          <div className="space-y-2 px-3 pb-3">
            <p className="text-base leading-6 text-ink">{item.text}</p>
            {detail ? (
              <ol className="grid gap-1.5 sm:grid-cols-3">
                {detail.steps.map((step, stepIndex) => (
                  <li key={step} className="flex items-start gap-2 rounded-2xl bg-teal-50 p-2 text-sm font-semibold leading-5 text-ink">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white" aria-hidden="true">
                      {stepIndex + 1}
                    </span>
                    <span className="min-w-0">{step}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2">
              <button
                type="button"
                onClick={() => onToggle("tip_tried")}
                aria-pressed={tried}
                className={`flex min-h-12 items-center justify-center gap-1.5 rounded-full border-2 px-2 py-1 text-base font-semibold transition active:scale-95 ${tried ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white text-ink"}`}
              >
                <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
                Lo probé
              </button>
              <button
                type="button"
                onClick={() => onToggle("tip_fav")}
                aria-pressed={fav}
                className={`flex min-h-12 items-center justify-center gap-1.5 rounded-full border-2 px-2 py-1 text-base font-semibold transition active:scale-95 ${fav ? "border-pink-700 bg-pink-700 text-white" : "border-black/10 bg-white text-ink"}`}
              >
                <Heart key={String(fav)} className={`h-5 w-5 shrink-0 ${fav ? "ant-star fill-current" : ""}`} aria-hidden="true" />
                Favorito
              </button>
            </div>
            {detail?.href ? (
              <Link href={detail.href} className="flex min-h-12 items-center justify-center rounded-full bg-teal-700 px-4 py-2 text-base font-semibold text-white transition active:scale-[0.98]">
                {detail.linkLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function DailyTip({ tips, today }: { tips: LifestyleItem[]; today: string }) {
  const [offset, setOffset] = useState(0);
  const tip = tips[(dayNumber(today) + offset) % tips.length];

  return (
    <section className="ant-rise relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-amber-200 to-orange-200 p-4 text-amber-950">
      <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Consejo del día
      </p>
      <div key={tip.id} className="pln-flip mt-2 flex items-center gap-3">
        <TipArt id={tip.id} className="ant-tile h-24 w-24 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold leading-6">{tip.title}</p>
          <p className="mt-1 text-base font-semibold leading-5">{TIP_DETAILS[tip.id]?.steps[0]}</p>
        </div>
      </div>
      <button type="button" onClick={() => setOffset(offset + 1)} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-base font-bold text-amber-950 transition active:scale-[0.98]">
        <RotateCcw className="h-5 w-5 shrink-0" aria-hidden="true" />
        Otro consejo
      </button>
    </section>
  );
}

// Áreas con menos avance primero: ahí un consejo rinde más.
function FocusChart({ areas }: { areas: ComplianceArea[] }) {
  const rows = areas.filter((area) => area.progress !== null).sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
        <BarChart3 className="h-5 w-5 text-teal-700" aria-hidden="true" />
        Dónde enfocarte
      </h3>
      <p className="text-sm leading-5 text-muted">Tu avance hacia cada meta en los últimos 7 días.</p>
      {rows.length === 0 ? (
        <p className="mt-2 rounded-2xl bg-white p-3 text-base font-semibold text-muted">Registra tus hábitos para ver esta gráfica.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((area, index) => {
            const percent = Math.round((area.progress ?? 0) * 100);
            return (
              <li key={area.key}>
                <div className="flex items-baseline justify-between gap-2 text-base font-semibold leading-5 text-ink">
                  <span className="min-w-0">{area.label}</span>
                  <span className="tabular-nums">{percent}%</span>
                </div>
                <div className="mt-1 h-5 overflow-hidden rounded bg-teal-50" role="img" aria-label={`${area.label}: ${percent}% de avance`}>
                  <div className="pln-grow h-full rounded bg-teal-600" style={{ "--to": `${percent}%`, "--i": index } as CSSProperties} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TriedRing({ tried, total }: { tried: number; total: number }) {
  const circumference = 2 * Math.PI * 44;
  return (
    <section className="ant-rise ab-card flex items-center gap-4 rounded-[1.75rem] p-4">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#ccfbf1" strokeWidth="10" />
          <circle
            className="pln-ring pln-ring-in"
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#0f766e"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - tried / total)}
            style={{ "--full": circumference } as CSSProperties}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums text-ink">
          {tried}/{total}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold leading-5 text-ink">Consejos probados</p>
        <p className="mt-1 text-base leading-5 text-muted">{tried === 0 ? "Abre uno y prueba el primer paso." : tried === total ? "¡Los probaste todos!" : "Vas muy bien, sigue con otro."}</p>
      </div>
    </section>
  );
}

function Quiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const finished = index >= QUIZ.length;
  const current = QUIZ[Math.min(index, QUIZ.length - 1)];
  const correct = picked === current.answer;

  const answer = (value: boolean) => {
    if (picked !== null) return;
    setPicked(value);
    if (value === current.answer) setScore(score + 1);
  };

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <HelpCircle className="h-5 w-5 text-teal-700" aria-hidden="true" />
          ¿Verdadero o falso?
        </h3>
        {!finished ? <span className="text-sm font-bold tabular-nums text-muted">{index + 1} de {QUIZ.length}</span> : null}
      </div>

      {finished ? (
        <div className="ant-pop mt-3 text-center">
          <p className="text-4xl font-bold tabular-nums text-teal-800">{score} de {QUIZ.length}</p>
          <p className="mt-1 text-base font-semibold text-ink">{score === QUIZ.length ? "¡Perfecto, sabes mucho!" : "¡Bien! Cada respuesta te ayuda a cuidarte."}</p>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setPicked(null);
              setScore(0);
            }}
            className="mt-3 min-h-12 w-full rounded-full bg-teal-700 px-4 py-2 text-base font-bold text-white transition active:scale-[0.98]"
          >
            Jugar otra vez
          </button>
        </div>
      ) : (
        <div key={index} className="pln-flip">
          <p className="mt-3 text-xl font-bold leading-6 text-ink">{current.question}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { value: true, label: "Verdadero" },
              { value: false, label: "Falso" }
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => answer(option.value)}
                aria-pressed={picked === option.value}
                className={`min-h-14 rounded-2xl border-2 px-1 text-base font-bold transition active:scale-95 [overflow-wrap:anywhere] ${
                  picked === null ? "border-black/10 bg-white text-ink" : option.value === current.answer ? "border-emerald-700 bg-emerald-700 text-white" : picked === option.value ? "border-red-700 bg-red-700 text-white" : "border-black/10 bg-white text-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {picked !== null ? (
            <>
              <p className={`ant-pop mt-2 flex items-start gap-2 rounded-2xl p-3 text-base font-semibold leading-5 ${correct ? "bg-emerald-100 text-emerald-950" : "bg-amber-100 text-amber-950"}`}>
                {correct ? <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" /> : <CircleX className="h-5 w-5 shrink-0" aria-hidden="true" />}
                <span className="min-w-0">{current.note}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setIndex(index + 1);
                  setPicked(null);
                }}
                className="mt-2 min-h-12 w-full rounded-full bg-teal-700 px-4 py-2 text-base font-bold text-white transition active:scale-[0.98]"
              >
                Siguiente
              </button>
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function PlanConsejos({
  plan,
  areas,
  extras,
  today,
  hasMark,
  onToggleMark
}: {
  plan: PlanData;
  areas: ComplianceArea[];
  extras: ProfileExtras;
  today: string;
  hasMark: (kind: TipMark, key: string) => boolean;
  onToggleMark: (kind: TipMark, key: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const tips = plan.lifestyle;
  const priority = tips.filter((tip) => tip.priority).length;
  const fav = tips.filter((tip) => hasMark("tip_fav", tip.id)).length;
  const tried = tips.filter((tip) => hasMark("tip_tried", tip.id)).length;

  const visible = tips.filter(
    (tip) => filter === "all" || (filter === "priority" && tip.priority) || (filter === "fav" && hasMark("tip_fav", tip.id)) || (filter === "tried" && hasMark("tip_tried", tip.id))
  );

  return (
    <div className="space-y-4">
      <Hero
        tone="teal"
        art={<BulbArt />}
        title="Mis consejos"
        text="Ideas sencillas, elegidas según tus valores."
        stats={[
          { label: "Prioridad", value: priority },
          { label: "Favoritos", value: fav },
          { label: "Probados", value: tried }
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <DailyTip tips={tips} today={today} />
        <div className="space-y-4">
          <TriedRing tried={tried} total={tips.length} />
          <FocusChart areas={areas} />
        </div>
      </div>

      <FilterChips
        tone="teal"
        label="Filtrar consejos"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Todos", count: tips.length },
          { value: "priority", label: "Prioridad", count: priority },
          { value: "fav", label: "Favoritos", count: fav },
          { value: "tried", label: "Probados", count: tried }
        ]}
      />

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-center text-base font-semibold text-muted">Aún no hay consejos aquí. Abre uno y márcalo.</p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {visible.map((item, index) => (
            <TipCard
              key={item.id}
              item={item}
              index={index}
              fav={hasMark("tip_fav", item.id)}
              tried={hasMark("tip_tried", item.id)}
              onToggle={(kind) => onToggleMark(kind, item.id)}
            />
          ))}
        </ul>
      )}

      <Quiz />
      <PlanAntecedentsCard extras={extras} />

      <p className="text-xs leading-5 text-muted">Este plan es orientativo y no reemplaza la indicación de tu médico o nutricionista.</p>
    </div>
  );
}
