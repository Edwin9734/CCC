"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, CookingPot, Heart, Leaf, type LucideIcon, Pill, ShieldCheck, Star } from "lucide-react";
import {
  APPLICATION_SUGGESTIONS,
  HELP_LABEL,
  NATURAL_SUGGESTIONS,
  REMEDY_INGREDIENTS,
  SIDE_EFFECT_OPTIONS,
  cleanText,
  matchesSearch,
  sameText,
  type MedicineInput,
  type MedicineKind,
  type MedicineRow,
  type RowStore,
  type UseStatus
} from "@/lib/antecedentes";
import {
  AddButton,
  Badge,
  ChipList,
  ChipPicker,
  ChoicePills,
  DetailBlock,
  Empty,
  Expand,
  ExpandChevron,
  Field,
  FilterChips,
  FormSheet,
  Group,
  Hero,
  MedicineArt,
  RowActions,
  SAVE_ERROR,
  SearchBox,
  TextHelpers,
  fieldClass,
  useToast
} from "./antecedentes-ui";

const KINDS: Record<
  MedicineKind,
  {
    tab: string;
    one: string;
    add: string;
    placeholder: string;
    icon: LucideIcon;
    tile: string;
    emptyTitle: string;
    emptyText: string;
    current: string;
    past: string;
  }
> = {
  medicine: {
    tab: "Medicinas",
    one: "medicina",
    add: "Agregar medicina",
    placeholder: "Ej. Atorvastatina",
    icon: Pill,
    tile: "bg-violet-100 text-violet-800",
    emptyTitle: "Aún no hay medicinas",
    emptyText: "Agrega todas las que recuerdes, las que usas ahora y las que usaste antes.",
    current: "La uso ahora",
    past: "Ya no la uso"
  },
  natural: {
    tab: "Naturales",
    one: "medicina natural",
    add: "Agregar medicina natural",
    placeholder: "Ej. Manzanilla",
    icon: Leaf,
    tile: "bg-emerald-100 text-emerald-800",
    emptyTitle: "Aún no hay medicinas naturales",
    emptyText: "Anota las plantas, tés o productos naturales que hayas probado.",
    current: "La uso ahora",
    past: "Ya no la uso"
  },
  remedy: {
    tab: "Remedios caseros",
    one: "remedio casero",
    add: "Agregar remedio casero",
    placeholder: "Ej. Té de jengibre con miel",
    icon: CookingPot,
    tile: "bg-amber-100 text-amber-900",
    emptyTitle: "Aún no hay remedios caseros",
    emptyText: "Guarda sus ingredientes, cómo se prepara y cómo se aplica.",
    current: "Lo uso ahora",
    past: "Ya no lo uso"
  }
};

const KIND_ORDER: MedicineKind[] = ["medicine", "natural", "remedy"];

type Filter = "all" | "current" | "past" | "helps" | "effects";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "current", label: "En uso" },
  { value: "past", label: "Ya no uso" },
  { value: "helps", label: "Me ayudan" },
  { value: "effects", label: "Con molestias" }
];

const FILTER_TEST: Record<Filter, (row: MedicineRow) => boolean> = {
  all: () => true,
  current: (row) => row.status === "current",
  past: (row) => row.status === "past",
  helps: (row) => row.is_best || (row.help_level ?? 0) >= 2,
  effects: (row) => row.has_side_effects === true
};

const HELP_OPTIONS = [
  { value: "3", label: "Ayuda mucho" },
  { value: "2", label: "Ayuda algo" },
  { value: "1", label: "No ayudó" }
];

const EFFECT_OPTIONS = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unknown", label: "No lo sé" }
];

function emptyDraft(kind: MedicineKind): MedicineInput {
  return {
    kind,
    name: "",
    status: "past",
    purpose: null,
    help_level: null,
    is_best: false,
    has_side_effects: null,
    side_effects: [],
    side_effect_notes: null,
    ingredients: [],
    preparation: null,
    application: null
  };
}

