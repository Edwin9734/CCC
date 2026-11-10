"use client";

import { useMemo, useState, type ReactNode } from "react";
import "@/components/antecedentes/antecedentes.css";
import "@/components/habits/habits.css";
import "@/components/plan/plan.css";
import "./diet.css";
import { SAVE_ERROR, useToast } from "@/components/antecedentes/antecedentes-ui";
import { DietGuide } from "@/components/diet/diet-guide";
import { DietMenu } from "@/components/diet/diet-menu";
import type { DietApi } from "@/components/diet/diet-ui";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import type { DietInsights } from "@/lib/diet-insights";
import type { MealType, MenuMeal } from "@/lib/diet-menu-data";
import { DIET_TABS } from "@/lib/section-tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createDiaryEntry } from "@/lib/supabase/food-diary";
import { createPlanApi } from "@/lib/supabase/plan-goals";

export function DietBoard({
  initialTab,
  allergiesPanel,
  recipesPanel,
  insights,
  allergyMatches,
  allergyNames,
  initialShopping,
  initialLogged,
  today,
  api: apiOverride
}: {
  initialTab: string;
  allergiesPanel: ReactNode;
  recipesPanel: ReactNode;
  insights: DietInsights;
  allergyMatches: Record<string, string[]>;
  allergyNames: string[];
  initialShopping: string[];
  initialLogged: MealType[];
  today: string;
  api?: DietApi;
}) {
  const api = useMemo<DietApi>(() => {
    if (apiOverride) return apiOverride;
    const supabase = createSupabaseBrowserClient();
    const plan = createPlanApi(supabase);
    return {
      setShopping: async (ids, on) => {
        for (const id of ids) await plan.setMark("shopping", id, on);
      },
      logMeal: async (meal, foodIds) => {
        await createDiaryEntry(supabase, { eaten_on: today, meal_type: meal, food_ids: foodIds });
      }
    };
  }, [apiOverride, today]);

  const [shopping, setShopping] = useState(() => new Set(initialShopping));
  const [logged, setLogged] = useState(() => new Set(initialLogged));
  const { toastElement, showToast } = useToast();

  // La lista de compras es la misma de Mi plan. Se ve al instante y se revierte si falla.
  const changeShopping = async (ids: string[], on: boolean) => {
    const changed = ids.filter((id) => shopping.has(id) !== on);
    if (changed.length === 0) return;
    const apply = (value: boolean) =>
      setShopping((current) => {
        const next = new Set(current);
        changed.forEach((id) => (value ? next.add(id) : next.delete(id)));
        return next;
      });
    apply(on);
    try {
      await api.setShopping(changed, on);
      showToast(on ? (changed.length === 1 ? "Agregado a tu lista de compras" : `${changed.length} alimentos agregados a tu lista`) : "Quitado de tu lista");
    } catch {
      apply(!on);
      showToast(SAVE_ERROR, true);
    }
  };

  const logMeal = async (meal: MenuMeal) => {
    try {
      await api.logMeal(meal.type, meal.foodIds);
      setLogged((current) => new Set(current).add(meal.type));
      showToast("¡Anotado en tu Diario!");
    } catch {
      showToast(SAVE_ERROR, true);
    }
  };

  return (
    <>
      <SectionTabs
        tabs={DIET_TABS}
        initialTab={initialTab}
        panels={{
          alergias: allergiesPanel,
          guia: (
            <WhenTabActive tab="guia">
              <DietGuide insights={insights} allergyMatches={allergyMatches} shopping={shopping} onShopping={changeShopping} />
            </WhenTabActive>
          ),
          menu: (
            <WhenTabActive tab="menu">
              <DietMenu allergyNames={allergyNames} today={today} shopping={shopping} loggedToday={logged} onShopping={changeShopping} onLogMeal={logMeal} />
            </WhenTabActive>
          ),
          recetas: recipesPanel
        }}
      />
      {toastElement}
    </>
  );
}
