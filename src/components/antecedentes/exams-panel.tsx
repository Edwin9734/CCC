"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  Activity,
  ArrowDownUp,
  Baby,
  Bone,
  Brain,
  CalendarDays,
  Candy,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  ClipboardPlus,
  Droplet,
  Droplets,
  Fish,
  FlaskConical,
  HeartPulse,
  type LucideIcon,
  MapPin,
  Microscope,
  ScanLine,
  ShieldPlus,
  Stethoscope,
  TestTube,
  Toilet,
  Waves
} from "lucide-react";
import {
  EXAM_REASON_SUGGESTIONS,
  cleanText,
  formatLongDate,
  localToday,
  matchesSearch,
  type ExamInput,
  type ExamRow,
  type ResultStatus,
  type RowStore
} from "@/lib/antecedentes";
import {
  AddButton,
  Badge,
  ChoicePills,
  DetailBlock,
  Empty,
  ExamArt,
  Expand,
  ExpandChevron,
  Field,
  FilterChips,
  FormSheet,
  Group,
  Hero,
  RowActions,
  SAVE_ERROR,
  SearchBox,
  TextHelpers,
  fieldClass,
  useToast,
  useToday
} from "./antecedentes-ui";

const OTHER = "Otro";

const EXAM_TYPES: { label: string; icon: LucideIcon; tile: string }[] = [
  { label: "Sangre general", icon: Droplet, tile: "bg-red-100 text-red-700" },
  { label: "Glucosa", icon: Candy, tile: "bg-pink-100 text-pink-700" },
  { label: "Colesterol y triglicéridos", icon: HeartPulse, tile: "bg-rose-100 text-rose-700" },
  { label: "Orina", icon: FlaskConical, tile: "bg-amber-100 text-amber-800" },
  { label: "Heces", icon: Toilet, tile: "bg-orange-100 text-orange-900" },
  { label: "Radiografía o rayos X", icon: Bone, tile: "bg-slate-200 text-slate-800" },
  { label: "Ultrasonido", icon: Waves, tile: "bg-cyan-100 text-cyan-800" },
  { label: "Tomografía", icon: ScanLine, tile: "bg-indigo-100 text-indigo-800" },
  { label: "Resonancia", icon: Brain, tile: "bg-violet-100 text-violet-800" },
  { label: "Electrocardiograma", icon: Activity, tile: "bg-emerald-100 text-emerald-800" },
  { label: "Tiroides", icon: TestTube, tile: "bg-teal-100 text-teal-800" },
  { label: "Riñón e hígado", icon: Droplets, tile: "bg-lime-100 text-lime-800" },
  { label: "Mamografía", icon: ShieldPlus, tile: "bg-fuchsia-100 text-fuchsia-800" },
  { label: "Papanicolaou", icon: Baby, tile: "bg-purple-100 text-purple-800" },
  { label: "Próstata", icon: Stethoscope, tile: "bg-blue-100 text-blue-800" },
  { label: "Endoscopía o colonoscopía", icon: Fish, tile: "bg-sky-100 text-sky-800" },
  { label: "Biopsia", icon: Microscope, tile: "bg-stone-200 text-stone-800" },
  { label: OTHER, icon: ClipboardPlus, tile: "bg-sky-100 text-sky-800" }
];

const KNOWN_LABELS = EXAM_TYPES.map((type) => type.label);

function typeMeta(label: string) {
  return EXAM_TYPES.find((type) => type.label === label) ?? EXAM_TYPES[EXAM_TYPES.length - 1];
}

const STATUS: Record<ResultStatus, { label: string; badge: string; icon: LucideIcon }> = {
  normal: { label: "Todo normal", badge: "bg-emerald-100 text-emerald-900", icon: CircleCheck },
  attention: { label: "Algo salió alterado", badge: "bg-amber-100 text-amber-950", icon: CircleAlert },
  unknown: { label: "No lo sé", badge: "bg-slate-100 text-slate-700", icon: CircleHelp }
};

const STATUS_OPTIONS = (Object.keys(STATUS) as ResultStatus[]).map((value) => ({ value, label: STATUS[value].label }));

const EMPTY_DRAFT: ExamInput = { exam_type: "", exam_date: null, place: null, reason: null, result_text: null, result_status: null };

