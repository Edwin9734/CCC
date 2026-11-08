"use client";

import { useMemo, useState } from "react";
import { Apple, ChefHat, Moon, ShieldAlert, Sunrise, Utensils } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { FoodTiles } from "@/components/diet/food-tiles";
import { useSectionTabs } from "@/components/shell/section-tabs";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { MENU_DAYS, RECIPES, getAllergyMatches, type MealType } from "@/lib/diet-menu-data";

const MEAL_META: Record<MealType, { label: string; icon: typeof Apple }> = {
  desayuno: { label: "Desayuno", icon: Sunrise },
  colacion: { label: "Refacción", icon: Apple },
  almuerzo: { label: "Almuerzo", icon: Utensils },
  cena: { label: "Cena", icon: Moon }
};

const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

// ---------------------------------------------------------------------------
// Menú de ejemplo
// ---------------------------------------------------------------------------

export function DietMenu({ allergyNames = [] }: { allergyNames?: string[] }) {
  const tabs = useSectionTabs();
  const [dayKey, setDayKey] = useState(MENU_DAYS[0].key);

  // Alergias por alimento (para marcar cada ficha)
  const foodMatches = useMemo(() => findAllergenMatches(allergyNames), [allergyNames]);

  const day = MENU_DAYS.find((d) => d.key === dayKey) ?? MENU_DAYS[0];

  return (
    <SectionCard
      title="Menú de ejemplo"
      description="Una semana de ideas para comer con menos grasa saturada y más fibra. Elige un día y toca un alimento para ver su detalle."
    >
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {MENU_DAYS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDayKey(d.key)}
            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
              d.key === dayKey
                ? "border-accent bg-accent text-white shadow-soft"
                : "border-black/10 bg-white text-ink hover:bg-slate-50"
            }`}
          >
            {d.short}
          </button>
        ))}
      </div>

      <h3 className="mt-5 text-lg font-semibold text-ink">Menú del {day.label.toLowerCase()}</h3>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {day.meals.map((item) => {
          const meta = MEAL_META[item.type];
          const Icon = meta.icon;
          const recipe = item.recipeId ? RECIPE_BY_ID.get(item.recipeId) : undefined;
          const flagged = getAllergyMatches(allergyNames, [...item.keywords, ...(recipe?.keywords ?? [])]);

          return (
            <article
              key={item.type}
              className={`rounded-3xl border p-5 ${
                flagged.length > 0 ? "border-rose-200 bg-rose-50" : "border-black/5 bg-background"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                <Icon className="h-4 w-4" />
                {meta.label}
              </div>
              <p className="mt-2 text-base leading-7 text-ink">{item.text}</p>

              <FoodTiles ids={item.foodIds} allergyMatches={foodMatches} limit={12} narrow />

              {flagged.length > 0 ? (
                <div className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold leading-6 text-rose-900">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Puede contener algo relacionado con tu alergia: {flagged.join(", ")}. Cámbialo por otra opción.</p>
                </div>
              ) : null}

              {item.recipeId ? (
                <button
                  type="button"
                  onClick={() => tabs?.setActive("recetas", item.recipeId as string)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
                >
                  <ChefHat className="h-4 w-4" />
                  Ver receta
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-muted">
        Es un menú de ejemplo con porciones orientativas. Si tienes otras condiciones (como diabetes o problemas de
        riñón) o tu médico te indicó una dieta específica, sigue sus indicaciones.
      </p>
    </SectionCard>
  );
}
