"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  ChefHat,
  Clock,
  CookingPot,
  CupSoda,
  Lightbulb,
  Salad,
  Search,
  ShieldAlert,
  Users,
  X,
  type LucideIcon
} from "lucide-react";
import { FoodDialog } from "@/components/diet/food-dialog";
import { FoodPhotoTile } from "@/components/diet/food-photo-tile";
import { FOOD_GRID_NARROW } from "@/components/diet/food-tiles";
import { useSectionTabs } from "@/components/shell/section-tabs";
import { DIET_ITEM_BY_ID } from "@/lib/diet-data";
import { findAllergenMatches } from "@/lib/diet-allergens";
import { getAllergyMatches } from "@/lib/diet-menu-data";
import { hasRecipePhoto, ingredientImageSrc, recipeImageSrc } from "@/lib/food-images";
import {
  DRINK_TAGS,
  RECIPES,
  RECIPE_FILTERS,
  RECIPE_TAG_LABEL,
  type Recipe,
  type RecipeTag
} from "@/lib/recipes-data";
import { useDrawer } from "@/lib/use-drawer";
import "./recipes.css";

type Filter = RecipeTag | "todas";

const FILTER_ICONS: Partial<Record<Filter, LucideIcon>> = {
  refaccion: Salad,
  licuado: CupSoda,
  fresco: CupSoda,
  jugo: CupSoda
};

