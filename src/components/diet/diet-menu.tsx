"use client";

import { useMemo, useRef, useState } from "react";
import {
  Apple,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  Moon,
  ShieldAlert,
  Sunrise,
  Users,
  Utensils
} from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { FoodDialog } from "@/components/diet/food-dialog";
import { FoodImage } from "@/components/diet/food-image";
import { FoodTiles } from "@/components/diet/food-tiles";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { MENU_DAYS, RECIPES, getAllergyMatches, type MealType } from "@/lib/diet-menu-data";

const MEAL_META: Record<MealType, { label: string; icon: typeof Apple }> = {
  desayuno: { label: "Desayuno", icon: Sunrise },
  colacion: { label: "Colación", icon: Apple },
  almuerzo: { label: "Almuerzo", icon: Utensils },
  cena: { label: "Cena", icon: Moon }
};

const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export function DietMenu({ allergyNames = [] }: { allergyNames?: string[] }) {
  const [dayKey, setDayKey] = useState(MENU_DAYS[0].key);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [foodId, setFoodId] = useState<string | null>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  // Alergias por alimento (para marcar cada ficha e ingrediente)
  const foodMatches = useMemo(() => findAllergenMatches(allergyNames), [allergyNames]);

  const day = MENU_DAYS.find((d) => d.key === dayKey) ?? MENU_DAYS[0];

  const openRecipe = (id: string) => {
    setExpandedId(id);
    requestAnimationFrame(() => {
      document.getElementById(`receta-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="space-y-6">
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

                <FoodTiles ids={item.foodIds} tone="neutral" allergyMatches={foodMatches} limit={12} />

                {flagged.length > 0 ? (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold leading-6 text-rose-900">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Puede contener algo relacionado con tu alergia: {flagged.join(", ")}. Cámbialo por otra opción.
                    </p>
                  </div>
                ) : null}

                {item.recipeId ? (
                  <button
                    type="button"
                    onClick={() => openRecipe(item.recipeId as string)}
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

      <SectionCard title="Recetas sencillas" description="Preparaciones cortas con ingredientes fáciles de conseguir.">
        <div className="space-y-3">
          {RECIPES.map((recipe) => {
            const open = expandedId === recipe.id;
            const flagged = getAllergyMatches(allergyNames, recipe.keywords);

            return (
              <article
                key={recipe.id}
                id={`receta-${recipe.id}`}
                className={`scroll-mt-4 rounded-3xl border ${
                  flagged.length > 0 ? "border-rose-200 bg-rose-50" : "border-black/5 bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : recipe.id)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 p-5 text-left"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{recipe.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {recipe.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {recipe.servings}
                      </span>
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-muted" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted" />
                  )}
                </button>

                {flagged.length > 0 ? (
                  <div className="mx-5 mb-5 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold leading-6 text-rose-900">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Puede contener algo relacionado con tu alergia: {flagged.join(", ")}.</p>
                  </div>
                ) : null}

                {open ? (
                  <div className="space-y-5 border-t border-black/5 p-5">
                    <div>
                      <p className="text-sm font-semibold text-ink">Ingredientes</p>
                      <ul className="mt-2 space-y-2">
                        {recipe.ingredientItems.map((ingredient) => {
                          const allergic = ingredient.foodId ? foodMatches[ingredient.foodId] : undefined;

                          if (!ingredient.foodId) {
                            return (
                              <li key={ingredient.text} className="text-base leading-7 text-ink">
                                {ingredient.text}
                              </li>
                            );
                          }

                          const id = ingredient.foodId;
                          return (
                            <li key={ingredient.text}>
                              <button
                                type="button"
                                aria-haspopup="dialog"
                                onClick={(event) => {
                                  returnRef.current = event.currentTarget;
                                  setFoodId(id);
                                }}
                                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus:ring-4 focus:ring-accent/15 ${
                                  allergic
                                    ? "border-rose-300 bg-rose-50 hover:bg-rose-100"
                                    : "border-black/5 bg-white hover:bg-slate-50"
                                }`}
                              >
                                <FoodImage id={id} size={36} rounded="rounded-xl" className="bg-slate-50" />
                                <span className="flex-1 text-base leading-7 text-ink">{ingredient.text}</span>
                                {allergic ? <ShieldAlert className="h-4 w-4 shrink-0 text-rose-700" /> : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-ink">Preparación</p>
                      <ol className="mt-2 list-decimal space-y-2 pl-5 text-base leading-7 text-ink">
                        {recipe.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {recipe.tip ? (
                      <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{recipe.tip}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </SectionCard>

      <FoodDialog
        foodId={foodId}
        allergies={foodId ? foodMatches[foodId] : undefined}
        onClose={() => setFoodId(null)}
        returnFocusRef={returnRef}
      />
    </div>
  );
}