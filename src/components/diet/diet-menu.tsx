"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import { Apple, BookOpenCheck, Check, ChefHat, ChevronLeft, ChevronRight, Moon, Shuffle, ShieldAlert, ShoppingBasket, Sunrise, Undo2, Utensils } from "lucide-react";
import { Hero } from "@/components/antecedentes/antecedentes-ui";
import { FoodAvatar, LightBar, MenuArt, STICKY_BAR, itemsOf, useFoodDialog } from "@/components/diet/diet-ui";
import { useSectionTabs } from "@/components/shell/section-tabs";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { MENU_DAYS, RECIPES, getAllergyMatches, type MealType, type MenuMeal } from "@/lib/diet-menu-data";
import { isoWeekday } from "@/lib/date-utils";

const MEAL_META: Record<MealType, { label: string; time: string; icon: typeof Apple; tile: string }> = {
  desayuno: { label: "Desayuno", time: "7:00", icon: Sunrise, tile: "bg-amber-100 text-amber-800" },
  colacion: { label: "Refacción", time: "10:00", icon: Apple, tile: "bg-rose-100 text-rose-700" },
  almuerzo: { label: "Almuerzo", time: "13:00", icon: Utensils, tile: "bg-emerald-100 text-emerald-800" },
  cena: { label: "Cena", time: "19:00", icon: Moon, tile: "bg-indigo-100 text-indigo-800" }
};

const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

// Otras ideas para la misma comida, tomadas de los demás días.
function alternativesFor(type: MealType, dayKey: string) {
  return MENU_DAYS.filter((day) => day.key !== dayKey).flatMap((day) => {
    const option = day.meals.find((item) => item.type === type);
    return option ? [{ meal: option, from: day.label }] : [];
  });
}

