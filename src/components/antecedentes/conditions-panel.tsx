"use client";

import { useState, type CSSProperties } from "react";
import { Activity, Clock, Dna, HeartPulse, PartyPopper, ShieldCheck, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  AFFECTED_AREA_OPTIONS,
  CAUSE_OPTIONS,
  CONDITION_SUGGESTIONS,
  GENETIC_CAUSE,
  HOW_CURED_SUGGESTIONS,
  SYMPTOM_OPTIONS,
  agedDuration,
  cleanText,
  durationText,
  localToday,
  matchesSearch,
  sameText,
  type ConditionInput,
  type ConditionKind,
  type ConditionRow,
  type RowStore,
  type Trend
} from "@/lib/antecedentes";
import {
  AddButton,
  Badge,
  ChipList,
  ChipPicker,
  ConditionArt,
  DetailBlock,
  DurationField,
  Empty,
  Expand,
  ExpandChevron,
  Field,
  FormSheet,
  Hero,
  RowActions,
  SAVE_ERROR,
  SearchBox,
  TextHelpers,
  fieldClass,
  useToast,
  useToday
} from "./antecedentes-ui";

const TRENDS: { value: Trend; label: string; icon: typeof Minus; on: string }[] = [
  { value: "better", label: "Mejor", icon: TrendingUp, on: "border-emerald-700 bg-emerald-700 text-white" },
  { value: "same", label: "Igual", icon: Minus, on: "border-amber-600 bg-amber-500 text-amber-950" },
  { value: "worse", label: "Peor", icon: TrendingDown, on: "border-red-700 bg-red-700 text-white" }
];

function emptyDraft(kind: ConditionKind): ConditionInput {
  return {
    kind,
    name: "",
    symptoms: [],
    affected_areas: [],
    affected_notes: null,
    duration_value: null,
    duration_unit: null,
    duration_as_of: null,
    trend: null,
    how_cured: null,
    causes: [],
    cause_notes: null,
    ended_year: null
  };
}

function toDraft(row: ConditionRow, today: string): ConditionInput {
  return {
    kind: row.kind,
    name: row.name,
    symptoms: row.symptoms,
    affected_areas: row.affected_areas,
    affected_notes: row.affected_notes,
    duration_value: agedDuration(row, today),
    duration_unit: row.duration_unit,
    duration_as_of: row.duration_as_of,
    trend: row.trend,
    how_cured: row.how_cured,
    causes: row.causes,
    cause_notes: row.cause_notes,
    ended_year: row.ended_year
  };
}

