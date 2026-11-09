"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, CircleDashed, Lightbulb, Minus, Plus, Share2, ShoppingBasket, Sparkles, ThumbsUp, type LucideIcon, Trash2, UtensilsCrossed } from "lucide-react";
import { FoodPhotoTile } from "@/components/diet/food-photo-tile";
import { FoodDialog } from "@/components/diet/food-dialog";
import { FilterChips, Hero } from "@/components/antecedentes/antecedentes-ui";
import { FruitPlate } from "@/components/racha/racha-art";
import { DIET_ITEM_BY_ID, type DietItem } from "@/lib/diet-data";
import type { PlanData, RiskLevel } from "@/lib/plan";
import type { PlanAdjustment, TrendDirection } from "@/lib/plan-adjustment";
import { BENEFIT_LABEL, FOOD_BENEFITS, PLATE_GROUPS } from "@/lib/plan-goals";
import type { LipidMetric } from "@/lib/ranges";

const STRICTNESS: { key: RiskLevel; label: string; bar: string }[] = [
  { key: "LOW", label: "Balanceada", bar: "bg-emerald-500" },
  { key: "MODERATE", label: "Ajustada", bar: "bg-amber-400" },
  { key: "HIGH", label: "Estricta", bar: "bg-orange-500" },
  { key: "CRITICAL", label: "Muy estricta", bar: "bg-red-600" }
];

const TREND_ICON: Record<TrendDirection, { icon: LucideIcon; chip: string }> = {
  improving: { icon: ThumbsUp, chip: "bg-emerald-100 text-emerald-900" },
  stable: { icon: Minus, chip: "bg-slate-100 text-slate-800" },
  worsening: { icon: AlertCircle, chip: "bg-orange-100 text-orange-950" },
  insufficient: { icon: CircleDashed, chip: "bg-slate-100 text-slate-700" }
};

type Filter = "all" | "you" | LipidMetric;
const TILE_GRID = "grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2.5";

function toItems(ids: string[]) {
  return ids.flatMap((id): DietItem[] => {
    const item = DIET_ITEM_BY_ID.get(id);
    return item ? [item] : [];
  });
}

