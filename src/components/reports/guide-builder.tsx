"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowUp, Check, ChefHat, Download, Eye, Leaf, Printer, Refrigerator, Share2, ShoppingCart, Sparkles, UtensilsCrossed } from "lucide-react";
import { Hero, fieldClass, useToast } from "@/components/antecedentes/antecedentes-ui";
import { FruitPlate } from "@/components/racha/racha-art";
import { GUIDE_SECTION_LABELS, GuideDocument, type GuideData, type GuideOptions, type GuideSectionKey } from "@/components/reports/guide-document";
import { ShareDialog, Switch } from "@/components/reports/report-builder";
import { exportPdf } from "@/components/reports/report-export";
import { DIET_ITEMS, DIET_ITEM_BY_ID } from "@/lib/diet-data";
import { MENU_DAYS, RECIPES } from "@/lib/diet-menu-data";
import { printWithTarget } from "@/lib/print-utils";

type GuideTemplate = "cocina" | "super" | "refri" | "parati" | "completa";

const ALL: GuideSectionKey[] = ["insights", "semaforo", "foods-good", "foods-avoid", "drinks-good", "drinks-avoid", "others", "swaps", "menu", "recipes", "shopping"];

const TEMPLATES: { key: GuideTemplate; label: string; hint: string; icon: typeof Leaf; sections: GuideSectionKey[]; photos: boolean; detail: boolean }[] = [
  { key: "parati", label: "Para ti", hint: "Lo que más te conviene", icon: Sparkles, sections: ["insights", "foods-good", "foods-avoid", "swaps"], photos: true, detail: true },
  { key: "refri", label: "Para el refri", hint: "Semáforo en una hoja", icon: Refrigerator, sections: ["semaforo", "swaps"], photos: false, detail: false },
  { key: "cocina", label: "Para la cocina", hint: "Menú y recetas", icon: ChefHat, sections: ["menu", "recipes"], photos: false, detail: false },
  { key: "super", label: "Para el súper", hint: "Lista de compras", icon: ShoppingCart, sections: ["shopping", "foods-good", "drinks-good"], photos: true, detail: false },
  { key: "completa", label: "Completa", hint: "Toda la guía", icon: UtensilsCrossed, sections: ALL, photos: true, detail: true }
];

const RECOMMENDED_RECIPES = RECIPES.filter((recipe) => recipe.tags.includes("bajar")).map((recipe) => recipe.id);

function layoutFor(key: GuideTemplate) {
  const template = TEMPLATES.find((item) => item.key === key) ?? TEMPLATES[0];
  return { order: [...template.sections, ...ALL.filter((section) => !template.sections.includes(section))], enabled: new Set(template.sections) };
}

