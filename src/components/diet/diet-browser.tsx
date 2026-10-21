"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Apple, Ban, CupSoda, GlassWater, Info, Search, ShieldAlert } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { DIET_ITEMS, type DietCategory, type TrafficLight } from "@/lib/diet-data";

const TABS: { key: DietCategory; label: string; icon: typeof Apple }[] = [
  { key: "foods-good", label: "Alimentos recomendados", icon: Apple },
  { key: "foods-avoid", label: "Alimentos a evitar", icon: Ban },
  { key: "drinks-good", label: "Bebidas recomendadas", icon: GlassWater },
  { key: "drinks-avoid", label: "Bebidas a evitar", icon: CupSoda }
];

const CATEGORY_LABEL: Record<DietCategory, string> = {
  "foods-good": "Alimento recomendado",
  "foods-avoid": "Alimento a evitar",
  "drinks-good": "Bebida recomendada",
  "drinks-avoid": "Bebida a evitar"
};

const LIGHTS: Record<TrafficLight, { label: string; card: string; badge: string; dot: string }> = {
  green: {
    label: "Consumir con frecuencia",
    card: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500"
  },
  yellow: {
    label: "Con moderación",
    card: "border-amber-200 bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500"
  },
  red: {
    label: "Evitar",
    card: "border-rose-200 bg-rose-50",
    badge: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500"
  }
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function DietBrowser({
  focusIds = [],
  allergyMatches = {}
}: {
  focusIds?: string[];
  allergyMatches?: Record<string, string[]>;
}) {
  const [tab, setTab] = useState<DietCategory>("foods-good");
  const [query, setQuery] = useState("");
  const [hideAllergens, setHideAllergens] = useState(true);

  const focusSet = useMemo(() => new Set(focusIds), [focusIds]);
  const hasAllergyMatches = Object.keys(allergyMatches).length > 0;
  const searching = query.trim().length > 0;

  const baseItems = useMemo(() => {
    if (searching) {
      const q = normalize(query.trim());
      return DIET_ITEMS.filter((item) => normalize(`${item.name} ${item.why}`).includes(q));
    }
    return DIET_ITEMS.filter((item) => item.category === tab);
  }, [query, searching, tab]);

  const items = hideAllergens ? baseItems.filter((item) => !allergyMatches[item.id]) : baseItems;
  const hiddenCount = baseItems.length - items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Esta información es general y no reemplaza la indicación de tu médico o nutricionista. Si tienes dudas sobre
          tu alimentación, consúltalas con ellos.
        </p>
      </div>

      <SectionCard
        title="Guía de alimentación"
        description="Busca un alimento o bebida, o explora por categoría. El semáforo te indica qué tan conveniente es."
      >
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-4">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar (ej. avena, gaseosa, huevo)"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = !searching && tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setQuery("");
                  setTab(t.key);
                }}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center text-sm font-semibold transition ${
                  active
                    ? "border-accent bg-accent text-white shadow-soft"
                    : "border-black/10 bg-white text-ink hover:bg-slate-50"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          {(Object.keys(LIGHTS) as TrafficLight[]).map((key) => (
            <span key={key} className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${LIGHTS[key].dot}`} />
              {LIGHTS[key].label}
            </span>
          ))}
        </div>

        {hasAllergyMatches ? (
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
            <input
              type="checkbox"
              checked={hideAllergens}
              onChange={() => setHideAllergens((v) => !v)}
              className="h-5 w-5 accent-accent"
            />
            Ocultar alimentos y bebidas relacionados con mis alergias
          </label>
        ) : null}

        {searching ? (
          <p className="mt-4 text-sm font-semibold text-muted">
            {items.length} resultado(s) para &quot;{query.trim()}&quot;
          </p>
        ) : null}

        {hideAllergens && hiddenCount > 0 ? (
          <p className="mt-2 text-xs text-muted">Se ocultaron {hiddenCount} elemento(s) por tus alergias registradas.</p>
        ) : null}

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-black/5 bg-white px-4 py-8 text-center text-sm text-muted">
            {hiddenCount > 0
              ? "Todo lo que coincide está oculto por tus alergias registradas."
              : "No encontramos resultados. Prueba con otra palabra."}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {items.map((item) => {
              const light = LIGHTS[item.level];
              const forYou = focusSet.has(item.id);
              const flagged = allergyMatches[item.id];
              return (
                <article
                  key={item.id}
                  className={`rounded-3xl border p-5 ${light.card} ${forYou ? "ring-2 ring-accent" : ""}`}
                >
                  {forYou ? (
                    <span className="mb-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                      Para ti
                    </span>
                  ) : null}

                  {flagged ? (
                    <div className="mb-3 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold text-rose-900">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>Posible alergia: {flagged.join(", ")}</p>
                    </div>
                  ) : null}

                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${light.badge}`}>
                      {light.label}
                    </span>
                  </div>

                  {searching ? (
                    <p className="mt-1 text-xs font-semibold text-muted">{CATEGORY_LABEL[item.category]}</p>
                  ) : null}

                  <p className="mt-3 text-base leading-7 text-ink">{item.why}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    <span className="font-semibold text-ink">Porción o frecuencia: </span>
                    {item.portion}
                  </p>

                  {item.warning ? (
                    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-white/80 p-3 text-sm leading-6 text-amber-900">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>{item.warning}</p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}