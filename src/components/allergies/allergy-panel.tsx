"use client";

import { useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { AlertTriangle, BookOpen, Check, ChevronDown, CreditCard, HeartPulse, Pencil, Plus, ShieldAlert, Trash2, Undo2, Utensils, X } from "lucide-react";
import "@/components/allergies/allergies.css";
import { AllergyCardDialog, FoodChecker, TipsCard } from "@/components/allergies/allergy-tools";
import { ReactionGuide } from "@/components/allergies/reaction-guide";
import { SectionCard } from "@/components/section-card";
import { useSectionTabs } from "@/components/shell/section-tabs";
import {
  COMMON_ALLERGENS,
  NOTE_CHIPS,
  WORD_SUGGESTIONS,
  affectedFoods,
  affectedRecipes,
  allergySummary,
  isCommonRegistered
} from "@/lib/allergy-insights";
import type { ContactsInfo } from "@/lib/contacts";
import { normalize } from "@/lib/diet-allergens";
import { foodImageSrc } from "@/lib/food-images";
import type { AllergyReactionInput, AllergyReactionRow, AllergyRow } from "@/lib/supabase/allergies";

export interface AllergyInput {
  allergy_name: string;
  notes: string;
}

const inputClass =
  "w-full min-w-0 rounded-2xl border border-black/10 bg-background px-4 py-3 text-base outline-none placeholder:text-muted focus:ring-4 focus:ring-accent/15";

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function appendNote(notes: string, chip: string) {
  const clean = notes.trim();
  if (clean.toLowerCase().includes(chip.toLowerCase())) return notes;
  return clean ? `${clean}. ${chip}` : chip;
}

function NoteChips({ notes, onPick }: { notes: string; onPick: (chip: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {NOTE_CHIPS.map((chip) => {
        const used = notes.toLowerCase().includes(chip.toLowerCase());
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onPick(chip)}
            aria-pressed={used}
            className={`min-h-11 rounded-full border px-3 py-2 text-sm font-semibold transition active:scale-95 ${
              used ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-black/10 bg-white text-ink hover:bg-slate-50"
            }`}
          >
            {used ? "✓ " : ""}
            {chip}
          </button>
        );
      })}
    </div>
  );
}

function UnknownWordNotice() {
  return (
    <p className="alg-pop flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        Esta palabra no coincide con ningún alimento de la app, así que no se ocultará nada. Prueba con: {WORD_SUGGESTIONS}.
      </span>
    </p>
  );
}

function FoodThumbs({ ids }: { ids: { id: string; name: string }[] }) {
  return (
    <ul className="grid grid-cols-3 gap-2 min-[480px]:grid-cols-4">
      {ids.map((food, index) => (
        <li key={food.id} className="alg-pop overflow-hidden rounded-2xl border border-black/5 bg-white text-center" style={{ "--i": index } as CSSProperties}>
          <img src={foodImageSrc(food.id)} alt="" aria-hidden="true" loading="lazy" decoding="async" className="block aspect-square w-full object-cover" />
          <p className="px-1 py-1.5 text-sm font-semibold leading-4 text-ink">{food.name}</p>
        </li>
      ))}
    </ul>
  );
}

