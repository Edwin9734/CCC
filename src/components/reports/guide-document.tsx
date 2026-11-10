"use client";

import type { CSSProperties, ReactNode } from "react";
import { FoodImage } from "@/components/diet/food-image";
import { formatLongDate } from "@/lib/antecedentes";
import { DIET_ITEMS, DIET_ITEM_BY_ID, type DietCategory, type DietItem, type TrafficLight } from "@/lib/diet-data";
import type { DietInsights } from "@/lib/diet-insights";
import { MENU_DAYS, RECIPES, getAllergyMatches, type MealType } from "@/lib/diet-menu-data";
import { FOOD_IMAGE_CREDIT } from "@/lib/food-images";

export type GuideSectionKey = "insights" | "semaforo" | DietCategory | "swaps" | "menu" | "recipes" | "shopping";

export const GUIDE_SECTION_LABELS: Record<GuideSectionKey, string> = {
  insights: "Sugerencias para ti",
  semaforo: "Semáforo rápido",
  "foods-good": "Alimentos recomendados",
  "foods-avoid": "Alimentos a evitar",
  "drinks-good": "Bebidas recomendadas",
  "drinks-avoid": "Bebidas a evitar",
  others: "Verduras, cereales y condimentos",
  swaps: "Cambios fáciles",
  menu: "Menú de la semana",
  recipes: "Recetas",
  shopping: "Mi lista de compras"
};

const LIGHT: Record<TrafficLight, { dot: string; label: string; box: string; title: string }> = {
  green: { dot: "bg-emerald-500", label: "Con frecuencia", box: "border-emerald-300 bg-emerald-50", title: "text-emerald-900" },
  yellow: { dot: "bg-amber-500", label: "Con moderación", box: "border-amber-300 bg-amber-50", title: "text-amber-900" },
  red: { dot: "bg-rose-500", label: "Evitar", box: "border-rose-300 bg-rose-50", title: "text-rose-900" }
};

const MEAL_LABEL: Record<MealType, string> = { desayuno: "Desayuno", colacion: "Refacción", almuerzo: "Almuerzo", cena: "Cena" };
const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export interface GuideOptions {
  sections: GuideSectionKey[];
  photos: boolean;
  detail: boolean;
  large: boolean;
  title: string;
  days: string[];
  recipes: string[];
}

export interface GuideData {
  today: string;
  patientName: string | null;
  insights: DietInsights;
  allergyMatches: Record<string, string[]>;
  allergyNames: string[];
  hiddenIds: string[];
  liquidNotice: string | null;
  shoppingIds: string[];
  swaps: [string, string][];
}

