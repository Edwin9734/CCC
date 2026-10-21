"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Download, Printer } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { DIET_ITEMS, type DietCategory, type TrafficLight } from "@/lib/diet-data";
import type { DietInsights } from "@/lib/diet-insights";
import { MENU_DAYS, RECIPES, getAllergyMatches, type MealType } from "@/lib/diet-menu-data";
import { printWithTarget } from "@/lib/print-utils";
import { withDefaultTextSize } from "@/lib/text-size";

type SectionKey = "insights" | DietCategory | "menu" | "recipes";

const OPTIONS: { key: SectionKey; label: string }[] = [
  { key: "insights", label: "Sugerencias para ti" },
  { key: "foods-good", label: "Alimentos recomendados" },
  { key: "foods-avoid", label: "Alimentos a evitar" },
  { key: "drinks-good", label: "Bebidas recomendadas" },
  { key: "drinks-avoid", label: "Bebidas a evitar" },
  { key: "menu", label: "Menú de ejemplo (semana completa)" },
  { key: "recipes", label: "Recetas sencillas" }
];

const CATEGORY_ORDER: DietCategory[] = ["foods-good", "foods-avoid", "drinks-good", "drinks-avoid"];

const CATEGORY_TITLE: Record<DietCategory, string> = {
  "foods-good": "Alimentos recomendados",
  "foods-avoid": "Alimentos a evitar",
  "drinks-good": "Bebidas recomendadas",
  "drinks-avoid": "Bebidas a evitar"
};

const LIGHT_LABEL: Record<TrafficLight, string> = {
  green: "Consumir con frecuencia",
  yellow: "Con moderación",
  red: "Evitar"
};

const LIGHT_DOT: Record<TrafficLight, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500"
};

const MEAL_LABEL: Record<MealType, string> = {
  desayuno: "Desayuno",
  colacion: "Colación",
  almuerzo: "Almuerzo",
  cena: "Cena"
};

const NAME_BY_ID = new Map(DIET_ITEMS.map((item) => [item.id, item.name]));
const RECIPE_BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

const PRINT_CONTENT_ID = "guide-print-content";

const namesOf = (ids: string[]) =>
  ids.length > 0 ? ids.map((id) => NAME_BY_ID.get(id) ?? id).join(", ") : "—";