function ShieldHero({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto h-36 w-36" aria-hidden="true">
      <span className={`alg-sonar ${active ? "" : "alg-sonar-off"}`} />
      <span className={`alg-sonar ${active ? "" : "alg-sonar-off"}`} />
      <svg viewBox="0 0 120 120" className="alg-shield relative h-full w-full">
        <path d="M60 14 98 28v30c0 25-16 40-38 49-22-9-38-24-38-49V28z" fill={active ? "#059669" : "#e11d48"} />
        <path d="M60 14v93c-22-9-38-24-38-49V28z" fill="#ffffff" opacity="0.14" />
        {active ? (
          <path d="m42 60 13 13 25-27" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M60 40v24M60 78v1" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
}

function AllergyItem({
  allergy,
  index,
  isDuplicate,
  onUpdate,
  onDelete
}: {
  allergy: AllergyRow;
  index: number;
  isDuplicate: (name: string, exceptId: string) => boolean;
  onUpdate: (id: string, input: AllergyInput) => Promise<void>;
  onDelete: (allergy: AllergyRow) => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(allergy.allergy_name);
  const [notes, setNotes] = useState(allergy.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const foods = useMemo(() => affectedFoods(allergy.allergy_name), [allergy.allergy_name]);
  const recipes = useMemo(() => affectedRecipes(allergy.allergy_name), [allergy.allergy_name]);
  const unknown = foods.length === 0 && recipes.length === 0;
  const actionClass =
    "flex min-h-12 min-w-[6.5rem] flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition active:scale-95 disabled:opacity-60";

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setError("Escribe el nombre de la alergia.");
    if (isDuplicate(clean, allergy.id)) return setError("Ya registraste esa alergia.");
    setBusy(true);
    setError(null);
    try {
      await onUpdate(allergy.id, { allergy_name: clean, notes: notes.trim() });
      setMode("view");
    } catch (err) {
      console.error("Error al editar la alergia:", err);
      setError("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await onDelete(allergy);
    } catch (err) {
      console.error("Error al eliminar la alergia:", err);
      setError("No se pudo eliminar. Inténtalo de nuevo.");
      setBusy(false);
    }
  };

  return (
    <li className="alg-rise rounded-3xl border border-black/5 bg-white p-3" style={{ "--i": index } as CSSProperties}>
      <div className="flex items-center gap-3">
        {foods[0] ? (
          <img src={foodImageSrc(foods[0].id)} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-danger" aria-hidden="true">
            <ShieldAlert className="h-9 w-9" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold leading-6 text-ink">{allergy.allergy_name}</p>
          {allergy.notes ? <p className="mt-0.5 text-sm leading-5 text-muted">{allergy.notes}</p> : null}
          {!unknown ? (
            <p className="mt-1 text-sm font-semibold leading-5 text-emerald-800">
              {plural(foods.length, "alimento", "alimentos")} · {plural(recipes.length, "receta", "recetas")}
            </p>
          ) : null}
        </div>
      </div>

      {unknown ? (
        <div className="mt-3">
          <UnknownWordNotice />
        </div>
      ) : null}

      {mode === "edit" ? (
        <form onSubmit={save} className="alg-rise mt-3 grid gap-2">
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Nota
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className={inputClass} />
          </label>
          <NoteChips notes={notes} onPick={(chip) => setNotes((value) => appendNote(value, chip))} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy} className={`${actionClass} bg-emerald-700 text-white hover:bg-emerald-800`}>
              <Check className="h-4 w-4" aria-hidden="true" />
              {busy ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(allergy.allergy_name);
                setNotes(allergy.notes ?? "");
                setError(null);
                setMode("view");
              }}
              className={`${actionClass} border border-black/10 bg-white text-ink`}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </button>
          </div>
        </form>
      ) : mode === "confirm" ? (
        <div className="alg-pop mt-3 rounded-2xl bg-rose-50 p-3">
          <p className="text-center text-base font-semibold text-rose-950">¿Eliminar {allergy.allergy_name}? Sus alimentos volverán a aparecer.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={remove} disabled={busy} className={`${actionClass} bg-danger text-white`}>
              {busy ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button type="button" onClick={() => setMode("view")} className={`${actionClass} border border-black/10 bg-white text-ink`}>
              No, dejarla
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {!unknown ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className={`${actionClass} bg-emerald-50 text-emerald-900 hover:bg-emerald-100`}
            >
              <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
              {expanded ? "Ocultar" : "Ver qué cubre"}
            </button>
          ) : null}
          <button type="button" onClick={() => setMode("edit")} className={`${actionClass} border border-black/10 bg-white text-ink hover:bg-slate-50`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Editar
          </button>
          <button type="button" onClick={() => setMode("confirm")} className={`${actionClass} bg-rose-50 text-danger hover:bg-rose-100`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Eliminar
          </button>
        </div>
      )}

      {error ? <p className="alg-shake mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-danger">{error}</p> : null}

      {expanded && !unknown && mode === "view" ? (
        <div className="mt-3 space-y-3">
          {foods.length > 0 ? <FoodThumbs ids={foods} /> : null}
          {recipes.length > 0 ? (
            <p className="rounded-2xl bg-background p-3 text-sm leading-6 text-ink">
              <span className="font-semibold">Recetas marcadas: </span>
              {recipes.map((recipe) => recipe.name).join(", ")}.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function AllergyPanel({
  allergies,
  reactions,
  contacts,
  onCreate,
  onUpdate,
  onDelete,
  onSaveReaction,
  onDeleteReaction
}: {
  allergies: AllergyRow[];
  reactions: AllergyReactionRow[];
  contacts: ContactsInfo | null;
  onCreate: (input: AllergyInput) => Promise<void>;
  onUpdate: (id: string, input: AllergyInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSaveReaction: (input: AllergyReactionInput) => Promise<void>;
  onDeleteReaction: (id: string) => Promise<void>;
}) {
  const tabs = useSectionTabs();
  const cardButtonRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<{ id: number; text: string } | null>(null);
  const [notice, setNotice] = useState<{ text: string; undo?: AllergyInput } | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  const names = useMemo(() => allergies.map((allergy) => allergy.allergy_name), [allergies]);
  const summary = useMemo(() => allergySummary(names), [names]);
  const preview = useMemo(() => {
    const clean = name.trim();
    return clean.length >= 3 ? { foods: affectedFoods(clean), recipes: affectedRecipes(clean) } : null;
  }, [name]);

  const isDuplicate = (value: string, exceptId?: string) =>
    allergies.some((allergy) => allergy.id !== exceptId && normalize(allergy.allergy_name) === normalize(value));

  const showError = (text: string) => setError((current) => ({ id: (current?.id ?? 0) + 1, text }));

  const add = async (input: AllergyInput, savingKey: string) => {
    if (!input.allergy_name) {
      showError("Escribe el nombre de la alergia.");
      return false;
    }
    if (isDuplicate(input.allergy_name)) {
      showError("Ya registraste esa alergia.");
      return false;
    }
    setSaving(savingKey);
    setError(null);
    setNotice(null);
    try {
      await onCreate(input);
      setNotice({ text: `Agregamos ${input.allergy_name} a tus alergias.` });
      return true;
    } catch (err) {
      console.error("Error al guardar la alergia:", err);
      showError("No se pudo guardar. Inténtalo de nuevo.");
      return false;
    } finally {
      setSaving(null);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const saved = await add({ allergy_name: name.trim(), notes: notes.trim() }, "form");
    if (saved) {
      setName("");
      setNotes("");
    }
  };

  const remove = async (allergy: AllergyRow) => {
    await onDelete(allergy.id);
    setNotice({
      text: `Eliminaste ${allergy.allergy_name}.`,
      undo: { allergy_name: allergy.allergy_name, notes: allergy.notes ?? "" }
    });
  };

  const goToReaction = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("alergia-reaccion")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const active = allergies.length > 0;
  const stats = [
    { value: allergies.length, label: allergies.length === 1 ? "Alergia" : "Alergias" },
    { value: summary.foods, label: "Alimentos marcados" },
    { value: summary.recipes, label: "Recetas marcadas" }
  ];

  return (
    <div className="space-y-6">
      <section className="ab-card overflow-hidden rounded-[1.75rem] p-5 text-center sm:p-6">
        <ShieldHero active={active} />
        <h2 className="mt-3 text-2xl font-semibold text-ink">{active ? "Tu filtro de alergias está activo" : "Cuéntanos qué te hace daño"}</h2>
        <p className="mx-auto mt-1 max-w-xl text-base leading-7 text-muted">
          {active
            ? "Marcamos lo que coincide con tus alergias en la guía, el menú y las recetas."
            : "Toca los alimentos de abajo o escribe el tuyo, y los marcaremos en la guía, el menú y las recetas."}
        </p>

        <ul className="mx-auto mt-4 grid max-w-xl grid-cols-3 gap-2">
          {stats.map((stat, index) => (
            <li key={stat.label} className="alg-pop rounded-2xl bg-background px-1 py-3" style={{ "--i": index } as CSSProperties}>
              <p key={stat.value} className="alg-pop text-3xl font-bold leading-9 text-ink">{stat.value}</p>
              <p className="text-sm font-semibold leading-4 text-muted">{stat.label}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-4 grid max-w-xl gap-2 sm:grid-cols-2">
          <button
            ref={cardButtonRef}
            type="button"
            onClick={() => setCardOpen(true)}
            disabled={!active}
            className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CreditCard className="h-5 w-5 shrink-0" aria-hidden="true" />
            Mostrar mi tarjeta
          </button>
          <button
            type="button"
            onClick={goToReaction}
            className="flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-red-700 bg-white px-4 py-3 text-base font-semibold text-red-800 transition hover:bg-red-50 active:scale-[0.98]"
          >
            <HeartPulse className="h-5 w-5 shrink-0" aria-hidden="true" />
            Tengo una reacción
          </button>
        </div>
      </section>

      {notice || error ? (
        <div className="space-y-2">
          {notice ? (
            <div role="status" className="alg-pop flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900">
              <span>{notice.text}</span>
              {notice.undo ? (
                <button
                  type="button"
                  onClick={() => notice.undo && add(notice.undo, "undo")}
                  disabled={saving === "undo"}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition active:scale-95 disabled:opacity-60"
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Deshacer
                </button>
              ) : null}
            </div>
          ) : null}
          {error ? (
            <p key={error.id} role="alert" className="alg-shake rounded-2xl bg-rose-50 px-4 py-3 text-base font-semibold text-danger">
              {error.text}
            </p>
          ) : null}
        </div>
      ) : null}

      <SectionCard title="Agregar una alergia" description="Toca un alimento para agregarlo enseguida.">
        <ul className="grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {COMMON_ALLERGENS.map((common, index) => {
            const registered = isCommonRegistered(common, names);
            const busy = saving === common.name;
            return (
              <li key={common.name} className="alg-pop" style={{ "--i": index } as CSSProperties}>
                <button
                  type="button"
                  onClick={() => add({ allergy_name: common.name, notes: "" }, common.name)}
                  disabled={registered || saving !== null}
                  aria-label={registered ? `${common.name}, ya agregada` : `Agregar ${common.name}`}
                  className={`group block h-full w-full overflow-hidden rounded-3xl border text-center transition active:scale-95 disabled:active:scale-100 ${
                    registered ? "border-emerald-400 bg-emerald-50" : "border-black/5 bg-white hover:shadow-soft"
                  }`}
                >
                  <span className="relative block overflow-hidden">
                    <img
                      src={foodImageSrc(common.photoId)}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="block aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                    />
                    <span className={`absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-soft ${registered ? "alg-pop bg-emerald-600" : "bg-accent"}`} aria-hidden="true">
                      {registered ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                  </span>
                  <span className="block px-2 py-2 text-base font-semibold leading-5 text-ink">
                    {busy ? "Guardando..." : common.name}
                  </span>
                  {registered ? <span className="block pb-2 text-sm font-semibold leading-4 text-emerald-800">Agregada</span> : null}
                </button>
              </li>
            );
          })}
        </ul>

        <form onSubmit={submit} className="mt-5 grid gap-3 rounded-3xl bg-background p-4">
          <p className="text-base font-semibold text-ink">¿No está en la lista? Escríbela aquí</p>
          <label className="grid gap-1 text-sm font-semibold text-ink">
            Alergia
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Camarón, tomate, avena" className={`${inputClass} bg-white`} />
          </label>

          {preview ? (
            preview.foods.length === 0 && preview.recipes.length === 0 ? (
              <UnknownWordNotice />
            ) : (
              <div className="alg-pop space-y-2">
                <p className="text-sm font-semibold text-emerald-800">
                  Se marcarían {plural(preview.foods.length, "alimento", "alimentos")} y {plural(preview.recipes.length, "receta", "recetas")}.
                </p>
                {preview.foods.length > 0 ? <FoodThumbs ids={preview.foods.slice(0, 4)} /> : null}
              </div>
            )
          ) : null}

          <label className="grid gap-1 text-sm font-semibold text-ink">
            Nota (opcional)
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Me da ronchas" className={`${inputClass} bg-white`} />
          </label>
          <NoteChips notes={notes} onPick={(chip) => setNotes((value) => appendNote(value, chip))} />
          <button
            type="submit"
            disabled={saving !== null}
            className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {saving === "form" ? "Guardando..." : "Agregar alergia"}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Mis alergias" description="Mira qué alimentos y recetas cubre cada una.">
        {allergies.length === 0 ? (
          <p className="rounded-2xl bg-background p-4 text-center text-base text-muted">Todavía no tienes alergias registradas.</p>
        ) : (
          <ul className="grid items-start gap-3 lg:grid-cols-2">
            {allergies.map((allergy, index) => (
              <AllergyItem key={allergy.id} allergy={allergy} index={index} isDuplicate={isDuplicate} onUpdate={onUpdate} onDelete={remove} />
            ))}
          </ul>
        )}

        {tabs && active ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { key: "guia", label: "Ver la guía", icon: ShieldAlert },
              { key: "menu", label: "Ver el menú", icon: Utensils },
              { key: "recetas", label: "Ver recetas", icon: BookOpen }
            ].map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => tabs.setActive(link.key)}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50 active:scale-95"
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </button>
            ))}
          </div>
        ) : null}
      </SectionCard>

      <FoodChecker names={names} />
      <ReactionGuide contacts={contacts} reactions={reactions} onSave={onSaveReaction} onDelete={onDeleteReaction} />
      <TipsCard />

      <p className="text-center text-sm leading-6 text-muted">
        El filtro funciona por palabras y no cubre todos los casos. Revisa siempre las etiquetas de los productos y consulta a tu médico.
      </p>

      {cardOpen ? (
        <AllergyCardDialog allergies={allergies} contacts={contacts} onClose={() => setCardOpen(false)} returnFocusRef={cardButtonRef} />
      ) : null}
    </div>
  );
}