function toDraft(row: MedicineRow): MedicineInput {
  return {
    kind: row.kind,
    name: row.name,
    status: row.status,
    purpose: row.purpose,
    help_level: row.help_level,
    is_best: row.is_best,
    has_side_effects: row.has_side_effects,
    side_effects: row.side_effects,
    side_effect_notes: row.side_effect_notes,
    ingredients: row.ingredients,
    preparation: row.preparation,
    application: row.application
  };
}

function HelpHearts({ level }: { level: number }) {
  const filled = level === 1 ? 0 : level;
  return (
    <Badge className={level === 1 ? "bg-slate-100 text-slate-700" : "bg-pink-100 text-pink-900"}>
      <span className="flex" aria-hidden="true">
        {[0, 1, 2].map((slot) => (
          <Heart key={slot} className={`h-4 w-4 ${slot < filled ? "fill-current" : "opacity-40"}`} />
        ))}
      </span>
      {HELP_LABEL[level]}
    </Badge>
  );
}

function MedicineForm({
  initial,
  editingId,
  rows,
  knownMedications,
  onSave,
  onClose
}: {
  initial: MedicineInput;
  editingId: string | null;
  rows: MedicineRow[];
  knownMedications: string[];
  onSave: (input: MedicineInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (changes: Partial<MedicineInput>) => setDraft((current) => ({ ...current, ...changes }));

  const meta = KINDS[draft.kind];
  const Icon = meta.icon;
  const isRemedy = draft.kind === "remedy";

  const pool = draft.kind === "medicine" ? knownMedications : draft.kind === "natural" ? NATURAL_SUGGESTIONS : [];
  const nameIdeas = editingId
    ? []
    : pool.filter((name) => !rows.some((row) => row.kind === draft.kind && sameText(row.name, name)));

  const submit = async () => {
    const name = draft.name.trim();
    if (name === "") {
      setError(`Escribe el nombre de ${isRemedy ? "tu remedio" : "la medicina"}.`);
      return;
    }
    if (isRemedy && draft.ingredients.length === 0 && cleanText(draft.preparation) === null) {
      setError("Agrega al menos los ingredientes o cómo se prepara.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const withEffects = draft.has_side_effects === true;
      await onSave(
        {
          ...draft,
          name,
          purpose: cleanText(draft.purpose),
          side_effects: withEffects ? draft.side_effects : [],
          side_effect_notes: withEffects ? cleanText(draft.side_effect_notes) : null,
          ingredients: isRemedy ? draft.ingredients : [],
          preparation: isRemedy ? cleanText(draft.preparation) : null,
          application: isRemedy ? cleanText(draft.application) : null
        },
        editingId ?? undefined
      );
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  const effectValue = draft.has_side_effects === null ? "unknown" : draft.has_side_effects ? "yes" : "no";

  return (
    <FormSheet
      tone="violet"
      title={editingId ? `Editar ${meta.one}` : meta.add}
      icon={<Icon className="h-7 w-7" />}
      saving={saving}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <Field label={isRemedy ? "Nombre del remedio" : "Nombre"}>
        <input
          type="text"
          value={draft.name}
          maxLength={120}
          onChange={(event) => set({ name: event.target.value })}
          placeholder={meta.placeholder}
          className={fieldClass("violet")}
        />
        {nameIdeas.length > 0 && draft.name.trim() === "" ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {nameIdeas.slice(0, 10).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => set({ name })}
                className="ant-pop flex min-h-10 items-center rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-800 transition active:scale-95"
              >
                {name}
              </button>
            ))}
          </span>
        ) : null}
      </Field>

      <Field label="¿Para qué la usas o la usaste?" hint="Opcional">
        <input
          type="text"
          value={draft.purpose ?? ""}
          maxLength={200}
          onChange={(event) => set({ purpose: event.target.value })}
          placeholder="Ej. Para el colesterol, para la tos"
          className={fieldClass("violet")}
        />
      </Field>

      {isRemedy ? (
        <>
          <ChipPicker
            tone="violet"
            label="Ingredientes"
            hint="Toca los que lleva o escribe otros."
            options={REMEDY_INGREDIENTS}
            value={draft.ingredients}
            onChange={(ingredients) => set({ ingredients })}
            placeholder="Otro ingrediente"
          />
          <Field label="¿Cómo se prepara?">
            <textarea
              rows={3}
              value={draft.preparation ?? ""}
              maxLength={1500}
              onChange={(event) => set({ preparation: event.target.value })}
              placeholder="Ej. Hervir el jengibre 10 minutos y agregar la miel al final"
              className={fieldClass("violet")}
            />
          </Field>
          <div>
            <Field label="¿Cómo se aplica?">
              <textarea
                rows={2}
                value={draft.application ?? ""}
                maxLength={1000}
                onChange={(event) => set({ application: event.target.value })}
                placeholder="Ej. Una taza caliente antes de dormir"
                className={fieldClass("violet")}
              />
            </Field>
            <TextHelpers tone="violet" options={APPLICATION_SUGGESTIONS} value={draft.application ?? ""} onPick={(application) => set({ application })} />
          </div>
        </>
      ) : null}

      <Group label="¿Lo usas ahora?">
        <ChoicePills<UseStatus>
          tone="violet"
          columns="sm:grid-cols-2"
          options={[
            { value: "current", label: meta.current },
            { value: "past", label: meta.past }
          ]}
          value={draft.status}
          onChange={(status) => set({ status })}
        />
      </Group>

      <Group label="¿Cuánto te ayuda?" hint="Toca de nuevo para quitar la respuesta.">
        <ChoicePills
          tone="violet"
          options={HELP_OPTIONS}
          value={draft.help_level === null ? null : String(draft.help_level)}
          onChange={(value) => set({ help_level: draft.help_level === Number(value) ? null : Number(value) })}
        />
        <button
          type="button"
          onClick={() => set({ is_best: !draft.is_best })}
          aria-pressed={draft.is_best}
          className={`mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-2 text-base font-bold transition active:scale-[0.98] ${
            draft.is_best ? "border-amber-500 bg-amber-100 text-amber-950" : "border-black/10 bg-white text-ink"
          }`}
        >
          <Star key={String(draft.is_best)} className={`h-6 w-6 shrink-0 ${draft.is_best ? "ant-star fill-amber-500 text-amber-600" : ""}`} aria-hidden="true" />
          Es de las que más me ayudan
        </button>
      </Group>

      <Group label="¿Te causa efectos secundarios?">
        <ChoicePills
          tone="violet"
          options={EFFECT_OPTIONS}
          value={effectValue}
          onChange={(value) => set({ has_side_effects: value === "unknown" ? null : value === "yes" })}
        />
      </Group>

      {draft.has_side_effects === true ? (
        <div className="ant-rise space-y-4 rounded-2xl bg-amber-50 p-4">
          <ChipPicker
            tone="violet"
            label="¿Qué efectos te causa?"
            options={SIDE_EFFECT_OPTIONS}
            value={draft.side_effects}
            onChange={(side_effects) => set({ side_effects })}
            placeholder="Otro efecto"
          />
          <Field label="Algo más que quieras anotar" hint="Opcional">
            <textarea
              rows={2}
              value={draft.side_effect_notes ?? ""}
              maxLength={500}
              onChange={(event) => set({ side_effect_notes: event.target.value })}
              placeholder="Ej. Me daba dolor de estómago si la tomaba sin comer"
              className={fieldClass("violet")}
            />
          </Field>
        </div>
      ) : null}
    </FormSheet>
  );
}

function MedicineCard({
  row,
  index,
  onEdit,
  onToggleBest,
  onToggleStatus,
  onDelete
}: {
  row: MedicineRow;
  index: number;
  onEdit: () => void;
  onToggleBest: () => void;
  onToggleStatus: () => void;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const meta = KINDS[row.kind];
  const Icon = meta.icon;
  const isCurrent = row.status === "current";

  return (
    <li
      className={`ant-rise overflow-hidden rounded-3xl border-2 bg-white transition-colors duration-300 ${row.is_best ? "border-amber-400" : "border-black/10"}`}
      style={{ "--i": index } as CSSProperties}
    >
      <div className="flex items-start gap-1 p-3">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl text-left transition active:scale-[0.99]">
          <span className={`ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${meta.tile}`} aria-hidden="true">
            <Icon className="h-7 w-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{row.name}</span>
            {row.purpose ? <span className="mt-0.5 block text-base leading-5 text-muted [overflow-wrap:anywhere]">{row.purpose}</span> : null}
            <span className="mt-2 flex flex-wrap gap-1.5">
              <Badge className={isCurrent ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-700"}>{isCurrent ? meta.current : meta.past}</Badge>
              {row.help_level ? <HelpHearts level={row.help_level} /> : null}
              {row.has_side_effects === true ? (
                <Badge className="bg-amber-100 text-amber-950">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Con molestias
                </Badge>
              ) : null}
              {row.has_side_effects === false ? (
                <Badge className="bg-sky-100 text-sky-900">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Sin molestias
                </Badge>
              ) : null}
            </span>
          </span>
          <ExpandChevron />
        </button>
        <button
          type="button"
          onClick={onToggleBest}
          aria-pressed={row.is_best}
          aria-label={`${row.name}: es de las que más me ayudan`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition hover:bg-amber-50 active:scale-90"
        >
          <Star key={String(row.is_best)} className={`h-7 w-7 ${row.is_best ? "ant-star fill-amber-400 text-amber-600" : "text-slate-400"}`} aria-hidden="true" />
        </button>
      </div>

      <Expand open={open}>
        <div className="space-y-2 px-3 pb-3">
          {row.ingredients.length > 0 ? (
            <DetailBlock title="Ingredientes">
              <ChipList items={row.ingredients} className="bg-amber-100 text-amber-950" />
            </DetailBlock>
          ) : null}
          {row.preparation ? <DetailBlock title="Cómo se prepara">{row.preparation}</DetailBlock> : null}
          {row.application ? <DetailBlock title="Cómo se aplica">{row.application}</DetailBlock> : null}
          {row.side_effects.length > 0 || row.side_effect_notes ? (
            <DetailBlock title="Efectos secundarios">
              {row.side_effects.length > 0 ? <ChipList items={row.side_effects} className="bg-amber-100 text-amber-950" /> : null}
              {row.side_effect_notes ? <p className={row.side_effects.length > 0 ? "mt-2" : ""}>{row.side_effect_notes}</p> : null}
            </DetailBlock>
          ) : null}
          <RowActions
            onEdit={onEdit}
            onDelete={onDelete}
            extra={
              <button
                type="button"
                onClick={onToggleStatus}
                className="flex min-h-12 w-full items-center justify-center rounded-full bg-violet-100 px-4 py-2 text-base font-semibold text-violet-900 transition active:scale-[0.98]"
              >
                Cambiar a «{isCurrent ? meta.past : meta.current}»
              </button>
            }
          />
        </div>
      </Expand>
    </li>
  );
}

export function MedicinesPanel({
  store,
  knownMedications
}: {
  store: RowStore<MedicineRow, MedicineInput>;
  knownMedications: string[];
}) {
  const { rows } = store;
  const [kind, setKind] = useState<MedicineKind>("medicine");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ initial: MedicineInput; id: string | null } | null>(null);
  const { toastElement, showToast } = useToast();

  const counts = useMemo(
    () => ({
      medicine: rows.filter((row) => row.kind === "medicine").length,
      natural: rows.filter((row) => row.kind === "natural").length,
      remedy: rows.filter((row) => row.kind === "remedy").length
    }),
    [rows]
  );
  const best = rows.filter((row) => row.is_best);

  const visible = rows
    .filter((row) => row.kind === kind && FILTER_TEST[filter](row))
    .filter((row) =>
      matchesSearch(query, [row.name, row.purpose, row.preparation, row.application, ...row.ingredients, ...row.side_effects])
    )
    .sort(
      (a, b) =>
        Number(b.is_best) - Number(a.is_best) ||
        Number(b.status === "current") - Number(a.status === "current") ||
        a.name.localeCompare(b.name, "es")
    );

  const hasAny = counts[kind] > 0;
  const meta = KINDS[kind];
  const KindIcon = meta.icon;

  const quickPatch = async (id: string, changes: Partial<MedicineInput>, message: string) => {
    try {
      await store.patch(id, changes);
      showToast(message);
    } catch {
      showToast(SAVE_ERROR, true);
    }
  };

  return (
    <div className="space-y-5">
      <Hero
        tone="violet"
        art={<MedicineArt />}
        title="Mis medicinas"
        text="Todo lo que has usado para cuidarte, en un solo lugar."
        stats={[
          { label: "Medicinas", value: counts.medicine },
          { label: "Naturales", value: counts.natural },
          { label: "Remedios", value: counts.remedy }
        ]}
      >
        {best.length > 0 ? (
          <div className="ant-shine-box rounded-2xl bg-amber-300 p-3 text-amber-950">
            <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              Las que más te ayudan
            </p>
            <p className="mt-1 text-lg font-bold leading-6 [overflow-wrap:anywhere]">{best.map((row) => row.name).join(", ")}</p>
          </div>
        ) : null}
      </Hero>

      <div className="ant-kinds grid grid-cols-3 gap-2" role="group" aria-label="Tipo de medicina">
        {KIND_ORDER.map((value, index) => {
          const item = KINDS[value];
          const Icon = item.icon;
          const selected = kind === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                setKind(value);
                setFilter("all");
                setQuery("");
              }}
              aria-pressed={selected}
              className={`ant-pop flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-3xl border-2 p-2 text-center text-base font-bold leading-5 transition active:scale-95 ${
                selected ? "border-violet-700 bg-violet-700 text-white shadow-soft" : "border-black/10 bg-white text-ink"
              }`}
              style={{ "--i": index } as CSSProperties}
            >
              <Icon className="h-7 w-7 shrink-0" aria-hidden="true" />
              {item.tab}
            </button>
          );
        })}
      </div>

      <AddButton tone="violet" label={meta.add} onClick={() => setForm({ initial: emptyDraft(kind), id: null })} />

      {hasAny ? (
        <>
          <SearchBox tone="violet" value={query} onChange={setQuery} label={`Buscar en ${meta.tab.toLowerCase()}`} />
          <FilterChips tone="violet" label="Filtrar" options={FILTERS} value={filter} onChange={setFilter} />
        </>
      ) : null}

      {kind === "remedy" && hasAny ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-5 text-amber-950">
          Cuéntale a tu médico qué remedios usas: algunos pueden cambiar el efecto de tus medicinas.
        </p>
      ) : null}

      {!hasAny ? (
        <Empty tone="violet" icon={<KindIcon className="h-10 w-10" />} title={meta.emptyTitle} text={meta.emptyText} />
      ) : visible.length === 0 ? (
        <Empty tone="violet" icon={<KindIcon className="h-10 w-10" />} title="No encontré nada" text="Prueba con otra palabra o toca «Todo»." />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {visible.map((row, index) => (
            <MedicineCard
              key={row.id}
              row={row}
              index={index}
              onEdit={() => setForm({ initial: toDraft(row), id: row.id })}
              onToggleBest={() => quickPatch(row.id, { is_best: !row.is_best }, row.is_best ? "Quitada de las que más te ayudan" : "¡Marcada como de las que más te ayudan!")}
              onToggleStatus={() => quickPatch(row.id, { status: row.status === "current" ? "past" : "current" }, "Listo, quedó actualizado")}
              onDelete={async () => {
                try {
                  await store.remove(row.id);
                  showToast("Borrado");
                } catch {
                  showToast("No se pudo borrar. Inténtalo de nuevo.", true);
                }
              }}
            />
          ))}
        </ul>
      )}

      {form ? (
        <MedicineForm
          initial={form.initial}
          editingId={form.id}
          rows={rows}
          knownMedications={knownMedications}
          onClose={() => setForm(null)}
          onSave={async (input, id) => {
            await store.save(input, id);
            setForm(null);
            showToast("¡Guardado!");
          }}
        />
      ) : null}
      {toastElement}
    </div>
  );
}