function WhyCard({ plan, adjustment, needs }: { plan: PlanData; adjustment: PlanAdjustment; needs: LipidMetric[] }) {
  const dietLevel: RiskLevel = adjustment.dietEscalated ? "HIGH" : plan.level;
  const index = STRICTNESS.findIndex((item) => item.key === dietLevel);

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Sparkles className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        Hecho para ti
      </h3>
      <p className="mt-0.5 text-base leading-5 text-muted">
        Tu nivel es <span className="font-bold text-ink">{plan.levelLabel}</span>
        {needs.length > 0 ? ", así que priorizamos lo que más te ayuda." : "; estos alimentos te ayudan a mantenerte."}
      </p>

      {index >= 0 ? (
        <div className="mt-3">
          <div className="grid grid-cols-4 gap-1">
            {STRICTNESS.map((item, itemIndex) => (
              <div key={item.key} className={`h-3 rounded-sm ${item.bar} ${itemIndex <= index ? "pln-grow" : "opacity-25"}`} style={{ "--to": "100%", "--i": itemIndex } as CSSProperties} />
            ))}
          </div>
          <p className="mt-1 text-sm font-bold text-ink">Alimentación: {STRICTNESS[index].label.toLowerCase()}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {adjustment.trends.map((trend, trendIndex) => {
          const style = TREND_ICON[trend.direction];
          const Icon = style.icon;
          return (
            <span key={trend.metric} className={`ant-pop inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${style.chip}`} style={{ "--i": trendIndex + 2 } as CSSProperties}>
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {trend.metric === "TRIGLYCERIDES" ? "Triglicéridos" : trend.metric}: {trend.directionLabel.toLowerCase()}
            </span>
          );
        })}
      </div>

      {adjustment.dietEscalated && adjustment.dietNote ? (
        <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-5 text-amber-950">{adjustment.dietNote}</p>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <p className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm font-semibold leading-5 text-ink">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />
          {plan.diet.redRule}
        </p>
        <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-5 text-ink">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
          {plan.diet.yellowRule}
        </p>
      </div>
    </section>
  );
}

function PlateBuilder({ goodIds }: { goodIds: string[] }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const groups = PLATE_GROUPS.map((group) => ({ ...group, items: toItems(group.ids.filter((id) => goodIds.includes(id))) })).filter((group) => group.items.length > 0);
  const filled = groups.filter((group) => picked[group.key]).length;
  const ready = groups.length > 0 && filled === groups.length;

  // Fondo del plato: la mitad para verduras y un cuarto para cada uno de los otros dos.
  const slices: { key: string; d: string; color: string }[] = [
    { key: "veg", d: "M60 60 60 12A48 48 0 0 1 60 108Z", color: "#22c55e" },
    { key: "protein", d: "M60 60 60 108A48 48 0 0 1 12 60Z", color: "#f97316" },
    { key: "energy", d: "M60 60 12 60A48 48 0 0 1 60 12Z", color: "#eab308" }
  ];

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
        <UtensilsCrossed className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        Arma tu plato
      </h3>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label={`Plato con ${filled} de ${groups.length} partes elegidas`}>
          <circle cx="60" cy="60" r="56" fill="#fff" stroke="#e2d5d9" strokeWidth="2" />
          <circle cx="60" cy="60" r="48" fill="#f8fafc" />
          {slices.map((slice) => (picked[slice.key] ? <path key={slice.key} className="pln-slice" d={slice.d} fill={slice.color} stroke="#fff" strokeWidth="2" /> : null))}
          <path d="M60 12v96M12 60h48" stroke="#e2e8f0" strokeWidth="2" />
        </svg>
        <div className="w-full min-w-0 flex-1 space-y-2">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-sm font-bold text-ink">
                {group.label} <span className="font-semibold text-muted">· {group.share}</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {group.items.map((item) => {
                  const on = picked[group.key] === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPicked((current) => ({ ...current, [group.key]: on ? "" : item.id }))}
                      aria-pressed={on}
                      className={`min-h-10 rounded-full border-2 px-3 py-1 text-sm font-semibold transition active:scale-95 ${on ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white text-ink"}`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {ready ? (
        <Link href="/diario" className="ant-pop mt-3 flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-base font-bold text-white">
          <Check className="h-5 w-5 shrink-0" aria-hidden="true" />
          ¡Buen plato! Anótalo en tu Diario
        </Link>
      ) : null}
    </section>
  );
}

function TipSlider({ tips }: { tips: string[] }) {
  const [index, setIndex] = useState(0);
  if (tips.length === 0) return null;
  const go = (step: number) => setIndex((index + step + tips.length) % tips.length);
  return (
    <section className="flex items-center gap-2 rounded-[1.75rem] bg-amber-100 p-3 text-amber-950">
      <button type="button" onClick={() => go(-1)} aria-label="Consejo anterior" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white transition active:scale-90">
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>
      <p key={index} className="pln-flip flex min-w-0 flex-1 items-center gap-2 text-base font-semibold leading-5">
        <Lightbulb className="ant-tile h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="min-w-0">{tips[index]}</span>
      </p>
      <button type="button" onClick={() => go(1)} aria-label="Consejo siguiente" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white transition active:scale-90">
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>
    </section>
  );
}

function ShoppingList({ ids, onRemove, notify }: { ids: string[]; onRemove: (id: string) => void; notify: (text: string, error?: boolean) => void }) {
  const items = toItems(ids);
  if (items.length === 0) return null;

  const share = async () => {
    const text = `Mi lista de compras:\n${items.map((item) => `- ${item.name}`).join("\n")}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        notify("Lista copiada");
      }
    } catch {
      // La persona canceló o el navegador no lo permite; la lista sigue en pantalla.
    }
  };

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
          <ShoppingBasket className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          Mi lista de compras
        </h3>
        <button type="button" onClick={share} className="flex min-h-11 items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-1.5 text-base font-semibold text-emerald-900 transition active:scale-95">
          <Share2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          Compartir
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item.id} className="ant-pop flex items-center gap-1 rounded-full bg-white py-1 pl-3 pr-1 text-base font-semibold text-ink">
            {item.name}
            <button type="button" onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.name}`} className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-rose-50 active:scale-90">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PlanDieta({
  plan,
  adjustment,
  allergyMatches,
  hasMark,
  onToggleMark,
  shoppingIds,
  notify
}: {
  plan: PlanData;
  adjustment: PlanAdjustment;
  allergyMatches: Record<string, string[]>;
  hasMark: (kind: "shopping", key: string) => boolean;
  onToggleMark: (kind: "shopping", key: string) => void;
  shoppingIds: string[];
  notify: (text: string, error?: boolean) => void;
}) {
  const [view, setView] = useState<"good" | "limit">("good");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  // Lo que necesita más apoyo: valores fuera de meta o que van empeorando.
  const needs = useMemo(() => {
    const worsening = adjustment.trends.filter((trend) => trend.direction === "worsening").map((trend) => trend.metric);
    const missed = plan.cholesterolGoals.filter((goal) => goal.met === false).map((goal) => goal.metric);
    return Array.from(new Set([...worsening, ...missed]));
  }, [adjustment.trends, plan.cholesterolGoals]);

  const isForYou = (id: string) => (FOOD_BENEFITS[id] ?? []).some((metric) => needs.includes(metric));

  const goodItems = useMemo(() => {
    const score = (id: string) => (FOOD_BENEFITS[id] ?? []).filter((metric) => needs.includes(metric)).length;
    return toItems(plan.diet.goodIds).sort((a, b) => score(b.id) - score(a.id));
  }, [plan.diet.goodIds, needs]);

  const limitItems = useMemo(() => toItems(plan.diet.limitIds), [plan.diet.limitIds]);

  const filtered =
    view === "limit"
      ? limitItems
      : goodItems.filter((item) => filter === "all" || (filter === "you" ? isForYou(item.id) : (FOOD_BENEFITS[item.id] ?? []).includes(filter)));
  const visible = expanded ? filtered : filtered.slice(0, 8);

  const filterOptions: { value: Filter; label: string }[] = [
    { value: "all", label: "Todos" },
    ...(needs.length > 0 ? [{ value: "you" as Filter, label: "Para ti" }] : []),
    { value: "LDL", label: "Bajar LDL" },
    { value: "TRIGLYCERIDES", label: "Triglicéridos" },
    { value: "HDL", label: "Subir HDL" }
  ];

  const subtitle = (item: DietItem) => {
    if (view === "limit") return undefined;
    const benefits = FOOD_BENEFITS[item.id] ?? [];
    const main = benefits.find((metric) => needs.includes(metric)) ?? benefits[0];
    return main ? BENEFIT_LABEL[main] : undefined;
  };

  const tabButton = (value: "good" | "limit", label: string) => (
    <button
      type="button"
      onClick={() => {
        setView(value);
        setExpanded(false);
      }}
      aria-pressed={view === value}
      className={`min-h-12 rounded-full px-3 py-2 text-base font-semibold transition active:scale-95 ${view === value ? "bg-accent text-white shadow-soft" : "text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <Hero
        tone="emerald"
        art={<FruitPlate className="h-full w-full" />}
        title="Mi plan de alimentación"
        text={plan.diet.headline}
        stats={[
          { label: "Priorizar", value: goodItems.length },
          { label: "Para ti", value: goodItems.filter((item) => isForYou(item.id)).length },
          { label: "En mi lista", value: shoppingIds.length }
        ]}
      />

      <WhyCard plan={plan} adjustment={adjustment} needs={needs} />
      <TipSlider tips={plan.diet.tips} />

      <div className="ab-card grid grid-cols-2 gap-1 rounded-full p-1.5" role="group" aria-label="Lista de alimentos">
        {tabButton("good", "Priorizar")}
        {tabButton("limit", "Limitar")}
      </div>

      {view === "good" ? (
        <FilterChips
          tone="emerald"
          label="Filtrar alimentos"
          options={filterOptions}
          value={filter}
          onChange={(next) => {
            setFilter(next);
            setExpanded(false);
          }}
        />
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-center text-base font-semibold text-muted">No hay alimentos en este filtro.</p>
      ) : (
        <div className={TILE_GRID}>
          {visible.map((item, index) => {
            const inList = hasMark("shopping", item.id);
            return (
              <div key={`${view}-${item.id}`} className="ant-pop relative" style={{ "--i": index } as CSSProperties}>
                <FoodPhotoTile
                  item={item}
                  tinted
                  opensDialog
                  forYou={view === "good" && isForYou(item.id)}
                  flagged={Boolean(allergyMatches[item.id])}
                  subtitle={subtitle(item)}
                  onClick={(event) => {
                    returnRef.current = event.currentTarget;
                    setOpenId(item.id);
                  }}
                />
                {view === "good" ? (
                  <button
                    type="button"
                    onClick={() => onToggleMark("shopping", item.id)}
                    aria-pressed={inList}
                    aria-label={`${item.name} en mi lista de compras`}
                    className={`absolute left-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full shadow-soft transition active:scale-90 ${inList ? "bg-emerald-700 text-white" : "bg-white text-ink"}`}
                  >
                    {inList ? <Check key="on" className="ant-pop h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 8 ? (
        <button type="button" onClick={() => setExpanded(!expanded)} className="min-h-12 w-full rounded-full border-2 border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition active:scale-[0.98]">
          {expanded ? "Ver menos" : `Ver todos (${filtered.length})`}
        </button>
      ) : null}

      {plan.diet.omittedCount > 0 ? (
        <p className="text-sm leading-5 text-muted">Omitimos {plan.diet.omittedCount} por tus alergias registradas.</p>
      ) : null}

      <ShoppingList ids={shoppingIds} onRemove={(id) => onToggleMark("shopping", id)} notify={notify} />
      <PlateBuilder goodIds={plan.diet.goodIds} />

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/dietas?tab=guia" className="flex min-h-12 items-center justify-center rounded-full border-2 border-black/10 bg-white px-4 py-2 text-center text-base font-semibold text-ink transition active:scale-[0.98]">
          Ver la guía completa
        </Link>
        <Link href="/diario" className="flex min-h-12 items-center justify-center rounded-full border-2 border-black/10 bg-white px-4 py-2 text-center text-base font-semibold text-ink transition active:scale-[0.98]">
          Anotar mis comidas
        </Link>
      </div>

      <FoodDialog foodId={openId} allergies={openId ? allergyMatches[openId] : undefined} onClose={() => setOpenId(null)} returnFocusRef={returnRef} />
    </div>
  );
}