function ConditionForm({
  initial,
  editingId,
  healed,
  rows,
  onSave,
  onClose
}: {
  initial: ConditionInput;
  editingId: string | null;
  healed: boolean;
  rows: ConditionRow[];
  onSave: (input: ConditionInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (changes: Partial<ConditionInput>) => setDraft((current) => ({ ...current, ...changes }));

  const isCurrent = draft.kind === "current";
  const currentYear = Number(localToday().slice(0, 4));
  const nameIdeas = editingId
    ? []
    : CONDITION_SUGGESTIONS[draft.kind].filter((name) => !rows.some((row) => sameText(row.name, name)));

  const submit = async () => {
    const name = draft.name.trim();
    if (name === "") {
      setError("Escribe el nombre de la enfermedad.");
      return;
    }
    if (draft.ended_year !== null && (draft.ended_year < 1900 || draft.ended_year > currentYear)) {
      setError(`El año debe estar entre 1900 y ${currentYear}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          ...draft,
          name,
          affected_notes: cleanText(draft.affected_notes),
          duration_unit: draft.duration_value === null ? null : draft.duration_unit ?? "months",
          duration_as_of: draft.duration_value === null ? null : localToday(),
          trend: isCurrent ? draft.trend : null,
          how_cured: isCurrent ? null : cleanText(draft.how_cured),
          causes: isCurrent ? [] : draft.causes,
          cause_notes: isCurrent ? null : cleanText(draft.cause_notes),
          ended_year: isCurrent ? null : draft.ended_year
        },
        editingId ?? undefined
      );
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  const title = healed ? "¡Qué buena noticia! Cuéntanos cómo te curaste" : `${editingId ? "Editar" : "Agregar"} enfermedad ${isCurrent ? "actual" : "anterior"}`;

  return (
    <FormSheet
      tone="rose"
      title={title}
      icon={healed ? <PartyPopper className="h-7 w-7" /> : <HeartPulse className="h-7 w-7" />}
      saving={saving}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <Field label="¿Qué enfermedad?">
        <input
          type="text"
          value={draft.name}
          maxLength={120}
          onChange={(event) => set({ name: event.target.value })}
          placeholder={isCurrent ? "Ej. Diabetes" : "Ej. Neumonía"}
          className={fieldClass("rose")}
        />
        {nameIdeas.length > 0 && draft.name.trim() === "" ? (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {nameIdeas.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => set({ name })}
                className="ant-pop flex min-h-10 items-center rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-800 transition active:scale-95"
              >
                {name}
              </button>
            ))}
          </span>
        ) : null}
      </Field>

      <DurationField
        tone="rose"
        label={isCurrent ? "¿Cuánto tiempo llevas con ella?" : "¿Cuánto tiempo te duró?"}
        value={draft.duration_value}
        unit={draft.duration_unit}
        onChange={(duration_value, duration_unit) => set({ duration_value, duration_unit })}
      />

      {!isCurrent ? (
        <Field label="¿En qué año fue?" hint="Opcional">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={draft.ended_year ?? ""}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "");
              set({ ended_year: digits === "" ? null : Number(digits) });
            }}
            placeholder="Ej. 2015"
            className={fieldClass("rose")}
          />
        </Field>
      ) : null}

      <ChipPicker
        tone="rose"
        label={isCurrent ? "Síntomas y efectos que te causa" : "¿Qué síntomas tenías?"}
        hint="Toca todos los que correspondan o escribe otros."
        options={SYMPTOM_OPTIONS}
        value={draft.symptoms}
        onChange={(symptoms) => set({ symptoms })}
        placeholder="Otro síntoma"
      />

      <ChipPicker
        tone="rose"
        label={isCurrent ? "¿En qué otras cosas te ha afectado?" : "¿En qué te afectaba?"}
        options={AFFECTED_AREA_OPTIONS}
        value={draft.affected_areas}
        onChange={(affected_areas) => set({ affected_areas })}
        placeholder="Otra cosa"
      />

      <Field label="Cuéntalo con tus palabras" hint="Opcional">
        <textarea
          rows={2}
          value={draft.affected_notes ?? ""}
          maxLength={500}
          onChange={(event) => set({ affected_notes: event.target.value })}
          placeholder={isCurrent ? "Ej. Ya no puedo subir escaleras sin descansar" : "Ej. Tuve que dejar de trabajar dos meses"}
          className={fieldClass("rose")}
        />
      </Field>

      {!isCurrent ? (
        <>
          <div>
            <Field label="¿Cómo te curaste?">
              <textarea
                rows={2}
                value={draft.how_cured ?? ""}
                maxLength={1000}
                onChange={(event) => set({ how_cured: event.target.value })}
                placeholder="Ej. Con antibióticos y una semana de reposo"
                className={fieldClass("rose")}
              />
            </Field>
            <TextHelpers tone="rose" options={HOW_CURED_SUGGESTIONS} value={draft.how_cured ?? ""} onPick={(how_cured) => set({ how_cured })} />
          </div>

          <ChipPicker
            tone="rose"
            label="¿Qué te la causó o pudo haberla causado?"
            hint="Si viene de familia, marca «Genética o de familia»."
            options={CAUSE_OPTIONS}
            value={draft.causes}
            onChange={(causes) => set({ causes })}
            placeholder="Otra causa"
          />

          <Field label="Detalles de la causa" hint="Opcional">
            <textarea
              rows={2}
              value={draft.cause_notes ?? ""}
              maxLength={500}
              onChange={(event) => set({ cause_notes: event.target.value })}
              placeholder="Ej. Mi mamá también la tuvo"
              className={fieldClass("rose")}
            />
          </Field>
        </>
      ) : null}
    </FormSheet>
  );
}

function CurrentCard({
  row,
  index,
  today,
  onEdit,
  onTrend,
  onHealed,
  onDelete
}: {
  row: ConditionRow;
  index: number;
  today: string | null;
  onEdit: () => void;
  onTrend: (trend: Trend) => void;
  onHealed: () => void;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const duration = durationText(row, today);

  return (
    <li className="ant-rise overflow-hidden rounded-3xl border-2 border-black/10 bg-white" style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 p-3 text-left transition active:scale-[0.99]">
        <span className="ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700" aria-hidden="true">
          <Activity className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{row.name}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {duration ? (
              <Badge className="bg-orange-100 text-orange-950">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                {duration}
              </Badge>
            ) : null}
            {row.symptoms.length > 0 ? <Badge className="bg-rose-100 text-rose-900">{row.symptoms.length === 1 ? "1 síntoma" : `${row.symptoms.length} síntomas`}</Badge> : null}
          </span>
        </span>
        <ExpandChevron />
      </button>

      <div className="px-3 pb-3">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">¿Cómo te has sentido?</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5" role="group" aria-label={`Cómo va ${row.name}`}>
          {TRENDS.map((trend) => {
            const selected = row.trend === trend.value;
            const Icon = trend.icon;
            return (
              <button
                key={trend.value}
                type="button"
                onClick={() => onTrend(trend.value)}
                aria-pressed={selected}
                className={`flex min-h-12 flex-wrap items-center justify-center gap-1 rounded-2xl border-2 px-1 py-1.5 text-base font-semibold leading-5 transition active:scale-95 ${
                  selected ? trend.on : "border-black/10 bg-white text-ink"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {trend.label}
              </button>
            );
          })}
        </div>
      </div>

      <Expand open={open}>
        <div className="space-y-2 px-3 pb-3">
          {row.symptoms.length > 0 ? (
            <DetailBlock title="Síntomas y efectos">
              <ChipList items={row.symptoms} className="bg-rose-100 text-rose-900" />
            </DetailBlock>
          ) : null}
          {row.affected_areas.length > 0 || row.affected_notes ? (
            <DetailBlock title="En qué me ha afectado">
              {row.affected_areas.length > 0 ? <ChipList items={row.affected_areas} className="bg-orange-100 text-orange-950" /> : null}
              {row.affected_notes ? <p className={row.affected_areas.length > 0 ? "mt-2" : ""}>{row.affected_notes}</p> : null}
            </DetailBlock>
          ) : null}
          <RowActions
            onEdit={onEdit}
            onDelete={onDelete}
            extra={
              <button
                type="button"
                onClick={onHealed}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-base font-semibold text-white transition hover:bg-emerald-800 active:scale-[0.98]"
              >
                <PartyPopper className="h-5 w-5 shrink-0" aria-hidden="true" />
                Ya me curé
              </button>
            }
          />
        </div>
      </Expand>
    </li>
  );
}

function PastCard({ row, index, onEdit, onDelete }: { row: ConditionRow; index: number; onEdit: () => void; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const duration = durationText(row, null);
  const genetic = row.causes.includes(GENETIC_CAUSE);

  return (
    <li className="ant-rise" style={{ "--i": index } as CSSProperties}>
      <span className="ant-timeline-dot absolute left-0 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-soft" aria-hidden="true">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <div className="overflow-hidden rounded-3xl border-2 border-black/10 bg-white">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 p-3 text-left transition active:scale-[0.99]">
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{row.name}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              {row.ended_year ? <Badge className="bg-slate-100 text-slate-800">Año {row.ended_year}</Badge> : null}
              {duration ? (
                <Badge className="bg-orange-100 text-orange-950">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {duration}
                </Badge>
              ) : null}
              {genetic ? (
                <Badge className="bg-violet-100 text-violet-900">
                  <Dna className="h-4 w-4 shrink-0" aria-hidden="true" />
                  De familia
                </Badge>
              ) : null}
            </span>
          </span>
          <ExpandChevron />
        </button>

        <Expand open={open}>
          <div className="space-y-2 px-3 pb-3">
            {row.symptoms.length > 0 ? (
              <DetailBlock title="Síntomas que tenía">
                <ChipList items={row.symptoms} className="bg-rose-100 text-rose-900" />
              </DetailBlock>
            ) : null}
            {row.affected_areas.length > 0 || row.affected_notes ? (
              <DetailBlock title="En qué me afectaba">
                {row.affected_areas.length > 0 ? <ChipList items={row.affected_areas} className="bg-orange-100 text-orange-950" /> : null}
                {row.affected_notes ? <p className={row.affected_areas.length > 0 ? "mt-2" : ""}>{row.affected_notes}</p> : null}
              </DetailBlock>
            ) : null}
            {row.how_cured ? <DetailBlock title="Cómo me curé">{row.how_cured}</DetailBlock> : null}
            {row.causes.length > 0 || row.cause_notes ? (
              <DetailBlock title="Qué la causó o pudo causarla">
                {row.causes.length > 0 ? <ChipList items={row.causes} className="bg-violet-100 text-violet-900" /> : null}
                {row.cause_notes ? <p className={row.causes.length > 0 ? "mt-2" : ""}>{row.cause_notes}</p> : null}
              </DetailBlock>
            ) : null}
            <RowActions onEdit={onEdit} onDelete={onDelete} />
          </div>
        </Expand>
      </div>
    </li>
  );
}

function topSymptoms(rows: ConditionRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => row.symptoms.forEach((symptom) => counts.set(symptom, (counts.get(symptom) ?? 0) + 1)));
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .slice(0, 3)
    .map(([symptom]) => symptom);
}

export function ConditionsPanel({ store }: { store: RowStore<ConditionRow, ConditionInput> }) {
  const { rows } = store;
  const today = useToday();
  const [view, setView] = useState<ConditionKind>("current");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ initial: ConditionInput; id: string | null; healed: boolean } | null>(null);
  const { toastElement, showToast } = useToast();

  const current = rows.filter((row) => row.kind === "current");
  const past = rows.filter((row) => row.kind === "past");
  const genetic = rows.filter((row) => row.causes.includes(GENETIC_CAUSE)).length;
  const frequent = topSymptoms(current);

  const list = (view === "current" ? current : past)
    .filter((row) =>
      matchesSearch(query, [row.name, row.how_cured, row.affected_notes, row.cause_notes, ...row.symptoms, ...row.affected_areas, ...row.causes])
    )
    .sort((a, b) => (view === "past" ? (b.ended_year ?? 0) - (a.ended_year ?? 0) : 0) || b.created_at.localeCompare(a.created_at));

  const handleDelete = async (id: string) => {
    try {
      await store.remove(id);
      showToast("Borrado");
    } catch {
      showToast("No se pudo borrar. Inténtalo de nuevo.", true);
    }
  };

  const tabButton = (value: ConditionKind, label: string) => (
    <button
      type="button"
      onClick={() => {
        setView(value);
        setQuery("");
      }}
      aria-pressed={view === value}
      className={`min-h-12 rounded-full px-4 py-2 text-base font-semibold transition active:scale-95 ${
        view === value ? "bg-accent text-white shadow-soft" : "text-ink"
      }`}
    >
      {label}
    </button>
  );

  const hasAny = (view === "current" ? current : past).length > 0;

  return (
    <div className="space-y-5">
      <Hero
        tone="rose"
        art={<ConditionArt />}
        title="Mis enfermedades"
        text="Lo que tienes ahora y lo que ya pasaste, para contárselo bien a tu médico."
        stats={[
          { label: "Actuales", value: current.length },
          { label: "Anteriores", value: past.length },
          { label: "De familia", value: genetic }
        ]}
      >
        {view === "current" && frequent.length > 0 ? (
          <div className="rounded-2xl bg-black/20 p-3">
            <p className="text-sm font-bold uppercase tracking-wide">Lo que más sientes</p>
            <p className="mt-1 text-lg font-bold leading-6">{frequent.join(", ")}</p>
          </div>
        ) : null}
      </Hero>

      <div className="ab-card grid grid-cols-2 gap-1 rounded-full p-1.5" role="group" aria-label="Tipo de enfermedad">
        {tabButton("current", "Actuales")}
        {tabButton("past", "Anteriores")}
      </div>

      <AddButton
        tone="rose"
        label={view === "current" ? "Agregar enfermedad actual" : "Agregar enfermedad anterior"}
        onClick={() => setForm({ initial: emptyDraft(view), id: null, healed: false })}
      />

      {hasAny ? <SearchBox tone="rose" value={query} onChange={setQuery} label={view === "current" ? "Buscar en actuales" : "Buscar en anteriores"} /> : null}

      {!hasAny ? (
        view === "current" ? (
          <Empty tone="rose" icon={<Activity className="h-10 w-10" />} title="Sin enfermedades actuales" text="Si tienes alguna, agrégala con sus síntomas y desde cuándo la tienes." />
        ) : (
          <Empty tone="rose" icon={<ShieldCheck className="h-10 w-10" />} title="Sin enfermedades anteriores" text="Anota las que ya pasaste, cómo te curaste y qué las causó." />
        )
      ) : list.length === 0 ? (
        <Empty tone="rose" icon={<Activity className="h-10 w-10" />} title="No encontré nada" text="Prueba con otra palabra." />
      ) : view === "current" ? (
        <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
          {list.map((row, index) => (
            <CurrentCard
              key={row.id}
              row={row}
              index={index}
              today={today}
              onEdit={() => setForm({ initial: toDraft(row, localToday()), id: row.id, healed: false })}
              onTrend={async (trend) => {
                try {
                  await store.patch(row.id, { trend: row.trend === trend ? null : trend });
                } catch {
                  showToast(SAVE_ERROR, true);
                }
              }}
              onHealed={() =>
                setForm({
                  initial: { ...toDraft(row, localToday()), kind: "past", trend: null, ended_year: Number(localToday().slice(0, 4)) },
                  id: row.id,
                  healed: true
                })
              }
              onDelete={() => handleDelete(row.id)}
            />
          ))}
        </ul>
      ) : (
        <ul className="ant-timeline space-y-3">
          {list.map((row, index) => (
            <PastCard
              key={row.id}
              row={row}
              index={index}
              onEdit={() => setForm({ initial: toDraft(row, localToday()), id: row.id, healed: false })}
              onDelete={() => handleDelete(row.id)}
            />
          ))}
        </ul>
      )}

      {form ? (
        <ConditionForm
          initial={form.initial}
          editingId={form.id}
          healed={form.healed}
          rows={rows}
          onClose={() => setForm(null)}
          onSave={async (input, id) => {
            await store.save(input, id);
            setForm(null);
            showToast(form.healed ? "¡Felicidades! Pasó a Anteriores" : "¡Guardado!");
            if (form.healed) setView("past");
          }}
        />
      ) : null}
      {toastElement}
    </div>
  );
}
