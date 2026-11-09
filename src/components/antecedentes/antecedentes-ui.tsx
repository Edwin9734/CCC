"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, CircleAlert, CircleCheck, Minus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { UNIT_OPTIONS, localToday, sameText, type DurationUnit } from "@/lib/antecedentes";
import { useDrawer } from "@/lib/use-drawer";

export type Tone = "violet" | "rose" | "sky";

const TONES: Record<Tone, { hero: string; solid: string; chipOn: string; focus: string; soft: string }> = {
  violet: {
    hero: "from-violet-800 via-purple-700 to-fuchsia-700",
    solid: "bg-violet-700 hover:bg-violet-800 text-white",
    chipOn: "border-violet-700 bg-violet-700 text-white",
    focus: "focus:border-violet-500 focus:ring-violet-100",
    soft: "bg-violet-100 text-violet-800"
  },
  rose: {
    hero: "from-rose-800 via-rose-700 to-orange-700",
    solid: "bg-rose-700 hover:bg-rose-800 text-white",
    chipOn: "border-rose-700 bg-rose-700 text-white",
    focus: "focus:border-rose-500 focus:ring-rose-100",
    soft: "bg-rose-100 text-rose-800"
  },
  sky: {
    hero: "from-sky-800 via-sky-700 to-indigo-700",
    solid: "bg-sky-700 hover:bg-sky-800 text-white",
    chipOn: "border-sky-700 bg-sky-700 text-white",
    focus: "focus:border-sky-500 focus:ring-sky-100",
    soft: "bg-sky-100 text-sky-800"
  }
};

export function toneClasses(tone: Tone) {
  return TONES[tone];
}

export function fieldClass(tone: Tone) {
  return `w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:ring-4 ${TONES[tone].focus}`;
}

// La fecha se calcula en el navegador para usar el día de la persona, no el del servidor.
export function useToday() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localToday()), []);
  return today;
}

export function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value === 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{shown}</>;
}

export function Hero({
  tone,
  art,
  title,
  text,
  stats,
  children
}: {
  tone: Tone;
  art: ReactNode;
  title: string;
  text: string;
  stats: { label: string; value: number }[];
  children?: ReactNode;
}) {
  return (
    <section className={`ant-rise relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br p-5 text-white shadow-soft sm:p-6 ${TONES[tone].hero}`}>
      <span className="ant-bubble -right-10 -top-12 h-44 w-44" aria-hidden="true" />
      <span className="ant-bubble -bottom-16 left-1/3 h-40 w-40" style={{ "--delay": "-2s" } as CSSProperties} aria-hidden="true" />

      <div className="relative flex items-center gap-4">
        <div className="ant-hero-art h-24 w-24 shrink-0 sm:h-28 sm:w-28">{art}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-8">{title}</h2>
          <p className="mt-1 text-base leading-6 text-white/90">{text}</p>
        </div>
      </div>

      <dl className="ant-stats relative mt-4 grid grid-cols-3 gap-2">
        {stats.map((stat, index) => (
          <div key={stat.label} className="ant-pop rounded-2xl bg-black/20 px-2 py-3 text-center" style={{ "--i": index + 3 } as CSSProperties}>
            <dd className="text-3xl font-bold leading-8 tabular-nums">
              <CountUp value={stat.value} />
            </dd>
            <dt className="mt-1 text-sm font-semibold leading-5">{stat.label}</dt>
          </div>
        ))}
      </dl>

      {children ? <div className="relative mt-4">{children}</div> : null}
    </section>
  );
}

