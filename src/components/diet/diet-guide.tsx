"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { AlertTriangle, Apple, ArrowRight, Ban, CheckCircle2, ChevronDown, CupSoda, GlassWater, Gamepad2, Info, Leaf, Grid3x3, LayoutGrid, Pill, Plus, Search, ShieldAlert, ShoppingBasket, Sparkles, Square, X } from "lucide-react";
import { Confetti } from "@/components/habits/habit-visuals";
import { Expand, Hero } from "@/components/antecedentes/antecedentes-ui";
import { FoodImage } from "@/components/diet/food-image";
import { FoodAvatar, LIGHT, STICKY_BAR, ShoppingToggle, itemsOf, useFoodDialog } from "@/components/diet/diet-ui";
import { FruitPlate } from "@/components/racha/racha-art";
import { FOOD_IMAGE_CREDIT } from "@/lib/food-images";
import { DIET_ITEMS, DIET_ITEM_BY_ID, type DietCategory, type DietItem, type TrafficLight } from "@/lib/diet-data";
import type { DietInsights } from "@/lib/diet-insights";

type Category = DietCategory | "all" | "list";
type Light = TrafficLight | "all";

const CATEGORIES: { key: Category; label: string; icon: typeof Apple }[] = [
  { key: "foods-good", label: "Recomendados", icon: Apple },
  { key: "foods-avoid", label: "A evitar", icon: Ban },
  { key: "drinks-good", label: "Bebidas buenas", icon: GlassWater },
  { key: "drinks-avoid", label: "Bebidas a evitar", icon: CupSoda },
  { key: "others", label: "Verduras y más", icon: Leaf },
  { key: "all", label: "Todo", icon: LayoutGrid },
  { key: "list", label: "Mi lista", icon: ShoppingBasket }
];

// Cambios sencillos: de un alimento a evitar a una opción mejor.
export const SWAPS: [string, string][] = [
  ["gaseosas", "agua"],
  ["jugos-industriales", "naranja"],
  ["reposteria", "manzana"],
  ["margarina", "aceite-oliva"],
  ["salchicha", "pollo-sin-piel"],
  ["chicharron", "mani"],
  ["pan-blanco", "pan-integral"],
  ["arroz-blanco", "arroz-integral"],
  ["cafe-crema", "te-verde"],
  ["frappes", "licuado-verde"]
];

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function ForYou({ insights, allergyMatches, openFood }: { insights: DietInsights; allergyMatches: Record<string, string[]>; openFood: ReturnType<typeof useFoodDialog>["open"] }) {
  const [metric, setMetric] = useState(insights.metricInsights[0]?.metric);
  const [medsOpen, setMedsOpen] = useState(false);
  const current = insights.metricInsights.find((item) => item.metric === metric) ?? insights.metricInsights[0];

  const row = (ids: string[]) => (
    <div className="mt-1 flex flex-wrap gap-1">
      {itemsOf(ids).map((item, index) => (
        <FoodAvatar key={item.id} item={item} index={index} flagged={Boolean(allergyMatches[item.id])} onOpen={(event) => openFood(event, item.id)} />
      ))}
    </div>
  );

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Sparkles className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        Para ti
      </h3>

      {!insights.hasMeasurements ? (
        <p className="mt-1 text-base leading-6 text-muted">
          Registra una medición para personalizar esta guía.{" "}
          <Link href="/mediciones" className="font-semibold text-accent underline">
            Ir a Mediciones
          </Link>
        </p>
      ) : null}

      {insights.allNormal ? (
        <p className="mt-2 flex items-start gap-2 rounded-2xl bg-emerald-50 p-3 text-base font-semibold leading-5 text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Tus valores no están en alerta. Sigue con una alimentación balanceada.
        </p>
      ) : null}

      {current ? (
        <>
          {insights.metricInsights.length > 1 ? (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Indicador">
              {insights.metricInsights.map((item) => (
                <button
                  key={item.metric}
                  type="button"
                  onClick={() => setMetric(item.metric)}
                  aria-pressed={item.metric === current.metric}
                  className={`min-h-11 rounded-full border-2 px-4 py-1.5 text-base font-semibold transition active:scale-95 ${item.metric === current.metric ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white text-ink"}`}
                >
                  {item.metric === "TRIGLYCERIDES" ? "Triglicéridos" : item.metric}
                </button>
              ))}
            </div>
          ) : null}
          <div key={current.metric} className={`ant-rise mt-2 rounded-2xl p-3 ${current.tone === "danger" ? "bg-rose-50" : "bg-amber-50"}`}>
            <p className="text-base font-bold leading-5 text-ink">{current.title}</p>
            <p className="mt-1 text-base leading-6 text-ink">{current.message}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-emerald-800">Prioriza</p>
            {row(current.goodIds)}
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-rose-800">Evita</p>
            {row(current.avoidIds)}
          </div>
        </>
      ) : null}

      {insights.medicationNotes.length > 0 ? (
        <div className="mt-2 rounded-2xl bg-amber-50">
          <button type="button" onClick={() => setMedsOpen(!medsOpen)} aria-expanded={medsOpen} className="flex min-h-12 w-full items-center gap-2 p-3 text-left text-base font-bold text-amber-950">
            <Pill className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1">Sobre tus medicinas ({insights.medicationNotes.length})</span>
            <ChevronDown className="ant-chevron h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
          <Expand open={medsOpen}>
            <ul className="space-y-2 px-3 pb-3">
              {insights.medicationNotes.map((note, index) => (
                <li key={`${note.medicationName}-${index}`} className="flex items-start gap-2 text-base leading-6 text-amber-950">
                  <AlertTriangle className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0">{note.message}</span>
                </li>
              ))}
            </ul>
          </Expand>
        </div>
      ) : null}
    </section>
  );
}