function Block({ id, title, index, children }: { id: string; title: string; index: number; children: ReactNode }) {
  return (
    <section id={`guide-${id}`} className="ant-rise mt-[1.4em]" style={{ "--i": index } as CSSProperties}>
      <h2 className="print-keep-with-next mb-[0.5em] border-l-[5px] border-emerald-600 pl-[0.5em] text-[1.2em] font-bold leading-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function FoodLine({ item, photos, detail }: { item: DietItem; photos: boolean; detail: boolean }) {
  return (
    <li className="print-avoid-break flex gap-[0.6em] border-b border-slate-200 py-[0.4em]">
      {photos ? <FoodImage id={item.id} size={44} eager rounded="rounded-lg" className="h-[2.8em] w-[2.8em]" /> : null}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-[0.4em] font-bold text-slate-900">
          <span className={`inline-block h-[0.7em] w-[0.7em] rounded-full ${LIGHT[item.level].dot}`} aria-hidden="true" />
          {item.name}
          <span className="text-[0.8em] font-semibold text-slate-500">· {LIGHT[item.level].label}</span>
        </p>
        {detail ? (
          <>
            <p className="text-[0.9em] leading-snug text-slate-700">{item.why}</p>
            <p className="text-[0.8em] leading-snug text-slate-500">
              <span className="font-semibold text-slate-700">Porción: </span>
              {item.portion}
            </p>
            {item.warning ? <p className="text-[0.8em] font-semibold leading-snug text-amber-800">Atención: {item.warning}</p> : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

export function GuideDocument({ data, options }: { data: GuideData; options: GuideOptions }) {
  const allowed = (item: DietItem) => !data.allergyMatches[item.id] && !data.hiddenIds.includes(item.id);
  const nameOf = (id: string) => DIET_ITEM_BY_ID.get(id)?.name ?? id;

  const render = (key: GuideSectionKey, index: number) => {
    const title = GUIDE_SECTION_LABELS[key];
    switch (key) {
      case "insights":
        return (
          <Block key={key} id={key} title={title} index={index}>
            {data.insights.metricInsights.length === 0 && data.insights.medicationNotes.length === 0 ? (
              <p className="text-[0.9em] text-slate-600">Tus valores no están en alerta: sigue con una alimentación balanceada.</p>
            ) : null}
            <div className="grid gap-[0.5em]">
              {data.insights.metricInsights.map((insight) => (
                <div key={insight.metric} className="print-avoid-break rounded-xl border border-slate-200 p-[0.6em] text-[0.9em]">
                  <p className="font-bold text-slate-900">{insight.title}</p>
                  <p className="text-slate-700">{insight.message}</p>
                  <p className="mt-[0.3em]">
                    <span className="font-semibold text-emerald-800">Prioriza: </span>
                    {insight.goodIds.filter((id) => !data.allergyMatches[id]).map(nameOf).join(", ")}
                  </p>
                  <p>
                    <span className="font-semibold text-rose-800">Evita: </span>
                    {insight.avoidIds.map(nameOf).join(", ")}
                  </p>
                </div>
              ))}
              {data.insights.medicationNotes.length > 0 ? (
                <div className="print-avoid-break rounded-xl border border-amber-300 bg-amber-50 p-[0.6em] text-[0.9em]">
                  <p className="font-bold text-amber-900">Sobre tus medicinas</p>
                  <ul className="list-disc pl-[1.2em]">
                    {data.insights.medicationNotes.map((note, noteIndex) => (
                      <li key={`${note.medicationName}-${noteIndex}`}>{note.message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Block>
        );
      case "semaforo":
        return (
          <Block key={key} id={key} title={title} index={index}>
            <div className="grid gap-[0.5em] sm:grid-cols-3">
              {(["green", "yellow", "red"] as TrafficLight[]).map((level) => (
                <div key={level} className={`print-avoid-break rounded-xl border-2 p-[0.6em] ${LIGHT[level].box}`}>
                  <p className={`mb-[0.3em] flex items-center gap-[0.4em] font-bold ${LIGHT[level].title}`}>
                    <span className={`inline-block h-[0.9em] w-[0.9em] rounded-full ${LIGHT[level].dot}`} aria-hidden="true" />
                    {LIGHT[level].label}
                  </p>
                  <p className="text-[0.85em] leading-snug text-slate-800">
                    {DIET_ITEMS.filter((item) => item.level === level && allowed(item))
                      .map((item) => item.name)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Block>
        );
      case "foods-good":
      case "foods-avoid":
      case "drinks-good":
      case "drinks-avoid":
      case "others":
        return (
          <Block key={key} id={key} title={title} index={index}>
            <ul className={options.detail ? "" : "grid gap-x-[1em] sm:grid-cols-2"}>
              {DIET_ITEMS.filter((item) => item.category === key && allowed(item)).map((item) => (
                <FoodLine key={item.id} item={item} photos={options.photos} detail={options.detail} />
              ))}
            </ul>
          </Block>
        );
      case "swaps":
        return (
          <Block key={key} id={key} title={title} index={index}>
            <ul className="grid gap-[0.4em] sm:grid-cols-2">
              {data.swaps
                .filter(([, better]) => !data.allergyMatches[better])
                .map(([worse, better]) => (
                  <li key={worse} className="print-avoid-break flex items-center gap-[0.5em] rounded-xl border border-slate-200 p-[0.4em] text-[0.9em]">
                    {options.photos ? <FoodImage id={worse} size={36} eager rounded="rounded-md" className="h-[2.2em] w-[2.2em]" /> : null}
                    <span className="min-w-0 font-semibold text-rose-800 line-through decoration-2">{nameOf(worse)}</span>
                    <span aria-hidden="true">→</span>
                    {options.photos ? <FoodImage id={better} size={36} eager rounded="rounded-md" className="h-[2.2em] w-[2.2em]" /> : null}
                    <span className="min-w-0 font-bold text-emerald-800">{nameOf(better)}</span>
                  </li>
                ))}
            </ul>
          </Block>
        );
      case "menu":
        return (
          <Block key={key} id={key} title={title} index={index}>
            {options.days.length === 0 ? <p className="text-[0.9em] text-slate-500">Elige al menos un día.</p> : null}
            <div className="grid gap-[0.5em]">
              {MENU_DAYS.filter((day) => options.days.includes(day.key)).map((day) => (
                <div key={day.key} className="print-avoid-break rounded-xl border border-slate-200 p-[0.6em] text-[0.9em]">
                  <p className="font-bold text-orange-800">{day.label}</p>
                  <ul>
                    {day.meals.map((meal) => {
                      const recipe = meal.recipeId ? RECIPE_BY_ID.get(meal.recipeId) : undefined;
                      const flagged = getAllergyMatches(data.allergyNames, [...meal.keywords, ...(recipe?.keywords ?? [])]);
                      return (
                        <li key={meal.type}>
                          <span className="font-semibold">{MEAL_LABEL[meal.type]}: </span>
                          {meal.text}
                          {flagged.length > 0 ? <span className="font-semibold text-rose-800"> (Revisar alergia: {flagged.join(", ")})</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Block>
        );
      case "recipes":
        return (
          <Block key={key} id={key} title={title} index={index}>
            {options.recipes.length === 0 ? <p className="text-[0.9em] text-slate-500">Elige al menos una receta.</p> : null}
            <div className="grid gap-[0.6em]">
              {RECIPES.filter((recipe) => options.recipes.includes(recipe.id)).map((recipe) => {
                const flagged = getAllergyMatches(data.allergyNames, recipe.keywords);
                return (
                  <article key={recipe.id} className="print-avoid-break rounded-xl border border-slate-200 p-[0.6em] text-[0.9em]">
                    <p className="text-[1.1em] font-bold text-slate-900">{recipe.name}</p>
                    <p className="text-[0.85em] text-slate-500">
                      {recipe.time} · {recipe.servings}
                    </p>
                    {flagged.length > 0 ? <p className="font-semibold text-rose-800">Revisar alergia: {flagged.join(", ")}</p> : null}
                    <div className="mt-[0.3em] grid gap-[0.6em] sm:grid-cols-2">
                      <div>
                        <p className="font-bold">Ingredientes</p>
                        <ul className="list-disc pl-[1.2em]">
                          {recipe.ingredients.map((ingredient) => (
                            <li key={ingredient}>{ingredient}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold">Preparación</p>
                        <ol className="list-decimal pl-[1.2em]">
                          {recipe.steps.map((stepText) => (
                            <li key={stepText}>{stepText}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    {recipe.tip ? (
                      <p className="mt-[0.3em] text-[0.85em]">
                        <span className="font-semibold">Consejo: </span>
                        {recipe.tip}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </Block>
        );
      case "shopping": {
        const items = data.shoppingIds.map((id) => DIET_ITEM_BY_ID.get(id)).filter((item): item is DietItem => Boolean(item));
        return (
          <Block key={key} id={key} title={title} index={index}>
            {items.length === 0 ? (
              <p className="text-[0.9em] text-slate-500">Tu lista está vacía. Agrega alimentos con el + en Dietas o en Mi plan.</p>
            ) : (
              <ul className="grid gap-x-[1em] gap-y-[0.3em] sm:grid-cols-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-[0.5em] border-b border-dashed border-slate-300 py-[0.3em]">
                    <span className="inline-block h-[1em] w-[1em] shrink-0 rounded border-2 border-slate-500" aria-hidden="true" />
                    {options.photos ? <FoodImage id={item.id} size={32} eager rounded="rounded-md" className="h-[1.8em] w-[1.8em]" /> : null}
                    <span className="font-semibold">{item.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
        );
      }
    }
  };

  return (
    <article id="guide-print-content" data-large={options.large} className="report-paper bg-white text-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-[0.6em] border-b-[3px] border-emerald-600 pb-[0.6em]">
        <div className="min-w-0">
          <p className="text-[0.8em] font-bold uppercase tracking-wider text-emerald-700">Control de Colesterol</p>
          <h1 className="text-[1.6em] font-bold leading-tight">{options.title}</h1>
          {data.patientName ? <p className="font-semibold text-slate-700">{data.patientName}</p> : null}
        </div>
        <p className="text-right text-[0.8em] text-slate-600">{formatLongDate(data.today)}</p>
      </header>

      {data.liquidNotice ? <p className="mt-[0.6em] rounded-lg bg-amber-50 p-[0.5em] text-[0.8em] font-semibold text-amber-900">{data.liquidNotice}</p> : null}
      {data.allergyNames.length > 0 ? (
        <p className="mt-[0.5em] text-[0.8em] text-slate-700">
          <span className="font-semibold">Alergias: </span>
          {data.allergyNames.join(", ")}. Lo relacionado se quitó de las listas.
        </p>
      ) : null}

      {options.sections.length === 0 ? <p className="py-[3em] text-center text-slate-500">Elige al menos una sección.</p> : options.sections.map((key, index) => render(key, index))}

      <p className="mt-[1.6em] border-t border-slate-200 pt-[0.5em] text-[0.7em] leading-snug text-slate-500">
        Información general: no reemplaza la indicación de tu médico o nutricionista.{FOOD_IMAGE_CREDIT ? ` ${FOOD_IMAGE_CREDIT}` : ""}
      </p>
    </article>
  );
}