export function GuideBuilder({ data }: { data: GuideData }) {
  const [template, setTemplate] = useState<GuideTemplate | null>("parati");
  const [{ order, enabled }, setLayout] = useState(() => layoutFor("parati"));
  const [photos, setPhotos] = useState(true);
  const [detail, setDetail] = useState(true);
  const [large, setLarge] = useState(false);
  const [title, setTitle] = useState("Mi guía de alimentación");
  const [days, setDays] = useState<string[]>(MENU_DAYS.map((day) => day.key));
  const [recipes, setRecipes] = useState<string[]>(RECOMMENDED_RECIPES);
  const [busy, setBusy] = useState<null | "pdf" | "share">(null);
  const [shareOpen, setShareOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toastElement, showToast } = useToast();

  const sections = order.filter((key) => enabled.has(key));
  const options: GuideOptions = { sections, photos, detail, large, title: title.trim() || "Mi guía de alimentación", days, recipes };

  const applyTemplate = (key: GuideTemplate) => {
    const chosen = TEMPLATES.find((item) => item.key === key) ?? TEMPLATES[0];
    setTemplate(key);
    setLayout(layoutFor(key));
    setPhotos(chosen.photos);
    setDetail(chosen.detail);
    showToast(`Plantilla «${chosen.label}» lista`);
  };

  const toggleSection = (key: GuideSectionKey) => {
    setTemplate(null);
    setLayout(({ order: current, enabled: on }) => {
      const next = new Set(on);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { order: current, enabled: next };
    });
  };

  // Si la sección está activa, salta las apagadas para que el cambio se note en la hoja.
  const move = (key: GuideSectionKey, step: number) => {
    setTemplate(null);
    setLayout(({ order: current, enabled: on }) => {
      const index = current.indexOf(key);
      let target = index + step;
      while (on.has(key) && target >= 0 && target < current.length && !on.has(current[target])) target += step;
      if (target < 0 || target >= current.length) target = index + step;
      if (target < 0 || target >= current.length) return { order: current, enabled: on };
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return { order: next, enabled: on };
    });
  };

  const allowedCount = (category: string) => DIET_ITEMS.filter((item) => item.category === category && !data.allergyMatches[item.id] && !data.hiddenIds.includes(item.id)).length;

  const countOf = (key: GuideSectionKey) => {
    if (key === "menu") return `${days.length} de 7 días`;
    if (key === "recipes") return `${recipes.length} recetas`;
    if (key === "shopping") return `${data.shoppingIds.length} en tu lista`;
    if (key === "swaps") return `${data.swaps.length} cambios`;
    if (key === "insights") return `${data.insights.metricInsights.length} sugerencias`;
    if (key === "semaforo") return "Todo en una hoja";
    return `${allowedCount(key)} alimentos`;
  };

  const runPdf = async (mode: "save" | "share") => {
    const element = document.getElementById("guide-print-content");
    if (!element) return;
    setBusy(mode === "save" ? "pdf" : "share");
    try {
      const result = await exportPdf(element, `guia-alimentacion-${data.today}`, mode);
      showToast(result === "shared" ? "¡Guía compartida!" : "PDF descargado");
      setShareOpen(false);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") showToast("No se pudo generar el PDF. Inténtalo de nuevo.", true);
    } finally {
      setBusy(null);
    }
  };

  // En texto: la lista de compras, o el semáforo si la lista está vacía.
  const shareTextContent = () => {
    const names = (ids: string[]) => ids.map((id) => DIET_ITEM_BY_ID.get(id)?.name).filter(Boolean);
    if (data.shoppingIds.length > 0) return `Mi lista de compras:\n${names(data.shoppingIds).map((name) => `- ${name}`).join("\n")}`;
    const level = (value: string) => DIET_ITEMS.filter((item) => item.level === value && !data.allergyMatches[item.id]).map((item) => item.name).join(", ");
    return `Mi guía de alimentación\n\nCon frecuencia: ${level("green")}\n\nCon moderación: ${level("yellow")}\n\nEvitar: ${level("red")}`;
  };

  const shareText = async () => {
    const text = shareTextContent();
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        showToast("Copiado");
      }
      setShareOpen(false);
    } catch {
      // Cancelado por la persona.
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareTextContent());
      showToast("Copiado. Pégalo donde quieras.");
      setShareOpen(false);
    } catch {
      showToast("No se pudo copiar.", true);
    }
  };

  const step = (number: number, label: string) => (
    <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-base text-white">{number}</span>
      {label}
    </h3>
  );

  const chip = (on: boolean) => `flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-base font-semibold transition active:scale-95 ${on ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white text-ink"}`;
  const actionClass = "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-sm font-bold leading-4 transition active:scale-95 disabled:opacity-60 [overflow-wrap:anywhere]";

  return (
    <div id="guide-section" className="space-y-4">
      <Hero
        tone="emerald"
        art={<FruitPlate className="h-full w-full" />}
        title="Guía para imprimir"
        text="Arma tu guía de alimentación: para la cocina, el súper o el refri."
        stats={[
          { label: "Secciones", value: sections.length },
          { label: "Recetas", value: enabled.has("recipes") ? recipes.length : 0 },
          { label: "En mi lista", value: data.shoppingIds.length }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <section className="ant-rise ab-card rounded-[1.75rem] p-4">
            {step(1, "¿Para qué la quieres?")}
            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
              {TEMPLATES.map((item, index) => {
                const Icon = item.icon;
                const active = template === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => applyTemplate(item.key)}
                    aria-pressed={active}
                    className={`ant-pop flex min-h-[5.5rem] flex-col items-start justify-center gap-1 rounded-2xl border-2 p-3 text-left transition active:scale-95 ${active ? "border-emerald-700 bg-emerald-700 text-white shadow-soft" : "border-black/10 bg-white text-ink"}`}
                    style={{ "--i": index } as CSSProperties}
                  >
                    <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span className="text-base font-bold leading-5">{item.label}</span>
                    <span className={`text-sm leading-4 ${active ? "text-white/85" : "text-muted"}`}>{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ant-rise ab-card rounded-[1.75rem] p-4">
            {step(2, "Secciones y orden")}
            <ul className="mt-2 space-y-1.5">
              {order.map((key, index) => {
                const on = enabled.has(key);
                return (
                  <li key={key} className={`report-row flex items-center justify-end gap-1 rounded-2xl border-2 p-1.5 transition-colors duration-200 ${on ? "border-emerald-200 bg-white" : "border-transparent bg-slate-100"}`}>
                    <button type="button" role="switch" aria-checked={on} onClick={() => toggleSection(key)} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 text-left transition active:scale-[0.99]">
                      <Switch on={on} />
                      <span className="min-w-0">
                        <span className={`block text-base font-bold leading-5 [overflow-wrap:anywhere] ${on ? "text-ink" : "text-muted"}`}>{GUIDE_SECTION_LABELS[key]}</span>
                        <span className="block text-sm leading-4 text-muted">{countOf(key)}</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => move(key, -1)} disabled={index === 0} aria-label={`Subir ${GUIDE_SECTION_LABELS[key]}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 transition active:scale-90 disabled:opacity-30">
                      <ArrowUp className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(key, 1)} disabled={index === order.length - 1} aria-label={`Bajar ${GUIDE_SECTION_LABELS[key]}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 transition active:scale-90 disabled:opacity-30">
                      <ArrowDown className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {enabled.has("menu") ? (
            <section className="ant-rise ab-card rounded-[1.75rem] p-4">
              <h3 className="text-lg font-bold text-ink">Días del menú</h3>
              <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Días del menú">
                {MENU_DAYS.map((day) => {
                  const on = days.includes(day.key);
                  return (
                    <button key={day.key} type="button" onClick={() => setDays((current) => (on ? current.filter((item) => item !== day.key) : MENU_DAYS.map((d) => d.key).filter((item) => item === day.key || current.includes(item))))} aria-pressed={on} className={chip(on)}>
                      {on ? <Check className="ant-pop h-5 w-5 shrink-0" aria-hidden="true" /> : null}
                      {day.short}
                    </button>
                  );
                })}
                <button type="button" onClick={() => setDays(days.length === 7 ? [] : MENU_DAYS.map((day) => day.key))} className="min-h-11 rounded-full px-3 text-base font-semibold text-emerald-800 underline">
                  {days.length === 7 ? "Ninguno" : "Todos"}
                </button>
              </div>
            </section>
          ) : null}

          {enabled.has("recipes") ? (
            <section className="ant-rise ab-card rounded-[1.75rem] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-ink">Recetas</h3>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setRecipes(RECOMMENDED_RECIPES)} className="min-h-10 rounded-full bg-emerald-50 px-3 text-sm font-semibold text-emerald-900">
                    Para el colesterol
                  </button>
                  <button type="button" onClick={() => setRecipes([])} className="min-h-10 rounded-full bg-slate-100 px-3 text-sm font-semibold text-ink">
                    Ninguna
                  </button>
                </div>
              </div>
              <div className="mt-2 flex max-h-72 flex-wrap gap-1.5 overflow-y-auto pr-1" role="group" aria-label="Recetas">
                {RECIPES.map((recipe) => {
                  const on = recipes.includes(recipe.id);
                  return (
                    <button key={recipe.id} type="button" onClick={() => setRecipes((current) => (on ? current.filter((item) => item !== recipe.id) : [...current, recipe.id]))} aria-pressed={on} className={`${chip(on)} text-left text-sm`}>
                      {on ? <Check className="ant-pop h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                      <span className="min-w-0 [overflow-wrap:anywhere]">{recipe.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="ant-rise ab-card space-y-3 rounded-[1.75rem] p-4">
            {step(3, "Cómo se ve")}
            <label className="block">
              <span className="block text-base font-bold text-ink">Título</span>
              <input type="text" value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} className={`mt-1 ${fieldClass("emerald")}`} />
            </label>
            {[
              { label: "Con fotos de los alimentos", on: photos, set: () => setPhotos(!photos) },
              { label: "Con explicación y porción", on: detail, set: () => setDetail(!detail) },
              { label: "Letra grande", on: large, set: () => setLarge(!large) }
            ].map((item) => (
              <button key={item.label} type="button" role="switch" aria-checked={item.on} onClick={item.set} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left text-base font-semibold leading-5 text-ink transition active:scale-[0.99]">
                <span className="min-w-0">{item.label}</span>
                <Switch on={item.on} />
              </button>
            ))}
          </section>
        </div>

        <div ref={previewRef} className="scroll-mt-24 space-y-2 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-lg font-bold text-ink">
            <Eye className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            Así se verá tu guía
          </p>
          <div className="report-preview overflow-hidden rounded-2xl shadow-soft ring-1 ring-black/10">
            <GuideDocument data={data} options={options} />
          </div>
        </div>
      </div>

      <div className="no-print sticky bottom-[5.5rem] z-20 rounded-[1.5rem] border border-black/10 bg-white/95 p-1.5 shadow-soft backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-3">
          <button type="button" onClick={() => previewRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })} className={`${actionClass} bg-slate-100 text-ink lg:hidden`}>
            <Eye className="h-6 w-6 shrink-0" aria-hidden="true" />
            Ver hoja
          </button>
          <button type="button" onClick={() => printWithTarget("guide")} disabled={sections.length === 0} className={`${actionClass} bg-emerald-700 text-white`}>
            <Printer className="h-6 w-6 shrink-0" aria-hidden="true" />
            Imprimir
          </button>
          <button type="button" onClick={() => runPdf("save")} disabled={busy !== null || sections.length === 0} className={`${actionClass} bg-rose-700 text-white`}>
            <Download className="h-6 w-6 shrink-0" aria-hidden="true" />
            {busy === "pdf" ? "Creando…" : "PDF"}
          </button>
          <button type="button" onClick={() => setShareOpen(true)} disabled={sections.length === 0} className={`${actionClass} bg-sky-700 text-white`}>
            <Share2 className="h-6 w-6 shrink-0" aria-hidden="true" />
            Compartir
          </button>
        </div>
      </div>

      {shareOpen ? (
        <ShareDialog
          title="Compartir la guía"
          textLabel={data.shoppingIds.length > 0 ? "Enviar mi lista de compras" : "Enviar el semáforo en texto"}
          textHint={data.shoppingIds.length > 0 ? `${data.shoppingIds.length} alimentos, para el súper` : "Qué comer con frecuencia y qué evitar"}
          busy={busy === "share"}
          onClose={() => setShareOpen(false)}
          onPdf={() => runPdf("share")}
          onText={shareText}
          onCopy={copyText}
        />
      ) : null}
      {toastElement}
    </div>
  );
}