// Foto de un cambio fácil: ocupa todo su espacio, con el nombre debajo.
function SwapPhoto({ item, onOpen }: { item: DietItem; onOpen: (event: MouseEvent<HTMLElement>) => void }) {
  return (
    <button type="button" onClick={onOpen} aria-haspopup="dialog" className="group block w-full text-center">
      <span className="relative block overflow-hidden rounded-2xl bg-white">
        <FoodImage id={item.id} size={240} fill rounded="rounded-2xl" className="transition duration-500 group-hover:scale-105 group-active:scale-[0.97] motion-reduce:transform-none" />
        <span className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-soft" aria-hidden="true">
          <span className={`h-4 w-4 rounded-full ${LIGHT[item.level].dot}`} />
        </span>
      </span>
      <span className="mt-1 block text-base font-bold leading-5 text-ink [overflow-wrap:anywhere]">{item.name}</span>
    </button>
  );
}

function Swaps({ allergyMatches, shopping, onShopping, openFood }: { allergyMatches: Record<string, string[]>; shopping: Set<string>; onShopping: (ids: string[], on: boolean) => void; openFood: ReturnType<typeof useFoodDialog>["open"] }) {
  const pairs = SWAPS.filter(([, better]) => !allergyMatches[better])
    .map(([worse, better]) => [DIET_ITEM_BY_ID.get(worse), DIET_ITEM_BY_ID.get(better)] as const)
    .filter((pair): pair is readonly [DietItem, DietItem] => Boolean(pair[0] && pair[1]));

  return (
    <section className="ant-rise ab-card rounded-[1.75rem] p-4">
      <h3 className="text-lg font-bold text-ink">Cambios fáciles</h3>
      <p className="text-sm leading-5 text-muted">Pequeños cambios que ayudan a tu colesterol.</p>
      <ul className="mt-2 grid gap-2 md:grid-cols-2">
        {pairs.map(([worse, better], index) => {
          const inList = shopping.has(better.id);
          return (
            <li key={worse.id} className="ant-rise grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 rounded-3xl bg-white p-2" style={{ "--i": index } as CSSProperties}>
              <SwapPhoto item={worse} onOpen={(event) => openFood(event, worse.id)} />
              <ArrowRight className="diet-nudge h-8 w-8 shrink-0 text-emerald-700" aria-label="cámbialo por" />
              <div className="relative">
                <SwapPhoto item={better} onOpen={(event) => openFood(event, better.id)} />
                <ShoppingToggle on={inList} name={better.name} onToggle={() => onShopping([better.id], !inList)} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type PhotoSize = "big" | "medium" | "small";

const PHOTO_SIZES: { key: PhotoSize; label: string; grid: string; text: string }[] = [
  { key: "big", label: "grandes", grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", text: "text-xl leading-6" },
  { key: "medium", label: "medianas", grid: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", text: "text-base leading-5" },
  { key: "small", label: "pequeñas", grid: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6", text: "text-sm leading-4" }
];
const SIZE_STORAGE_KEY = "dietas-tamano-fotos";

// Tarjeta con la foto y el nombre; al tocarla se abre la información completa.
function FoodCard({
  item,
  index,
  forYou,
  flagged,
  inList,
  onOpen,
  onShopping,
  textClass
}: {
  item: DietItem;
  index: number;
  forYou: boolean;
  flagged: boolean;
  inList: boolean;
  onOpen: (event: MouseEvent<HTMLElement>) => void;
  onShopping: () => void;
  textClass: string;
}) {
  return (
    <li className={`ant-pop relative overflow-hidden rounded-3xl border-2 bg-white ${flagged ? "border-rose-300" : forYou ? "border-emerald-400" : "border-black/10"}`} style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={onOpen} aria-haspopup="dialog" className="group block w-full text-left">
        <span className="relative block overflow-hidden bg-white">
          <FoodImage id={item.id} size={320} fill rounded="rounded-none" className="transition duration-500 group-hover:scale-105 group-active:scale-[0.97] motion-reduce:transform-none" />
          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-soft">
            {flagged ? <ShieldAlert className="h-4 w-4 text-rose-700" aria-hidden="true" /> : <span className={`h-4 w-4 rounded-full ${LIGHT[item.level].dot}`} aria-hidden="true" />}
          </span>
          {forYou ? <span className="absolute bottom-2 left-2 rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white">Para ti</span> : null}
        </span>
        <span className="block px-2.5 py-2">
          <span className={`block font-bold text-ink [overflow-wrap:anywhere] ${textClass}`}>{item.name}</span>
        </span>
      </button>
      <ShoppingToggle on={inList} name={item.name} onToggle={onShopping} />
    </li>
  );
}

const QUIZ_ROUNDS = 6;

function LightQuiz() {
  const [deck, setDeck] = useState<DietItem[] | null>(null);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<TrafficLight | null>(null);
  const [score, setScore] = useState(0);

  const start = () => {
    const pool = DIET_ITEMS.filter((item) => item.category !== "others");
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, QUIZ_ROUNDS);
    setDeck(shuffled);
    setRound(0);
    setPicked(null);
    setScore(0);
  };

  const item = deck?.[round];
  const finished = deck !== null && round >= deck.length;

  return (
    <section className="ant-rise ab-card relative overflow-hidden rounded-[1.75rem] p-4">
      {finished && score === QUIZ_ROUNDS ? <Confetti /> : null}
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Gamepad2 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        ¿De qué color es?
      </h3>

      {deck === null ? (
        <>
          <p className="mt-1 text-base leading-6 text-muted">Adivina el color del semáforo de cada alimento.</p>
          <button type="button" onClick={start} className="mt-3 min-h-14 w-full rounded-full bg-emerald-700 px-5 py-3 text-lg font-bold text-white shadow-soft transition active:scale-[0.98]">
            Jugar
          </button>
        </>
      ) : finished ? (
        <div className="ant-pop mt-3 text-center">
          <p className="text-4xl font-bold tabular-nums text-emerald-800">
            {score} de {QUIZ_ROUNDS}
          </p>
          <p className="mt-1 text-base font-semibold text-ink">{score === QUIZ_ROUNDS ? "¡Perfecto!" : score >= QUIZ_ROUNDS / 2 ? "¡Muy bien!" : "¡Cada intento te enseña algo!"}</p>
          <button type="button" onClick={start} className="mt-3 min-h-12 w-full rounded-full bg-emerald-700 px-4 py-2 text-base font-bold text-white transition active:scale-[0.98]">
            Jugar otra vez
          </button>
        </div>
      ) : item ? (
        <div key={round} className="pln-flip mt-2">
          <div className="flex items-center gap-3">
            <FoodImage id={item.id} size={88} rounded="rounded-2xl" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-muted tabular-nums">
                {round + 1} de {QUIZ_ROUNDS}
              </p>
              <p className="text-2xl font-bold leading-7 text-ink">{item.name}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
            {(["green", "yellow", "red"] as TrafficLight[]).map((level) => {
              const chosen = picked === level;
              const right = picked !== null && level === item.level;
              return (
                <button
                  key={level}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(level);
                    if (level === item.level) setScore(score + 1);
                  }}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-2 text-base font-bold leading-5 transition active:scale-95 ${
                    right ? LIGHT[level].chip : chosen ? "border-slate-400 bg-slate-200 text-slate-700" : "border-black/10 bg-white text-ink"
                  }`}
                >
                  <span className={`h-4 w-4 shrink-0 rounded-full ${LIGHT[level].dot}`} aria-hidden="true" />
                  {LIGHT[level].label}
                </button>
              );
            })}
          </div>
          {picked !== null ? (
            <>
              <p className={`ant-pop mt-2 rounded-2xl p-3 text-base leading-6 ${picked === item.level ? "bg-emerald-100 text-emerald-950" : "bg-amber-100 text-amber-950"}`}>
                <span className="font-bold">{picked === item.level ? "¡Correcto! " : "Casi. "}</span>
                {item.why}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRound(round + 1);
                  setPicked(null);
                }}
                className="mt-2 min-h-12 w-full rounded-full bg-emerald-700 px-4 py-2 text-base font-bold text-white transition active:scale-[0.98]"
              >
                Siguiente
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function DietGuide({
  insights,
  allergyMatches,
  shopping,
  onShopping
}: {
  insights: DietInsights;
  allergyMatches: Record<string, string[]>;
  shopping: Set<string>;
  onShopping: (ids: string[], on: boolean) => void;
}) {
  const [category, setCategory] = useState<Category>("foods-good");
  const [light, setLight] = useState<Light>("all");
  const [query, setQuery] = useState("");
  const [hideAllergens, setHideAllergens] = useState(true);
  const [sortByName, setSortByName] = useState(false);
  const [photoSize, setPhotoSize] = useState<PhotoSize>("medium");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIZE_STORAGE_KEY);
      if (saved === "big" || saved === "medium" || saved === "small") setPhotoSize(saved);
    } catch {
      // Sin almacenamiento se usa el tamaño mediano.
    }
  }, []);

  const sizeInfo = PHOTO_SIZES.find((item) => item.key === photoSize) ?? PHOTO_SIZES[1];
  const nextSize = PHOTO_SIZES[(PHOTO_SIZES.indexOf(sizeInfo) + 1) % PHOTO_SIZES.length];
  const changeSize = () => {
    setPhotoSize(nextSize.key);
    try {
      window.localStorage.setItem(SIZE_STORAGE_KEY, nextSize.key);
    } catch {
      // Ver arriba.
    }
  };
  const gridRef = useRef<HTMLDivElement>(null);
  const { open, dialog } = useFoodDialog(allergyMatches);

  const focusSet = useMemo(() => new Set(insights.focusIds), [insights.focusIds]);
  const hasAllergies = Object.keys(allergyMatches).length > 0;
  const searching = query.trim() !== "";

  const inCategory = useMemo(() => {
    if (searching) {
      const needle = normalize(query.trim());
      return DIET_ITEMS.filter((item) => normalize(`${item.name} ${item.why}`).includes(needle));
    }
    if (category === "list") return DIET_ITEMS.filter((item) => shopping.has(item.id));
    if (category === "all") return DIET_ITEMS;
    return DIET_ITEMS.filter((item) => item.category === category);
  }, [category, query, searching, shopping]);

  const allowed = hideAllergens ? inCategory.filter((item) => !allergyMatches[item.id]) : inCategory;
  const hiddenCount = inCategory.length - allowed.length;
  const visible = allowed
    .filter((item) => light === "all" || item.level === light)
    .sort((a, b) => (sortByName ? a.name.localeCompare(b.name, "es") : Number(focusSet.has(b.id)) - Number(focusSet.has(a.id))));

  // Al cambiar de filtro, vuelve al inicio de la lista si ya se había bajado.
  const backToGrid = () => {
    const grid = gridRef.current;
    if (grid && grid.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      grid.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const counts = (level: TrafficLight) => DIET_ITEMS.filter((item) => item.level === level).length;

  return (
    <div className="space-y-4">
      <Hero
        tone="emerald"
        art={<FruitPlate className="h-full w-full" />}
        title="Guía de alimentación"
        text="Toca un alimento para saber por qué conviene y cuánto comer."
        stats={[
          { label: "Con frecuencia", value: counts("green") },
          { label: "Moderación", value: counts("yellow") },
          { label: "Evitar", value: counts("red") }
        ]}
      />

      <ForYou insights={insights} allergyMatches={allergyMatches} openFood={open} />

      <section aria-label="Alimentos y bebidas">
        <div className={STICKY_BAR}>
          <div className="flex items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar: avena, gaseosa…"
                aria-label="Buscar un alimento o bebida"
                className="min-h-12 w-full rounded-full border border-black/10 bg-white py-2 pl-12 pr-4 text-base text-ink outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            {searching ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Borrar búsqueda" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft transition active:scale-90">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={changeSize}
              aria-label={`Fotos ${sizeInfo.label}. Toca para verlas ${nextSize.label}`}
              title="Cambiar el tamaño de las fotos"
              className="flex h-12 shrink-0 items-center gap-1 rounded-full bg-white px-3 text-ink shadow-soft transition active:scale-90"
            >
              {photoSize === "big" ? <Square className="h-6 w-6" aria-hidden="true" /> : photoSize === "medium" ? <LayoutGrid className="h-6 w-6" aria-hidden="true" /> : <Grid3x3 className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
          <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Categoría">
            {CATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = !searching && category === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory(item.key);
                    backToGrid();
                  }}
                  aria-pressed={active}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-base font-semibold transition active:scale-95 ${active ? "border-emerald-700 bg-emerald-700 text-white shadow-soft" : "border-black/10 bg-white text-ink"}`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.label}
                  {item.key === "list" ? <span className={active ? "text-white/85" : "text-muted"}>{shopping.size}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={gridRef} className="scroll-mt-48 space-y-3 pt-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Semáforo">
            {(["all", "green", "yellow", "red"] as Light[]).map((level) => {
              const active = light === level;
              const count = level === "all" ? allowed.length : allowed.filter((item) => item.level === level).length;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setLight(level)}
                  aria-pressed={active}
                  className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold transition active:scale-95 ${active ? (level === "all" ? "border-ink bg-ink text-white" : LIGHT[level].chip) : "border-black/10 bg-white text-ink"}`}
                >
                  {level !== "all" ? <span className={`h-3 w-3 rounded-full ${LIGHT[level].dot}`} aria-hidden="true" /> : null}
                  {level === "all" ? "Todos" : LIGHT[level].label}
                  <span className="opacity-80">{count}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setSortByName(!sortByName)} className="min-h-11 rounded-full border-2 border-black/10 bg-white px-3 py-1 text-sm font-semibold text-ink transition active:scale-95">
              {sortByName ? "Orden: A-Z" : "Orden: para ti"}
            </button>
          </div>

          {hasAllergies ? (
            <button
              type="button"
              role="switch"
              aria-checked={hideAllergens}
              onClick={() => setHideAllergens(!hideAllergens)}
              className="flex min-h-12 w-full items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-left text-base font-semibold leading-5 text-rose-900 transition active:scale-[0.99]"
            >
              <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">Ocultar lo relacionado con mis alergias{hiddenCount > 0 && hideAllergens ? ` (${hiddenCount} oculto${hiddenCount === 1 ? "" : "s"})` : ""}</span>
              <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${hideAllergens ? "bg-rose-600" : "bg-slate-300"}`} aria-hidden="true">
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all motion-reduce:transition-none ${hideAllergens ? "left-7" : "left-1"}`} />
              </span>
            </button>
          ) : null}

          {searching ? <p className="text-base font-semibold text-muted">{visible.length} resultado(s) para «{query.trim()}»</p> : null}

          {visible.length === 0 ? (
            <p className="rounded-2xl bg-white px-4 py-8 text-center text-base font-semibold text-muted">
              {category === "list" && !searching ? "Tu lista está vacía. Toca + en un alimento para agregarlo." : hiddenCount > 0 ? "Lo que coincide está oculto por tus alergias." : "No encontré nada. Prueba con otra palabra."}
            </p>
          ) : (
            <ul key={photoSize} className={`grid gap-2.5 ${sizeInfo.grid}`}>
              {visible.map((item, index) => (
                <FoodCard
                  key={`${category}-${light}-${item.id}`}
                  item={item}
                  index={index}
                  forYou={focusSet.has(item.id)}
                  flagged={Boolean(allergyMatches[item.id])}
                  inList={shopping.has(item.id)}
                  onOpen={(event) => open(event, item.id)}
                  onShopping={() => onShopping([item.id], !shopping.has(item.id))}
                  textClass={sizeInfo.text}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <Swaps allergyMatches={allergyMatches} shopping={shopping} onShopping={onShopping} openFood={open} />
      <LightQuiz />

      <p className="flex items-start gap-2 text-sm leading-5 text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Esta información es general y no reemplaza la indicación de tu médico o nutricionista.
      </p>
      {!insights.hasMedications ? (
        <p className="text-sm leading-5 text-muted">
          Si registras tus medicamentos, también te avisaremos de posibles interacciones con alimentos.{" "}
          <Link href="/medicamentos?tab=botiquin" className="font-semibold text-accent underline">
            Ir a Medicamentos
          </Link>
        </p>
      ) : null}
      {FOOD_IMAGE_CREDIT ? <p className="text-xs leading-5 text-muted">{FOOD_IMAGE_CREDIT}</p> : null}
      {dialog}
    </div>
  );
}