function ExamForm({
  initial,
  editingId,
  onSave,
  onClose
}: {
  initial: ExamInput;
  editingId: string | null;
  onSave: (input: ExamInput, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const startsCustom = initial.exam_type !== "" && !KNOWN_LABELS.includes(initial.exam_type);
  const [draft, setDraft] = useState(initial);
  const [selected, setSelected] = useState(startsCustom ? OTHER : initial.exam_type);
  const [custom, setCustom] = useState(startsCustom ? initial.exam_type : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (changes: Partial<ExamInput>) => setDraft((current) => ({ ...current, ...changes }));
  const today = localToday();

  const submit = async () => {
    const examType = selected === OTHER ? custom.trim() : selected;
    if (examType === "") {
      setError(selected === OTHER ? "Escribe qué examen fue." : "Elige qué examen te hiciste.");
      return;
    }
    if (draft.exam_date && draft.exam_date > today) {
      setError("La fecha no puede ser futura.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(
        {
          ...draft,
          exam_type: examType,
          exam_date: draft.exam_date || null,
          place: cleanText(draft.place),
          reason: cleanText(draft.reason),
          result_text: cleanText(draft.result_text)
        },
        editingId ?? undefined
      );
    } catch {
      setError(SAVE_ERROR);
      setSaving(false);
    }
  };

  return (
    <FormSheet
      tone="sky"
      title={editingId ? "Editar examen" : "Agregar examen"}
      icon={<Microscope className="h-7 w-7" />}
      saving={saving}
      error={error}
      onClose={onClose}
      onSubmit={submit}
    >
      <Group label="¿Qué examen te hiciste?">
        <div className="ant-type-grid grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXAM_TYPES.map((type, index) => {
            const Icon = type.icon;
            const isOn = selected === type.label;
            return (
              <button
                key={type.label}
                type="button"
                onClick={() => setSelected(type.label)}
                aria-pressed={isOn}
                className={`ant-pop relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center text-sm font-semibold leading-4 transition active:scale-95 ${
                  isOn ? "border-sky-700 bg-sky-50 text-sky-950" : "border-black/10 bg-white text-ink"
                }`}
                style={{ "--i": index } as CSSProperties}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${type.tile}`} aria-hidden="true">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{type.label}</span>
                {isOn ? (
                  <span className="ant-pop absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-700 text-white" aria-hidden="true">
                    <Check className="h-4 w-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Group>

      {selected === OTHER ? (
        <div className="ant-rise">
          <Field label="¿Cómo se llama el examen?">
            <input
              type="text"
              value={custom}
              maxLength={120}
              onChange={(event) => setCustom(event.target.value)}
              placeholder="Ej. Prueba de esfuerzo"
              className={fieldClass("sky")}
            />
          </Field>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Fecha" hint="Si no la recuerdas, déjala en blanco.">
          <input
            type="date"
            value={draft.exam_date ?? ""}
            max={today}
            onChange={(event) => set({ exam_date: event.target.value || null })}
            className={fieldClass("sky")}
          />
        </Field>
        <Field label="Lugar" hint="Clínica, hospital o laboratorio">
          <input
            type="text"
            value={draft.place ?? ""}
            maxLength={160}
            onChange={(event) => set({ place: event.target.value })}
            placeholder="Ej. Laboratorio central"
            className={fieldClass("sky")}
          />
        </Field>
      </div>

      <div>
        <Field label="¿Por qué te lo hiciste?">
          <textarea
            rows={2}
            value={draft.reason ?? ""}
            maxLength={500}
            onChange={(event) => set({ reason: event.target.value })}
            placeholder="Ej. Tenía dolor al orinar"
            className={fieldClass("sky")}
          />
        </Field>
        <TextHelpers tone="sky" options={EXAM_REASON_SUGGESTIONS} value={draft.reason ?? ""} onPick={(reason) => set({ reason })} />
      </div>

      <Group label="¿Cómo salió?" hint="Toca de nuevo para quitar la respuesta.">
        <ChoicePills
          tone="sky"
          options={STATUS_OPTIONS}
          value={draft.result_status}
          onChange={(value) => set({ result_status: draft.result_status === value ? null : value })}
        />
      </Group>

      <Field label="¿Qué decía el examen?" hint="Copia lo que recuerdes o lo que dice la hoja de resultados.">
        <textarea
          rows={4}
          value={draft.result_text ?? ""}
          maxLength={2000}
          onChange={(event) => set({ result_text: event.target.value })}
          placeholder="Ej. Hemoglobina 13.5, todo dentro de lo normal"
          className={fieldClass("sky")}
        />
      </Field>
    </FormSheet>
  );
}

function ExamCard({ row, index, onEdit, onDelete }: { row: ExamRow; index: number; onEdit: () => void; onDelete: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const meta = typeMeta(row.exam_type);
  const Icon = meta.icon;
  const status = row.result_status ? STATUS[row.result_status] : null;
  const StatusIcon = status?.icon;

  return (
    <li className="ant-rise overflow-hidden rounded-3xl border-2 border-black/10 bg-white" style={{ "--i": index } as CSSProperties}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-start gap-3 p-3 text-left transition active:scale-[0.99]">
        <span className={`ant-tile flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${meta.tile}`} aria-hidden="true">
          <Icon className="h-7 w-7" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold leading-6 text-ink [overflow-wrap:anywhere]">{row.exam_type}</span>
          <span className="mt-1 flex items-center gap-1.5 text-base leading-5 text-muted">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            {row.exam_date ? formatLongDate(row.exam_date) : "Fecha sin anotar"}
          </span>
          {row.place ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-base leading-5 text-muted [overflow-wrap:anywhere]">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{row.place}</span>
            </span>
          ) : null}
          {status && StatusIcon ? (
            <span className="mt-2 flex">
              <Badge className={status.badge}>
                <StatusIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {status.label}
              </Badge>
            </span>
          ) : null}
        </span>
        <ExpandChevron />
      </button>

      <Expand open={open}>
        <div className="space-y-2 px-3 pb-3">
          {row.reason ? <DetailBlock title="Por qué me lo hice">{row.reason}</DetailBlock> : null}
          {row.result_text ? <DetailBlock title="Qué decía">{row.result_text}</DetailBlock> : null}
          <RowActions onEdit={onEdit} onDelete={onDelete} />
        </div>
      </Expand>
    </li>
  );
}

const STATUS_ALL = "all";

export function ExamsPanel({ store }: { store: RowStore<ExamRow, ExamInput> }) {
  const { rows } = store;
  const today = useToday();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState(STATUS_ALL);
  const [newestFirst, setNewestFirst] = useState(true);
  const [form, setForm] = useState<{ initial: ExamInput; id: string | null } | null>(null);
  const { toastElement, showToast } = useToast();

  const groupOf = (row: ExamRow) => (KNOWN_LABELS.includes(row.exam_type) ? row.exam_type : OTHER);

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((row) => {
      const key = KNOWN_LABELS.includes(row.exam_type) ? row.exam_type : OTHER;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [
      { value: STATUS_ALL, label: "Todos", count: rows.length },
      ...KNOWN_LABELS.filter((label) => counts.has(label)).map((label) => ({ value: label, label, count: counts.get(label) }))
    ];
  }, [rows]);

  const thisYear = today ? rows.filter((row) => row.exam_date?.startsWith(today.slice(0, 4))).length : 0;
  const attention = rows.filter((row) => row.result_status === "attention").length;

  // Si se borró el último examen del tipo elegido, volvemos a mostrar todos.
  const activeFilter = typeOptions.some((option) => option.value === typeFilter) ? typeFilter : STATUS_ALL;

  const visible = rows
    .filter((row) => activeFilter === STATUS_ALL || groupOf(row) === activeFilter)
    .filter((row) => matchesSearch(query, [row.exam_type, row.place, row.reason, row.result_text]))
    .sort((a, b) => {
      if (!a.exam_date || !b.exam_date) return Number(Boolean(b.exam_date)) - Number(Boolean(a.exam_date));
      return newestFirst ? b.exam_date.localeCompare(a.exam_date) : a.exam_date.localeCompare(b.exam_date);
    });

  const years: { year: string; items: ExamRow[] }[] = [];
  visible.forEach((row) => {
    const year = row.exam_date ? row.exam_date.slice(0, 4) : "Sin fecha";
    const group = years.find((entry) => entry.year === year);
    if (group) group.items.push(row);
    else years.push({ year, items: [row] });
  });

  return (
    <div className="space-y-5">
      <Hero
        tone="sky"
        art={<ExamArt />}
        title="Mis exámenes"
        text="Resultados, fechas y lugares siempre a la mano."
        stats={[
          { label: "En total", value: rows.length },
          { label: "Este año", value: thisYear },
          { label: "Alterados", value: attention }
        ]}
      />

      <AddButton tone="sky" label="Agregar examen" onClick={() => setForm({ initial: EMPTY_DRAFT, id: null })} />

      {rows.length > 0 ? (
        <>
          <SearchBox tone="sky" value={query} onChange={setQuery} label="Buscar por examen, lugar o resultado" />
          <FilterChips tone="sky" label="Filtrar por tipo de examen" options={typeOptions} value={activeFilter} onChange={setTypeFilter} />
          <button
            type="button"
            onClick={() => setNewestFirst(!newestFirst)}
            className="flex min-h-11 items-center gap-2 rounded-full border-2 border-black/10 bg-white px-4 py-1.5 text-base font-semibold text-ink transition active:scale-95"
          >
            <ArrowDownUp className="h-5 w-5 shrink-0" aria-hidden="true" />
            {newestFirst ? "Primero los más recientes" : "Primero los más antiguos"}
          </button>
        </>
      ) : null}

      {rows.length === 0 ? (
        <Empty tone="sky" icon={<Microscope className="h-10 w-10" />} title="Aún no hay exámenes" text="Agrega los que te has hecho: de sangre, orina, heces, radiografías y otros." />
      ) : visible.length === 0 ? (
        <Empty tone="sky" icon={<Microscope className="h-10 w-10" />} title="No encontré nada" text="Prueba con otra palabra o toca «Todos»." />
      ) : (
        <div className="space-y-5">
          {years.map((group) => (
            <section key={group.year} aria-label={group.year}>
              <h3 className="ant-pop inline-flex rounded-full bg-sky-700 px-4 py-1 text-base font-bold text-white shadow-soft">{group.year}</h3>
              <ul className="mt-2 grid gap-3 lg:grid-cols-2 lg:items-start">
                {group.items.map((row, index) => (
                  <ExamCard
                    key={row.id}
                    row={row}
                    index={index}
                    onEdit={() =>
                      setForm({
                        initial: {
                          exam_type: row.exam_type,
                          exam_date: row.exam_date,
                          place: row.place,
                          reason: row.reason,
                          result_text: row.result_text,
                          result_status: row.result_status
                        },
                        id: row.id
                      })
                    }
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
            </section>
          ))}
        </div>
      )}

      {form ? (
        <ExamForm
          initial={form.initial}
          editingId={form.id}
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