function MealCard({
  meal,
  from,
  index,
  allergyNames,
  foodMatches,
  shopping,
  logged,
  onOpenFood,
  onShuffle,
  onReset,
  onShopping,
  onLog
}: {
  meal: MenuMeal;
  from: string | null;
  index: number;
  allergyNames: string[];
  foodMatches: Record<string, string[]>;
  shopping: Set<string>;
  logged: boolean;
  onOpenFood: ReturnType<typeof useFoodDialog>["open"];
  onShuffle: () => void;
  onReset: () => void;
  onShopping: (ids: string[], on: boolean) => void;
  onLog: () => Promise<void>;
}) {
  const tabs = useSectionTabs();
  const [logging, setLogging] = useState(false);
  const meta = MEAL_META[meal.type];
  const Icon = meta.icon;
  const recipe = meal.recipeId ? RECIPE_BY_ID.get(meal.recipeId) : undefined;
  const flagged = getAllergyMatches(allergyNames, [...meal.keywords, ...(recipe?.keywords ?? [])]);
  const allInList = meal.foodIds.every((id) => shopping.has(id));

  const action = "flex min-h-12 flex-[1_1_8.5rem] items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2 text-base font-semibold leading-5 transition active:scale-95";

  return (
    <li className="ant-rise relative" style={{ "--i": index } as CSSProperties}>
      <article className={`overflow-hidden rounded-[1.75rem] border-2 bg-white ${flagged.length > 0 ? "border-rose-300" : "border-black/10"}`}>
        <div className="flex items-center gap-3 p-3 pb-1">
          <span className={`ant-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tile}`} aria-hidden="true">
            <Icon className="pln-updown h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-5 text-ink">{meta.label}</p>
            <p className="text-sm font-semibold text-muted">
              Cerca de las {meta.time}
              {from ? ` · Idea del ${from.toLowerCase()}` : ""}
            </p>
          </div>
          {logged ? (
            <span className="ant-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-label="Anotado hoy">
              <Check className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <div key={meal.text} className="ant-rise px-3">
          <p className="text-base leading-6 text-ink">{meal.text}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {itemsOf(meal.foodIds).map((item, itemIndex) => (
              <FoodAvatar key={item.id} item={item} index={itemIndex} flagged={Boolean(foodMatches[item.id])} onOpen={(event) => onOpenFood(event, item.id)} />
            ))}
          </div>
        </div>

        {flagged.length > 0 ? (
          <p className="mx-3 mt-2 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-base font-semibold leading-5 text-rose-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">Puede tener algo de tu alergia ({flagged.join(", ")}). Toca «Otra opción».</span>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 p-3">
          {meal.recipeId ? (
            <button type="button" onClick={() => tabs?.setActive("recetas", meal.recipeId as string)} className={`${action} border-orange-700 bg-orange-700 text-white`}>
              <ChefHat className="h-5 w-5 shrink-0" aria-hidden="true" />
              Ver receta
            </button>
          ) : null}
          <button
            type="button"
            disabled={logged || logging}
            onClick={async () => {
              setLogging(true);
              await onLog();
              setLogging(false);
            }}
            className={`${action} ${logged ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-emerald-700 bg-emerald-700 text-white"} disabled:cursor-default`}
          >
            {logged ? <Check className="h-5 w-5 shrink-0" aria-hidden="true" /> : <BookOpenCheck className="h-5 w-5 shrink-0" aria-hidden="true" />}
            {logged ? "Anotado hoy" : logging ? "Anotando…" : "Lo comí hoy"}
          </button>
          <button type="button" onClick={onShuffle} className={`${action} border-black/10 bg-white text-ink`}>
            <Shuffle className="h-5 w-5 shrink-0" aria-hidden="true" />
            Otra opción
          </button>
          <button type="button" onClick={() => onShopping(meal.foodIds, !allInList)} aria-pressed={allInList} className={`${action} ${allInList ? "border-emerald-700 bg-emerald-100 text-emerald-950" : "border-black/10 bg-white text-ink"}`}>
            <ShoppingBasket className="h-5 w-5 shrink-0" aria-hidden="true" />
            {allInList ? "En mi lista" : "A mi lista"}
          </button>
          {from ? (
            <button type="button" onClick={onReset} className={`${action} border-black/10 bg-white text-muted`}>
              <Undo2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              La original
            </button>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function DietMenu({
  allergyNames = [],
  today,
  shopping,
  loggedToday,
  onShopping,
  onLogMeal
}: {
  allergyNames?: string[];
  today: string;
  shopping: Set<string>;
  loggedToday: Set<MealType>;
  onShopping: (ids: string[], on: boolean) => void;
  onLogMeal: (meal: MenuMeal) => Promise<void>;
}) {
  const todayIndex = isoWeekday(today) - 1;
  const [dayIndex, setDayIndex] = useState(todayIndex);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [swaps, setSwaps] = useState<Record<string, number>>({});
  const touch = useRef<{ x: number; y: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const foodMatches = useMemo(() => findAllergenMatches(allergyNames), [allergyNames]);
  const { open, dialog } = useFoodDialog(foodMatches);
  const day = MENU_DAYS[dayIndex];

  const goTo = (next: number) => {
    const target = (next + MENU_DAYS.length) % MENU_DAYS.length;
    setDirection(target > dayIndex || (dayIndex === MENU_DAYS.length - 1 && target === 0) ? "next" : "prev");
    setDayIndex(target);
    const box = contentRef.current;
    if (box && box.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

  const meals = day.meals.map((original) => {
    const choice = swaps[`${day.key}|${original.type}`];
    if (choice === undefined) return { meal: original, from: null as string | null };
    const options = alternativesFor(original.type, day.key);
    const option = options[choice % options.length];
    return { meal: option.meal, from: option.from };
  });

  const dayFoods = itemsOf(Array.from(new Set(meals.flatMap((entry) => entry.meal.foodIds))));
  const allInList = dayFoods.every((item) => shopping.has(item.id));
  const recipes = meals.filter((entry) => entry.meal.recipeId).length;

  const onTouchStart = (event: TouchEvent) => {
    touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(dayIndex + (dx < 0 ? 1 : -1));
  };

  return (
    <div className="space-y-4">
      <Hero
        tone="orange"
        art={<MenuArt />}
        title="Menú de la semana"
        text="Ideas para comer con menos grasa y más fibra. Desliza para cambiar de día."
        stats={[
          { label: "Comidas", value: meals.length },
          { label: "Recetas", value: recipes },
          { label: "Alimentos", value: dayFoods.length }
        ]}
      />

      <section aria-label="Menú por día">
        <div className={STICKY_BAR}>
          <div className="grid grid-cols-7 gap-1" role="group" aria-label="Día de la semana">
            {MENU_DAYS.map((item, index) => {
              const active = index === dayIndex;
              const isToday = index === todayIndex;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-pressed={active}
                  aria-label={`${item.label}${isToday ? " (hoy)" : ""}`}
                  className={`relative flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 px-0.5 text-sm font-bold leading-4 transition active:scale-90 ${
                    active ? "border-orange-700 bg-orange-700 text-white shadow-soft" : isToday ? "border-orange-400 bg-orange-50 text-ink" : "border-black/10 bg-white text-ink"
                  }`}
                >
                  <span className="menu-day-long">{item.short}</span>
                  <span className="menu-day-short">{item.label.slice(0, 1)}</span>
                  {isToday ? <span className={`mt-0.5 text-[0.65rem] font-bold uppercase ${active ? "text-white/90" : "text-orange-800"}`}>Hoy</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={contentRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="scroll-mt-40 space-y-3 pt-3">
          <div key={day.key} className={`space-y-3 ${direction === "next" ? "menu-from-next" : "menu-from-prev"}`}>
            <div className="ab-card rounded-[1.75rem] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-ink">
                  {day.label}
                  {dayIndex === todayIndex ? " · hoy" : ""}
                </h3>
                <button
                  type="button"
                  onClick={() => onShopping(dayFoods.map((item) => item.id), !allInList)}
                  aria-pressed={allInList}
                  className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold transition active:scale-95 ${allInList ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white text-ink"}`}
                >
                  <ShoppingBasket className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {allInList ? "Día en mi lista" : "Todo el día a mi lista"}
                </button>
              </div>
              <div className="mt-2">
                <LightBar items={dayFoods} />
              </div>
            </div>

            <ol className="space-y-3">
              {meals.map((entry, index) => (
                <MealCard
                  key={entry.meal.type}
                  meal={entry.meal}
                  from={entry.from}
                  index={index}
                  allergyNames={allergyNames}
                  foodMatches={foodMatches}
                  shopping={shopping}
                  logged={loggedToday.has(entry.meal.type)}
                  onOpenFood={open}
                  onShopping={onShopping}
                  onLog={() => onLogMeal(entry.meal)}
                  onShuffle={() => {
                    const key = `${day.key}|${entry.meal.type}`;
                    setSwaps((current) => ({ ...current, [key]: current[key] === undefined ? 0 : current[key] + 1 }));
                  }}
                  onReset={() =>
                    setSwaps((current) => {
                      const next = { ...current };
                      delete next[`${day.key}|${entry.meal.type}`];
                      return next;
                    })
                  }
                />
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
            <button type="button" onClick={() => goTo(dayIndex - 1)} className="flex min-h-14 items-center justify-center gap-1 rounded-full border-2 border-black/10 bg-white px-3 py-2 text-base font-bold text-ink transition active:scale-95">
              <ChevronLeft className="h-6 w-6 shrink-0" aria-hidden="true" />
              {MENU_DAYS[(dayIndex + MENU_DAYS.length - 1) % MENU_DAYS.length].label}
            </button>
            <button type="button" onClick={() => goTo(dayIndex + 1)} className="flex min-h-14 items-center justify-center gap-1 rounded-full bg-orange-700 px-3 py-2 text-base font-bold text-white shadow-soft transition active:scale-95">
              {MENU_DAYS[(dayIndex + 1) % MENU_DAYS.length].label}
              <ChevronRight className="h-6 w-6 shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <p className="text-sm leading-5 text-muted">
        Es un menú de ejemplo con porciones orientativas. Si tienes otras condiciones (como diabetes o problemas de riñón) o tu médico te indicó una dieta, sigue sus indicaciones.{" "}
        <Link href="/diario" className="font-semibold text-accent underline">
          Ver mi Diario
        </Link>
      </p>
      {dialog}
    </div>
  );
}