function todayText() {
  return new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

export function GuideReportSection({
  insights,
  allergyMatches,
  allergyNames
}: {
  insights: DietInsights;
  allergyMatches: Record<string, string[]>;
  allergyNames: string[];
}) {
  const [selected, setSelected] = useState<Record<SectionKey, boolean>>({
    insights: true,
    "foods-good": true,
    "foods-avoid": true,
    "drinks-good": true,
    "drinks-avoid": true,
    menu: false,
    recipes: false
  });
  const [printedDate, setPrintedDate] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // La fecha se calcula en el navegador, para usar la hora local de la persona.
  useEffect(() => {
    setPrintedDate(todayText());
  }, []);

  const toggle = (key: SectionKey) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = OPTIONS.filter((option) => selected[option.key]).length;
  const anySelected = selectedCount > 0;
  const anyListSelected = CATEGORY_ORDER.some((cat) => selected[cat]);
  const omittedCount = Object.keys(allergyMatches).length;

  const handlePrint = () => {
    flushSync(() => setPrintedDate(todayText()));
    printWithTarget("guide");
  };

  const handleDownloadPdf = async () => {
    setPdfError(null);
    flushSync(() => setPrintedDate(todayText()));

    const source = document.getElementById(PRINT_CONTENT_ID);
    if (!source) return;

    setDownloading(true);
    try {
      // Hacemos una copia del documento de la guía, visible solo para generar el PDF.
      const clone = source.cloneNode(true) as HTMLElement;
      clone.removeAttribute("id");
      clone.classList.remove("print-only");
      clone.style.display = "block";

      const html2pdf = (await import("html2pdf.js")).default;

      const options = {
        margin: 10,
        filename: "guia-alimentacion.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
        // Evita cortar a la mitad cada alimento, día del menú o receta.
        pagebreak: { mode: ["css", "legacy"], avoid: [".print-avoid-break"] }
      };

            await withDefaultTextSize(() => html2pdf().set(options).from(clone).save());
    } catch (error) {
      console.error("Error al generar el PDF de la guía:", error);
      setPdfError("No se pudo generar el PDF. Inténtalo de nuevo.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div id="guide-section" className="space-y-6">
      {/* Encabezado de la guía (solo en pantalla) */}
      <div className="no-print rounded-2xl border border-black/10 bg-surface p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink sm:text-3xl">Guía de alimentación</h2>
            <p className="mt-2 text-muted">Alimentos, bebidas, menú y recetas para el control del colesterol</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!anySelected || downloading}
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Generando PDF..." : "Descargar PDF Guía"}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-background p-4">
            <p className="text-sm text-muted">Fecha</p>
            <p className="mt-1 font-semibold text-ink">{printedDate || "—"}</p>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="text-sm text-muted">Alergias registradas</p>
            <p className="mt-1 text-2xl font-bold text-accent">{allergyNames.length}</p>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="text-sm text-muted">Secciones incluidas</p>
            <p className="mt-1 text-2xl font-bold text-accent">
              {selectedCount} de {OPTIONS.length}
            </p>
          </div>
        </div>

        {pdfError ? (
          <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-danger">{pdfError}</p>
        ) : null}
      </div>

      {/* Imprimir guía (solo en pantalla) */}
      <div className="no-print">
        <SectionCard
          title="Imprimir guía"
          description="Elige qué quieres incluir. Las casillas aplican al imprimir y también al PDF de la guía."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((option) => (
              <label key={option.key} className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={selected[option.key]}
                  onChange={() => toggle(option.key)}
                  className="h-5 w-5 rounded border-black/20 accent-accent"
                />
                {option.label}
              </label>
            ))}
          </div>

          {omittedCount > 0 ? (
            <p className="mt-3 text-xs leading-5 text-muted">
              Por tus alergias registradas, los alimentos y bebidas relacionados se omitirán de las listas.
            </p>
          ) : null}

          <button
            type="button"
            onClick={handlePrint}
            disabled={!anySelected}
            className="mt-5 flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>

          {!anySelected ? <p className="mt-2 text-xs text-muted">Marca al menos una sección.</p> : null}
        </SectionCard>
      </div>

      {/* Documento de la guía: oculto en pantalla, se usa para imprimir y para el PDF */}
      <div id={PRINT_CONTENT_ID} className="print-only text-ink">
        <div className="border-b border-black/20 pb-3">
          <h1 className="text-2xl font-semibold">Guía de alimentación</h1>
          <p className="mt-1 text-sm text-muted">Control de colesterol</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-muted">Fecha</p>
            <p className="mt-1 text-sm font-semibold">{printedDate || "—"}</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-muted">Alergias registradas</p>
            <p className="mt-1 text-sm font-semibold">{allergyNames.length}</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-muted">Secciones incluidas</p>
            <p className="mt-1 text-sm font-semibold">
              {selectedCount} de {OPTIONS.length}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-muted">
          Esta información es general y no reemplaza la indicación de tu médico o nutricionista.
        </p>

        {allergyNames.length > 0 ? (
          <p className="mt-2 text-xs leading-5">
            <span className="font-semibold">Alergias registradas: </span>
            {allergyNames.join(", ")}.
            {omittedCount > 0 && anyListSelected
              ? " Los alimentos y bebidas relacionados se omitieron de las listas."
              : ""}
          </p>
        ) : null}

        {selected.insights ? (
          <section className="mt-5">
            <h2 className="print-keep-with-next text-lg font-semibold">Sugerencias para ti</h2>

            {insights.metricInsights.length === 0 && insights.medicationNotes.length === 0 ? (
              <p className="mt-2 text-sm">No hay sugerencias personalizadas por el momento.</p>
            ) : null}

            {insights.metricInsights.map((insight) => (
              <div key={insight.metric} className="print-avoid-break mt-3 rounded-lg border border-black/20 p-3">
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-sm leading-5">{insight.message}</p>
                <p className="mt-2 text-sm leading-5">
                  <span className="font-semibold">Conviene priorizar: </span>
                  {namesOf(insight.goodIds)}
                </p>
                <p className="mt-1 text-sm leading-5">
                  <span className="font-semibold">Conviene evitar: </span>
                  {namesOf(insight.avoidIds)}
                </p>
              </div>
            ))}

            {insights.medicationNotes.length > 0 ? (
              <div className="print-avoid-break mt-3 rounded-lg border border-black/20 p-3">
                <p className="text-sm font-semibold">Sobre tus medicamentos</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-5">
                  {insights.medicationNotes.map((note, index) => (
                    <li key={`${note.medicationName}-${index}`}>{note.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {CATEGORY_ORDER.filter((cat) => selected[cat]).map((cat) => {
          const items = DIET_ITEMS.filter((item) => item.category === cat && !allergyMatches[item.id]);
          return (
            <section key={cat} className="mt-5">
              <h2 className="print-keep-with-next text-lg font-semibold">{CATEGORY_TITLE[cat]}</h2>
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <article key={item.id} className="print-avoid-break border-b border-black/10 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${LIGHT_DOT[item.level]}`} />
                      <p className="text-sm font-semibold">{item.name}</p>
                      <span className="text-xs text-muted">· {LIGHT_LABEL[item.level]}</span>
                    </div>
                    <p className="mt-0.5 text-sm leading-5">{item.why}</p>
                    <p className="text-xs leading-5 text-muted">
                      <span className="font-semibold text-ink">Porción o frecuencia: </span>
                      {item.portion}
                    </p>
                    {item.warning ? (
                      <p className="mt-0.5 text-xs font-semibold leading-5">Atención: {item.warning}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        {selected.menu ? (
          <section className="mt-5">
            <h2 className="print-keep-with-next text-lg font-semibold">Menú de ejemplo</h2>
            <div className="mt-2 space-y-3">
              {MENU_DAYS.map((day) => (
                <div key={day.key} className="print-avoid-break rounded-lg border border-black/20 p-3">
                  <p className="text-sm font-semibold">{day.label}</p>
                  <ul className="mt-1 space-y-1 text-sm leading-5">
                    {day.meals.map((meal) => {
                      const recipe = meal.recipeId ? RECIPE_BY_ID.get(meal.recipeId) : undefined;
                      const flagged = getAllergyMatches(allergyNames, [
                        ...meal.keywords,
                        ...(recipe?.keywords ?? [])
                      ]);
                      return (
                        <li key={meal.type}>
                          <span className="font-semibold">{MEAL_LABEL[meal.type]}: </span>
                          {meal.text}
                          {flagged.length > 0 ? (
                            <span className="font-semibold">
                              {" "}
                              (Revisar: puede contener algo relacionado con tu alergia: {flagged.join(", ")})
                            </span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Menú de ejemplo con porciones orientativas. Si tu médico te indicó una dieta específica, sigue sus
              indicaciones.
            </p>
          </section>
        ) : null}

        {selected.recipes ? (
          <section className="mt-5">
            <h2 className="print-keep-with-next text-lg font-semibold">Recetas sencillas</h2>
            <div className="mt-2 space-y-3">
              {RECIPES.map((recipe) => {
                const flagged = getAllergyMatches(allergyNames, recipe.keywords);
                return (
                  <article key={recipe.id} className="print-avoid-break rounded-lg border border-black/20 p-3">
                    <p className="text-base font-semibold">{recipe.name}</p>
                    <p className="text-xs text-muted">
                      {recipe.time} · {recipe.servings}
                    </p>

                    {flagged.length > 0 ? (
                      <p className="mt-1 text-xs font-semibold leading-5">
                        Revisar: puede contener algo relacionado con tu alergia: {flagged.join(", ")}.
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm font-semibold">Ingredientes</p>
                    <ul className="list-disc pl-5 text-sm leading-5">
                      {recipe.ingredients.map((ingredient) => (
                        <li key={ingredient}>{ingredient}</li>
                      ))}
                    </ul>

                    <p className="mt-2 text-sm font-semibold">Preparación</p>
                    <ol className="list-decimal pl-5 text-sm leading-5">
                      {recipe.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>

                    {recipe.tip ? (
                      <p className="mt-2 text-xs leading-5">
                        <span className="font-semibold">Consejo: </span>
                        {recipe.tip}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}