const TAG_STYLE: Record<RecipeTag, string> = {
  bajar: "bg-emerald-100 text-emerald-900",
  economica: "bg-amber-100 text-amber-900",
  saludable: "bg-sky-100 text-sky-900",
  refaccion: "bg-orange-100 text-orange-900",
  licuado: "bg-violet-100 text-violet-900",
  fresco: "bg-cyan-100 text-cyan-900",
  jugo: "bg-rose-100 text-rose-900"
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function isDrink(recipe: Recipe) {
  return recipe.tags.some((tag) => DRINK_TAGS.includes(tag));
}

function placeholderFor(recipe: Recipe): { icon: LucideIcon; background: string } {
  if (isDrink(recipe)) return { icon: CupSoda, background: "from-cyan-200 to-sky-300" };
  if (recipe.tags.includes("refaccion")) return { icon: Salad, background: "from-lime-200 to-emerald-300" };
  return { icon: CookingPot, background: "from-amber-200 to-orange-300" };
}

function RecipeImage({ recipe, className }: { recipe: Recipe; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (hasRecipePhoto(recipe.id) && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={recipeImageSrc(recipe.id)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`rec-photo h-full w-full object-cover ${className ?? ""}`}
      />
    );
  }

  const { icon: Icon, background } = placeholderFor(recipe);
  return (
    <span aria-hidden="true" className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${background}`}>
      <Icon className="rec-float h-1/3 w-1/3 text-white drop-shadow" />
    </span>
  );
}

function IngredientTile({ image, text }: { image: string; text: string }) {
  return (
    <div className="flex h-full w-full flex-col rounded-3xl border-2 border-black/5 bg-white p-2 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ingredientImageSrc(image)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="aspect-square w-full rounded-2xl object-cover"
      />
      <span className="mt-2 block px-0.5 text-sm font-semibold leading-5 text-ink">{text}</span>
    </div>
  );
}

function CookingHero() {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-auto shrink-0" aria-hidden="true">
      {[52, 80, 108].map((x, index) => (
        <path
          key={x}
          className="rec-steam"
          style={{ "--delay": `${index * 0.7}s` } as CSSProperties}
          d={`M${x} 40C${x - 8} 32 ${x + 8} 26 ${x} 16`}
          fill="none"
          stroke="#fda4af"
          strokeWidth="5"
          strokeLinecap="round"
        />
      ))}
      <rect x="24" y="66" width="112" height="44" rx="14" fill="#e11d48" />
      <rect x="10" y="74" width="16" height="10" rx="5" fill="#be123c" />
      <rect x="134" y="74" width="16" height="10" rx="5" fill="#be123c" />
      <rect x="36" y="78" width="26" height="6" rx="3" fill="#fff" opacity="0.5" />
      <g className="rec-lid">
        <rect x="20" y="56" width="120" height="12" rx="6" fill="#f43f5e" />
        <circle cx="80" cy="50" r="7" fill="#be123c" />
      </g>
    </svg>
  );
}

function RecipeDialog({
  recipe,
  flagged,
  foodMatches,
  waterRestricted,
  onClose
}: {
  recipe: Recipe;
  flagged: string[];
  foodMatches: Record<string, string[]>;
  waterRestricted: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closedRef = useRef<HTMLElement | null>(null);
  const foodReturnRef = useRef<HTMLElement | null>(null);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [done, setDone] = useState<number[]>([]);

  // Mientras está abierto el detalle de un ingrediente, Esc cierra solo ese.
  useDrawer({
    open: true,
    onClose: () => {
      if (!foodId) onClose();
    },
    panelRef,
    returnFocusRef: closedRef
  });

  const others = recipe.ingredientItems.filter(
    (ingredient) => !ingredient.image && (!ingredient.foodId || !DIET_ITEM_BY_ID.has(ingredient.foodId))
  );

  const toggleStep = (index: number) =>
    setDone((current) => (current.includes(index) ? current.filter((i) => i !== index) : [...current, index]));

  const finished = done.length === recipe.steps.length;

  return createPortal(
    <>
    <div onClick={onClose} className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="rec-dialog max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface text-ink shadow-soft"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-3xl">
          <RecipeImage recipe={recipe} />
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label="Cerrar receta"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition active:scale-90 focus:outline-none focus:ring-4 focus:ring-accent/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <h2 id="recipe-dialog-title" className="text-2xl font-semibold leading-8">
            {recipe.name}
          </h2>
          <p className="mt-1 text-base leading-7 text-muted">{recipe.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <span key={tag} className={`rounded-full px-3 py-1 text-xs font-semibold ${TAG_STYLE[tag]}`}>
                {RECIPE_TAG_LABEL[tag]}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-semibold">
              <Clock className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              {recipe.time}
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-semibold">
              <Users className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              Rinde {recipe.servings}
            </div>
          </div>

          {flagged.length > 0 ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold leading-6 text-rose-900">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Puede contener algo relacionado con tu alergia: {flagged.join(", ")}.
            </p>
          ) : null}

          {waterRestricted && isDrink(recipe) ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-100 p-3 text-sm font-semibold leading-6 text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Tu médico debe indicarte cuántos líquidos puedes tomar. Cuenta este vaso dentro de esa cantidad.
            </p>
          ) : null}

          <h3 className="mt-5 text-lg font-semibold">Ingredientes</h3>
          <div className={`mt-2 ${FOOD_GRID_NARROW}`}>
            {recipe.ingredientItems.flatMap((ingredient) => {
              if (ingredient.image) {
                return [<IngredientTile key={ingredient.text} image={ingredient.image} text={ingredient.text} />];
              }

              const food = ingredient.foodId ? DIET_ITEM_BY_ID.get(ingredient.foodId) : undefined;
              if (!food) return [];

              return [
                <FoodPhotoTile
                  key={ingredient.text}
                  item={food}
                  label={ingredient.text}
                  opensDialog
                  flagged={Boolean(foodMatches[food.id])}
                  onClick={(event) => {
                    foodReturnRef.current = event.currentTarget;
                    setFoodId(food.id);
                  }}
                />
              ];
            })}
          </div>
          {others.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-base leading-7">
              {others.map((ingredient) => (
                <li key={ingredient.text}>{ingredient.text}</li>
              ))}
            </ul>
          ) : null}

          <h3 className="mt-5 text-lg font-semibold">Preparación</h3>
          <p className="text-sm text-muted">Toca cada paso al terminarlo.</p>
          <ol className="mt-3 space-y-2">
            {recipe.steps.map((step, index) => {
              const checked = done.includes(index);
              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    aria-pressed={checked}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left text-base leading-7 transition active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-accent/15 ${
                      checked ? "border-emerald-300 bg-emerald-50 text-muted" : "border-black/5 bg-white"
                    }`}
                  >
                    <span
                      key={String(checked)}
                      className={`rec-check flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        checked ? "bg-emerald-600 text-white" : "bg-accentSoft text-accent"
                      }`}
                    >
                      {checked ? <Check className="h-4 w-4" aria-label="Hecho" /> : index + 1}
                    </span>
                    <span className="min-w-0">{step}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {finished ? (
            <p role="status" className="rec-card mt-3 flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 p-3 text-base font-semibold text-emerald-900">
              <ChefHat className="h-5 w-5" aria-hidden="true" />
              ¡Listo! Buen provecho.
            </p>
          ) : null}

          {recipe.tip ? (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {recipe.tip}
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-5 text-muted">
            Receta orientativa: acompaña tu tratamiento y no reemplaza la indicación de tu médico o nutricionista.
          </p>
        </div>
      </section>
    </div>

    {/* Va fuera del fondo oscuro: así un toque en este detalle no cierra también la receta. */}
    <FoodDialog
      foodId={foodId}
      allergies={foodId ? foodMatches[foodId] : undefined}
      onClose={() => setFoodId(null)}
      returnFocusRef={foodReturnRef}
    />
    </>,
    document.body
  );
}

export function DietRecipes({
  allergyNames = [],
  waterRestricted = false
}: {
  allergyNames?: string[];
  waterRestricted?: boolean;
}) {
  const tabs = useSectionTabs();
  const [filter, setFilter] = useState<Filter>("todas");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  const foodMatches = useMemo(() => findAllergenMatches(allergyNames), [allergyNames]);

  // Cuando se llega desde "Ver receta" del Menú, se abre esa receta.
  const activeTab = tabs?.active;
  const targetRecipe = tabs?.target;
  useEffect(() => {
    if (activeTab === "recetas" && targetRecipe) setOpenId(targetRecipe);
  }, [activeTab, targetRecipe]);

  const closeRecipe = () => {
    setOpenId(null);
    if (targetRecipe) tabs?.setActive("recetas");
    returnRef.current?.focus();
  };

  const searching = query.trim().length > 0;
  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return RECIPES.filter((recipe) => {
      if (filter !== "todas" && !recipe.tags.includes(filter)) return false;
      if (!q) return true;
      return normalize(`${recipe.name} ${recipe.description} ${recipe.ingredients.join(" ")}`).includes(q);
    });
  }, [filter, query]);

  const openRecipe = openId ? RECIPES.find((recipe) => recipe.id === openId) : undefined;
  const showDrinkNotice = waterRestricted && visible.some(isDrink);

  return (
    <>
      <section className="ab-card relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <CookingHero />
          <div>
            <h2 className="text-2xl font-semibold leading-8 text-ink">Recetas ricas para tu corazón</h2>
            <p className="mt-1 text-base leading-7 text-muted">
              Platos, refacciones y bebidas caseras, sin manteca, sin frituras y sin azúcar agregada.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/10 bg-background px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar receta o ingrediente (ej. frijol)"
            aria-label="Buscar receta o ingrediente"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tipo de receta">
          {RECIPE_FILTERS.map((item) => {
            const active = filter === item.key;
            const Icon = FILTER_ICONS[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={active}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-accent/15 ${
                  active ? "border-accent bg-accent text-white shadow-soft" : "border-black/10 bg-white text-ink hover:bg-slate-50"
                }`}
              >
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {showDrinkNotice ? (
        <p className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          Las bebidas cuentan dentro de los líquidos que tu médico te indicó.
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="ab-card rounded-3xl p-6 text-center text-base text-muted">
          {searching ? "No encontramos recetas con esa búsqueda." : "No hay recetas en esta categoría."}
        </p>
      ) : (
        <ul key={`${filter}-${searching}`} className="grid grid-cols-1 gap-4 min-[440px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((recipe, index) => {
            const flagged = getAllergyMatches(allergyNames, recipe.keywords);
            return (
              <li key={recipe.id} className="rec-card" style={{ "--i": index } as CSSProperties}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={(event) => {
                    returnRef.current = event.currentTarget;
                    setOpenId(recipe.id);
                  }}
                  className="rec-open ab-card flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] text-left transition active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-accent/25 motion-reduce:transition-none"
                >
                  <span className="relative block aspect-[4/3] w-full overflow-hidden">
                    <RecipeImage recipe={recipe} />
                    {flagged.length > 0 ? (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-rose-700 px-2.5 py-1 text-xs font-semibold text-white">
                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                        Alergia
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-1 flex-col p-4">
                    <span className="text-lg font-semibold leading-6 text-ink">{recipe.name}</span>
                    <span className="mt-1 flex-1 text-sm leading-6 text-muted">{recipe.description}</span>
                    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        {recipe.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {recipe.servings}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs leading-5 text-muted">
        Estas recetas pueden ayudarte como parte de una alimentación sana, pero no reemplazan tu tratamiento ni la
        indicación de tu médico.
      </p>

      {openRecipe ? (
        <RecipeDialog
          key={openRecipe.id}
          recipe={openRecipe}
          flagged={getAllergyMatches(allergyNames, openRecipe.keywords)}
          foodMatches={foodMatches}
          waterRestricted={waterRestricted}
          onClose={closeRecipe}
        />
      ) : null}
    </>
  );
}