export function AddButton({ tone, label, onClick }: { tone: Tone; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-lg font-bold shadow-soft transition active:scale-[0.98] ${TONES[tone].solid}`}
    >
      <Plus className="h-6 w-6 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}

export function SearchBox({ tone, value, onChange, label }: { tone: Tone; value: string; onChange: (next: string) => void; label: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        className={`${fieldClass(tone)} min-h-14 pl-12`}
      />
    </div>
  );
}

export function FilterChips<Value extends string>({
  tone,
  label,
  options,
  value,
  onChange
}: {
  tone: Tone;
  label: string;
  options: { value: Value; label: string; count?: number }[];
  value: Value;
  onChange: (next: Value) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-base font-semibold transition active:scale-95 ${
              selected ? TONES[tone].chipOn : "border-black/10 bg-white text-ink"
            }`}
          >
            {option.label}
            {option.count !== undefined ? <span className={selected ? "text-white/85" : "text-muted"}>{option.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={`inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold leading-4 ${className}`}>{children}</span>;
}

export function ChipList({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge className={className}>{item}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function DetailBlock({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <p className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </p>
      <div className="mt-1.5 whitespace-pre-line text-base leading-6 text-ink [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}

export function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className="ant-expand" data-open={open}>
      <div inert={!open}>{children}</div>
    </div>
  );
}

export function ExpandChevron() {
  return <ChevronDown className="ant-chevron mt-1 h-6 w-6 shrink-0 text-muted" aria-hidden="true" />;
}

export function Empty({ icon, title, text, tone }: { icon: ReactNode; title: string; text: string; tone: Tone }) {
  return (
    <div className="ant-rise ab-card flex flex-col items-center rounded-[1.75rem] p-6 text-center">
      <span className={`ant-pop flex h-20 w-20 items-center justify-center rounded-full ${TONES[tone].soft}`}>{icon}</span>
      <p className="mt-3 text-xl font-bold leading-7 text-ink">{title}</p>
      <p className="mt-1 max-w-md text-base leading-6 text-muted">{text}</p>
    </div>
  );
}

export function RowActions({ onEdit, onDelete, extra }: { onEdit: () => void; onDelete: () => Promise<void>; extra?: ReactNode }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (asking) {
    return (
      <div className="ant-pop flex flex-wrap items-center gap-2 rounded-2xl bg-rose-50 p-3">
        <p className="w-full text-base font-semibold text-rose-900">¿Seguro que quieres borrarlo? No se puede recuperar.</p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onDelete();
            setBusy(false);
            setAsking(false);
          }}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-red-700 px-4 py-2 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          <Trash2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          {busy ? "Borrando…" : "Sí, borrar"}
        </button>
        <button
          type="button"
          onClick={() => setAsking(false)}
          className="flex min-h-12 flex-1 items-center justify-center rounded-full border-2 border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition active:scale-[0.98]"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {extra}
      <button
        type="button"
        onClick={onEdit}
        className="flex min-h-12 flex-[1_1_9rem] items-center justify-center gap-2 rounded-full border-2 border-black/10 bg-white px-4 py-2 text-base font-semibold text-ink transition hover:bg-slate-50 active:scale-[0.98]"
      >
        <Pencil className="h-5 w-5 shrink-0" aria-hidden="true" />
        Editar
      </button>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="flex min-h-12 flex-[1_1_9rem] items-center justify-center gap-2 rounded-full border-2 border-rose-200 bg-white px-4 py-2 text-base font-semibold text-red-800 transition hover:bg-rose-50 active:scale-[0.98]"
      >
        <Trash2 className="h-5 w-5 shrink-0" aria-hidden="true" />
        Borrar
      </button>
    </div>
  );
}

// ---------- Mensaje breve al guardar ----------
export function useToast() {
  const [toast, setToast] = useState<{ id: number; text: string; error: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((text: string, error = false) => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), text, error });
    timer.current = window.setTimeout(() => setToast(null), error ? 5000 : 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const element = toast
    ? createPortal(
        <p
          key={toast.id}
          role="status"
          className={`ant-toast fixed bottom-[5.75rem] left-1/2 z-[70] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 text-base font-semibold text-white shadow-soft ${
            toast.error ? "bg-red-700" : "bg-emerald-700"
          }`}
        >
          {toast.error ? <CircleAlert className="h-5 w-5 shrink-0" aria-hidden="true" /> : <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />}
          {toast.text}
        </p>,
        document.body
      )
    : null;

  return { toastElement: element, showToast: show };
}

export const SAVE_ERROR = "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.";

// ---------- Formulario en ventana ----------
export function FormSheet({
  tone,
  title,
  icon,
  saving,
  error,
  submitLabel = "Guardar",
  onClose,
  onSubmit,
  children
}: {
  tone: Tone;
  title: string;
  icon: ReactNode;
  saving: boolean;
  error: string | null;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLFormElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const titleId = useId();
  useDrawer({ open: true, onClose, panelRef, returnFocusRef });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return createPortal(
    <div className="ant-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3">
      <form
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        noValidate
        className="ant-modal flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-surface text-ink shadow-soft"
      >
        <header className={`flex items-center gap-3 bg-gradient-to-br px-5 py-4 text-white ${TONES[tone].hero}`}>
          <span className="ant-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20" aria-hidden="true">
            {icon}
          </span>
          <h2 id={titleId} tabIndex={-1} data-autofocus className="min-w-0 flex-1 text-xl font-bold leading-7 outline-none [overflow-wrap:anywhere]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar sin guardar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-soft transition active:scale-95"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">{children}</div>

        <footer className="border-t border-black/10 bg-white p-3">
          {error ? (
            <p role="alert" className="ant-shake mb-2 rounded-2xl bg-rose-50 px-4 py-2 text-base font-semibold text-red-800">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-lg font-bold shadow-soft transition active:scale-[0.98] disabled:opacity-60 ${TONES[tone].solid}`}
          >
            <Check className="h-6 w-6 shrink-0" aria-hidden="true" />
            {saving ? "Guardando…" : submitLabel}
          </button>
        </footer>
      </form>
    </div>,
    document.body
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-base font-bold leading-6 text-ink">{label}</span>
      {hint ? <span className="block text-sm leading-5 text-muted">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="block text-base font-bold leading-6 text-ink">{label}</legend>
      {hint ? <p className="text-sm leading-5 text-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

export function ChoicePills<Value extends string>({
  tone,
  options,
  value,
  onChange,
  columns = "sm:grid-cols-3"
}: {
  tone: Tone;
  options: { value: Value; label: string }[];
  value: Value | null;
  onChange: (next: Value) => void;
  columns?: string;
}) {
  return (
    <div className={`grid gap-2 ${columns}`}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={`flex min-h-12 items-center justify-center gap-1 rounded-2xl border-2 px-1.5 py-2 text-center text-base font-semibold leading-5 transition active:scale-[0.97] ${
              selected ? TONES[tone].chipOn : "border-black/10 bg-white text-ink"
            }`}
          >
            {selected ? <Check className="ant-pill-check ant-pop h-5 w-5 shrink-0" aria-hidden="true" /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Lista de sugerencias que se marcan tocándolas, y un espacio para escribir otra.
export function ChipPicker({
  tone,
  label,
  hint,
  options,
  value,
  onChange,
  placeholder
}: {
  tone: Tone;
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const all = [...options, ...value.filter((item) => !options.includes(item))];

  const toggle = (item: string) => onChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item]);

  const add = () => {
    const typed = text.trim();
    if (typed === "") return;
    const existing = all.find((item) => sameText(item, typed));
    if (!existing) onChange([...value, typed]);
    else if (!value.includes(existing)) onChange([...value, existing]);
    setText("");
  };

  return (
    <Group label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {all.map((item) => {
          const selected = value.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={selected}
              className={`flex min-h-11 max-w-full items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-left text-base font-semibold leading-5 transition active:scale-95 ${
                selected ? TONES[tone].chipOn : "border-black/10 bg-white text-ink"
              }`}
            >
              {selected ? <Check className="ant-pop h-5 w-5 shrink-0" aria-hidden="true" /> : null}
              <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={text}
          maxLength={60}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className={fieldClass(tone)}
        />
        <button
          type="button"
          onClick={add}
          aria-label="Agregar a la lista"
          className={`flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full transition active:scale-95 ${TONES[tone].solid}`}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </Group>
  );
}

// Botones que escriben una frase dentro de un cuadro de texto.
export function TextHelpers({ tone, options, value, onPick }: { tone: Tone; options: string[]; value: string; onPick: (next: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((option) => {
        const used = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            disabled={used}
            onClick={() => onPick(value.trim() === "" ? option : `${value.trim()}. ${option}`)}
            className={`flex min-h-10 items-center gap-1 rounded-full px-3 py-1 text-left text-sm font-semibold leading-4 transition active:scale-95 disabled:opacity-45 ${TONES[tone].soft}`}
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function DurationField({
  tone,
  label,
  value,
  unit,
  onChange
}: {
  tone: Tone;
  label: string;
  value: number | null;
  unit: DurationUnit | null;
  onChange: (value: number | null, unit: DurationUnit | null) => void;
}) {
  const shownUnit = unit ?? "months";
  const step = (delta: number) => {
    const next = (value ?? 0) + delta;
    onChange(next < 1 ? null : Math.min(next, 5000), shownUnit);
  };

  return (
    <Group label={label} hint="Un aproximado está bien. Si no lo recuerdas, déjalo en blanco.">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Restar uno"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-black/10 bg-white text-ink transition active:scale-90"
        >
          <Minus className="h-6 w-6" aria-hidden="true" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={value ?? ""}
          placeholder="—"
          aria-label="Cantidad de tiempo"
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            const next = digits === "" ? 0 : Math.min(Number(digits), 5000);
            onChange(next < 1 ? null : next, shownUnit);
          }}
          className={`${fieldClass(tone)} min-h-14 text-center text-2xl font-bold`}
        />
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Sumar uno"
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${TONES[tone].solid}`}
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2">
        <ChoicePills tone={tone} options={UNIT_OPTIONS} value={shownUnit} onChange={(next) => onChange(value, next)} columns="grid-cols-2 sm:grid-cols-4" />
      </div>
    </Group>
  );
}

// ---------- Portadas animadas ----------
export function MedicineArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <g className="ant-float" style={{ "--delay": "-1.2s" } as CSSProperties}>
        <rect x="84" y="26" width="26" height="12" rx="6" fill="#fde68a" transform="rotate(-32 97 32)" />
      </g>
      <g className="ant-float" style={{ "--delay": "-2.2s" } as CSSProperties}>
        <circle cx="19" cy="42" r="8" fill="#a7f3d0" />
        <path d="M13 42h12" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="ant-float">
        <rect x="42" y="18" width="36" height="15" rx="4" fill="#fb7185" />
        <rect x="36" y="31" width="48" height="74" rx="11" fill="#fff" />
        <rect x="36" y="52" width="48" height="33" fill="#ede9fe" />
        <rect x="56" y="58" width="8" height="21" rx="2" fill="#7c3aed" />
        <rect x="49.5" y="64.5" width="21" height="8" rx="2" fill="#7c3aed" />
      </g>
    </svg>
  );
}

export function ConditionArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <path
        className="ant-beat"
        d="M60 100C26 76 15 60 15 43c0-14 11-24 24-24 9 0 16 4 21 12 5-8 12-12 21-12 13 0 24 10 24 24 0 17-11 33-45 57Z"
        fill="#fff"
      />
      <path
        className="ant-ecg"
        d="M24 56h20l6-14 10 30 8-22 4 6h24"
        fill="none"
        stroke="#e11d48"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}

export function ExamArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <rect x="28" y="20" width="62" height="86" rx="10" fill="#fff" />
      <rect x="45" y="13" width="28" height="15" rx="6" fill="#fbbf24" />
      <path d="M40 46h38M40 60h38M40 74h24" stroke="#bae6fd" strokeWidth="6" strokeLinecap="round" />
      <g className="ant-scan">
        <circle cx="82" cy="86" r="16" fill="#e0f2fe" fillOpacity="0.85" stroke="#0369a1" strokeWidth="6" />
        <path d="m94 98 12 12" stroke="#0369a1" strokeWidth="7" strokeLinecap="round" />
      </g>
    </svg>
  );
}
