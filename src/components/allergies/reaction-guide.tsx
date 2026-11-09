"use client";

import Link from "next/link";
import { useId, useRef, useState, type CSSProperties, type MouseEvent, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowDown,
  CircleHelp,
  Bug,
  ClipboardList,
  Dog,
  Droplets,
  FileText,
  Flame,
  Flower2,
  Footprints,
  Frown,
  HeartPulse,
  Leaf,
  type LucideIcon,
  MoreHorizontal,
  Phone,
  Pill,
  Save,
  Shirt,
  Siren,
  SprayCan,
  Sparkles,
  Sun,
  ThermometerSnowflake,
  Trash2,
  Utensils,
  Wind,
  X
} from "lucide-react";
import { REACTION_SIGNS, type ReactionLevel } from "@/lib/allergy-insights";
import { SEVERITY_LABEL, formatReactionDate, toLocalInputValue } from "@/lib/allergy-reactions";
import { telHref, type ContactsInfo } from "@/lib/contacts";
import type { AllergyReactionInput, AllergyReactionRow } from "@/lib/supabase/allergies";
import { useDrawer } from "@/lib/use-drawer";

type Sign = (typeof REACTION_SIGNS)[number];

const REACTION_TEXT: Record<ReactionLevel, { title: string; steps: string[]; header: string; tile: string }> = {
  severe: {
    title: "Busca atención de emergencia ahora",
    steps: [
      "Deja de comer o aléjate de lo que crees que la causó.",
      "Llama a emergencias o pide que te lleven de inmediato.",
      "Si te recetaron epinefrina, úsala como te indicó tu médico.",
      "No te quedes sin compañía."
    ],
    header: "bg-red-700 text-white",
    tile: "bg-red-100 text-red-700"
  },
  mild: {
    title: "Aléjate de lo que crees que la causó y llama a tu médico",
    steps: [
      "Anota lo que comiste, tocaste u oliste. Puedes guardarlo aquí mismo.",
      "Observa cómo sigues durante las próximas horas.",
      "Si aparece falta de aire, hinchazón de la cara o mareo, busca emergencia de inmediato."
    ],
    header: "bg-amber-100 text-amber-950",
    tile: "bg-amber-100 text-amber-800"
  }
};

const CAUSES: { label: string; icon: LucideIcon; hint?: string }[] = [
  { label: "Comida", icon: Utensils, hint: "Ej. Comí camarones en el almuerzo" },
  { label: "Polvo", icon: Wind, hint: "Ej. Estaba sacudiendo los muebles" },
  { label: "Olor", icon: Flower2, hint: "Ej. Olía a pintura en la casa" },
  { label: "Actividad", icon: Footprints, hint: "Ej. Salí a caminar y empezó la comezón" },
  { label: "Luz", icon: Sun, hint: "Ej. Estuve mucho rato bajo el sol" },
  { label: "Medicina", icon: Pill, hint: "Ej. Tomé una pastilla nueva en la mañana" },
  { label: "Picadura de insecto", icon: Bug, hint: "Ej. Me picó algo en el jardín" },
  { label: "Polen o plantas", icon: Leaf, hint: "Ej. Estuve arreglando las plantas" },
  { label: "Animales o mascotas", icon: Dog, hint: "Ej. Estuve cargando al gato" },
  { label: "Humedad o moho", icon: Droplets, hint: "Ej. Entré a un cuarto con humedad" },
  { label: "Humo", icon: Flame, hint: "Ej. Estaban quemando basura cerca" },
  { label: "Perfume o crema", icon: Sparkles, hint: "Ej. Usé una crema nueva" },
  { label: "Productos de limpieza", icon: SprayCan, hint: "Ej. Usé cloro para limpiar el baño" },
  { label: "Frío o calor", icon: ThermometerSnowflake, hint: "Ej. Hizo mucho frío en la mañana" },
  { label: "Ropa o tela", icon: Shirt, hint: "Ej. Estrené una blusa sin lavarla" },
  { label: "Estrés", icon: Frown, hint: "Ej. Tuve un día muy pesado" },
  { label: "Otra causa", icon: MoreHorizontal, hint: "Escribe aquí qué crees que fue" },
  { label: "No lo sé", icon: CircleHelp }
];

const DEFAULT_HINT = "Ej. Estaba limpiando la casa cuando empezó la comezón";
const HISTORY_PREVIEW = 5;

function scrollToId(id: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function DrawnCheck({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="m5 13 4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="alg-draw" />
    </svg>
  );
}

function CallButtons({ contacts }: { contacts: ContactsInfo | null }) {
  const rows = [
    contacts?.doctor?.phone ? { key: "doctor", label: "Llamar a mi médico", phone: contacts.doctor.phone } : null,
    contacts?.emergency?.phone
      ? { key: "emergency", label: `Llamar a ${contacts.emergency.name ?? "mi contacto"}`, phone: contacts.emergency.phone }
      : null
  ].filter((row): row is { key: string; label: string; phone: string } => row !== null);

  if (rows.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        Guarda a tu médico y un contacto de emergencia en «Mis datos» (arriba a la derecha) para llamarles desde aquí.
      </p>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <a
          key={row.key}
          href={telHref(row.phone)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-red-700 px-4 py-3 text-center text-base font-semibold text-white shadow-soft transition hover:bg-red-800 active:scale-[0.98]"
        >
          <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
          {row.label}
        </a>
      ))}
    </div>
  );
}

function ReactionDialog({
  sign,
  marked,
  contacts,
  onToggle,
  onClose,
  returnFocusRef
}: {
  sign: Sign;
  marked: boolean;
  contacts: ContactsInfo | null;
  onToggle: () => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const response = REACTION_TEXT[sign.level];
  useDrawer({ open: true, onClose, panelRef, returnFocusRef });

  return createPortal(
    <div onClick={onClose} className="alg-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3">
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="alg-modal max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface text-ink shadow-soft"
      >
        <header className={`relative px-5 pb-5 pt-6 text-center ${response.header}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-soft transition active:scale-95"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <span className="relative mx-auto flex h-20 w-20 items-center justify-center" aria-hidden="true">
            <span className="alg-sonar alg-sonar-white" />
            <span className="alg-sonar alg-sonar-white" />
            <span className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-white ${sign.level === "severe" ? "text-red-700" : "text-amber-700"}`}>
              {sign.level === "severe" ? <Siren className="h-9 w-9" /> : <HeartPulse className="h-9 w-9" />}
            </span>
          </span>
          <p className="mt-3 text-base font-semibold leading-6">{sign.label}</p>
          <h2 id={titleId} className="mt-1 text-2xl font-bold leading-8">
            {response.title}
          </h2>
        </header>

        <div className="space-y-4 p-5">
          <ol className="space-y-2">
            {response.steps.map((step, index) => (
              <li key={step} className="alg-rise flex items-start gap-3 rounded-2xl bg-background p-3 text-base leading-6" style={{ "--i": index + 2 } as CSSProperties}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{step}</span>
              </li>
            ))}
          </ol>

          <CallButtons contacts={contacts} />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onToggle}
              className="flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-emerald-700 bg-white px-4 py-3 text-base font-semibold text-emerald-900 transition hover:bg-emerald-50 active:scale-[0.98]"
            >
              {marked ? "Quitar de mi lista" : "Marcar este síntoma"}
            </button>
            <button
              type="button"
              onClick={onClose}
              data-autofocus
              className="flex min-h-14 items-center justify-center rounded-full bg-ink px-4 py-3 text-base font-semibold text-white transition active:scale-[0.98]"
            >
              Entendido
            </button>
          </div>
        </div>
      </section>
    </div>,
    document.body
  );
}

function SymptomCard({
  sign,
  index,
  marked,
  onOpen,
  onToggle
}: {
  sign: Sign;
  index: number;
  marked: boolean;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  onToggle: () => void;
}) {
  const severe = sign.level === "severe";
  const Icon = severe ? AlertTriangle : HeartPulse;

  return (
    <li
      className={`alg-rise flex overflow-hidden rounded-2xl border-2 bg-white transition-colors duration-300 ${marked ? "border-emerald-600 bg-emerald-50" : "border-black/10"}`}
      style={{ "--i": index } as CSSProperties}
    >
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left transition hover:bg-black/[0.03] active:scale-[0.98]">
        <span className={`alg-sign-tile flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${REACTION_TEXT[sign.level].tile}`} aria-hidden="true">
          <Icon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold leading-5 text-ink [overflow-wrap:anywhere]">{sign.label}</span>
          <span className={`mt-0.5 block text-sm font-semibold leading-5 ${severe ? "text-red-800" : "text-muted"}`}>
            {severe ? "Señal de alarma" : "Toca para ver qué hacer"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={marked}
        aria-label={`Marcar: ${sign.label}`}
        className="alg-sign-check flex w-16 shrink-0 items-center justify-center border-l border-black/10 transition hover:bg-emerald-50"
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition duration-200 ${
            marked ? "alg-pop border-emerald-600 bg-emerald-600 text-white" : "border-slate-400 bg-white"
          }`}
          aria-hidden="true"
        >
          {marked ? <DrawnCheck className="h-6 w-6" /> : null}
        </span>
      </button>
    </li>
  );
}

function ReactionLogForm({ signs, onSave, onSaved }: { signs: Sign[]; onSave: (input: AllergyReactionInput) => Promise<void>; onSaved: () => void }) {
  const [causes, setCauses] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [when, setWhen] = useState(() => toLocalInputValue(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ id: number; text: string } | null>(null);

  const lastCause = CAUSES.find((cause) => cause.label === causes[causes.length - 1]);
  const showError = (text: string) => setError((current) => ({ id: (current?.id ?? 0) + 1, text }));

  const toggleCause = (label: string) => {
    setCauses((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  };

  const save = async () => {
    if (!when) return showError("Escribe cuándo pasó.");
    if (new Date(when).getTime() > Date.now()) return showError("La fecha no puede ser después de hoy.");
    setBusy(true);
    setError(null);
    try {
      await onSave({
        occurred_at: when,
        symptoms: signs.map((sign) => sign.label),
        severity: signs.some((sign) => sign.level === "severe") ? "severe" : "mild",
        causes,
        details: details.trim() || null
      });
      onSaved();
    } catch (err) {
      console.error("Error al guardar la reacción:", err);
      showError("No se pudo guardar. Inténtalo de nuevo.");
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 space-y-5">
      <div>
        <h4 className="text-lg font-semibold text-ink">¿Qué crees que lo causó?</h4>
        <p className="text-sm leading-6 text-muted">Puedes elegir varias opciones.</p>
        <ul className="alg-cause-grid mt-3 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 lg:grid-cols-6">
          {CAUSES.map((cause, index) => {
            const picked = causes.includes(cause.label);
            return (
              <li key={cause.label} className="alg-pop" style={{ "--i": index } as CSSProperties}>
                <button
                  type="button"
                  onClick={() => toggleCause(cause.label)}
                  aria-pressed={picked}
                  className={`relative flex h-full min-h-24 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 text-center text-sm font-semibold leading-4 transition active:scale-95 ${
                    picked ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-transparent bg-white text-ink hover:border-black/10"
                  }`}
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${picked ? "bg-emerald-600 text-white" : "bg-sky-100 text-sky-800"}`} aria-hidden="true">
                    <cause.icon className="h-6 w-6" />
                  </span>
                  {cause.label}
                  {picked ? (
                    <span className="alg-pop absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
                      <DrawnCheck className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="grid gap-1 text-base font-semibold text-ink">
        Cuenta qué pasó (opcional)
        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={500}
          rows={3}
          placeholder={lastCause?.hint ?? DEFAULT_HINT}
          className="w-full min-w-0 resize-y rounded-2xl border border-black/10 bg-white px-4 py-3 text-base font-normal outline-none placeholder:text-muted focus:ring-4 focus:ring-accent/15"
        />
      </label>

      <label className="grid gap-1 text-base font-semibold text-ink">
        ¿Cuándo pasó?
        <input
          type="datetime-local"
          value={when}
          onChange={(event) => setWhen(event.target.value)}
          className="w-full min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-base font-normal outline-none focus:ring-4 focus:ring-accent/15"
        />
      </label>

      {error ? (
        <p key={error.id} role="alert" className="alg-shake rounded-2xl bg-rose-50 px-4 py-3 text-base font-semibold text-danger">
          {error.text}
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-accentDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save className="h-5 w-5 shrink-0" aria-hidden="true" />
        {busy ? "Guardando..." : "Guardar en mi historial"}
      </button>
    </div>
  );
}

function HistoryItem({ reaction, index, onDelete }: { reaction: AllergyReactionRow; index: number; onDelete: (id: string) => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const severe = reaction.severity === "severe";

  const remove = async () => {
    setBusy(true);
    setError(false);
    try {
      await onDelete(reaction.id);
    } catch (err) {
      console.error("Error al eliminar la reacción:", err);
      setError(true);
      setBusy(false);
    }
  };

  return (
    <li className="alg-rise relative pl-9" style={{ "--i": index } as CSSProperties}>
      <span className={`alg-timeline-dot absolute left-0 top-5 h-6 w-6 rounded-full border-4 border-white shadow-soft ${severe ? "bg-red-600" : "bg-amber-500"}`} aria-hidden="true" />
      <article className="rounded-3xl border border-black/5 bg-white p-4">
        <p className="text-base font-semibold leading-6 text-ink">{formatReactionDate(reaction.occurred_at)}</p>
        <p className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold ${severe ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-950"}`}>
          {SEVERITY_LABEL[reaction.severity]}
        </p>

        <ul className="mt-3 space-y-1">
          {reaction.symptoms.map((symptom) => (
            <li key={symptom} className="flex items-start gap-2 text-base leading-6 text-ink">
              <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
              <span className="min-w-0 flex-1">{symptom}</span>
            </li>
          ))}
        </ul>

        {reaction.causes.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reaction.causes.map((cause) => (
              <span key={cause} className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-950">
                {cause}
              </span>
            ))}
          </div>
        ) : null}
        {reaction.details ? <p className="mt-3 rounded-2xl bg-background p-3 text-base leading-6 text-ink">{reaction.details}</p> : null}

        {confirming ? (
          <div className="alg-pop mt-3 rounded-2xl bg-rose-50 p-3">
            <p className="text-center text-base font-semibold text-rose-950">¿Eliminar este registro? No se podrá recuperar.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={remove} disabled={busy} className="min-h-12 min-w-[7rem] flex-1 rounded-full bg-danger px-3 py-2 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60">
                {busy ? "Eliminando..." : "Sí, eliminar"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="min-h-12 min-w-[7rem] flex-1 rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition active:scale-95">
                No, dejarlo
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="mt-3 flex min-h-12 items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-rose-100 active:scale-95">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Eliminar
          </button>
        )}
        {error ? <p className="alg-shake mt-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-danger">No se pudo eliminar. Inténtalo de nuevo.</p> : null}
      </article>
    </li>
  );
}

function ReactionHistory({ reactions, onDelete }: { reactions: AllergyReactionRow[]; onDelete: (id: string) => Promise<void> }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reactions : reactions.slice(0, HISTORY_PREVIEW);

  return (
    <section id="alergia-historial" className="ab-card scroll-mt-24 rounded-[1.75rem] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-white" aria-hidden="true">
          <ClipboardList className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">Mi historial de reacciones</h2>
          <p className="text-sm leading-6 text-muted">
            {reactions.length > 0 ? `${plural(reactions.length, "reacción registrada", "reacciones registradas")}.` : "Aquí se guardará lo que registres."}
          </p>
        </div>
      </div>

      {reactions.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-background p-4 text-center text-base leading-6 text-muted">
          Todavía no hay reacciones. Marca tus síntomas con el check para guardar la primera.
        </p>
      ) : (
        <ul className="alg-timeline relative mt-4 space-y-3 before:absolute before:bottom-6 before:left-[0.6875rem] before:top-6 before:w-0.5 before:bg-black/10">
          {visible.map((reaction, index) => (
            <HistoryItem key={reaction.id} reaction={reaction} index={index} onDelete={onDelete} />
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {reactions.length > HISTORY_PREVIEW ? (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="flex min-h-14 items-center justify-center rounded-full border border-black/10 bg-white px-4 py-3 text-base font-semibold text-ink transition hover:bg-slate-50 active:scale-[0.98]"
          >
            {showAll ? "Ver menos" : `Ver todas (${reactions.length})`}
          </button>
        ) : null}
        {reactions.length > 0 ? (
          <Link
            href="/reportes#report-alergias"
            className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-base font-semibold text-white transition active:scale-[0.98]"
          >
            <FileText className="h-5 w-5 shrink-0" aria-hidden="true" />
            Imprimir en Reportes
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function ReactionGuide({
  contacts,
  reactions,
  onSave,
  onDelete
}: {
  contacts: ContactsInfo | null;
  reactions: AllergyReactionRow[];
  onSave: (input: AllergyReactionInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const [marked, setMarked] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const openSign = REACTION_SIGNS.find((sign) => sign.label === openLabel);
  const markedSigns = REACTION_SIGNS.filter((sign) => marked.includes(sign.label));
  const firstSevere = markedSigns.find((sign) => sign.level === "severe");

  const toggle = (label: string) => {
    setSaved(false);
    setMarked((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  };

  return (
    <>
      <section id="alergia-reaccion" className="ab-card scroll-mt-24 rounded-[1.75rem] border-2 border-red-200 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="alg-shield flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-700 text-white" aria-hidden="true">
            <Siren className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink">Si tengo una reacción</h2>
            <p className="text-sm leading-6 text-muted">Toca una tarjeta para ver qué hacer. Usa el círculo para marcar todo lo que sientes.</p>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {REACTION_SIGNS.map((sign, index) => (
            <SymptomCard
              key={sign.label}
              sign={sign}
              index={index}
              marked={marked.includes(sign.label)}
              onOpen={(event) => {
                returnFocusRef.current = event.currentTarget;
                setOpenLabel(sign.label);
              }}
              onToggle={() => toggle(sign.label)}
            />
          ))}
        </ul>

        {markedSigns.length > 0 ? (
          <button
            key={markedSigns.length}
            type="button"
            onClick={() => scrollToId("reaccion-lista")}
            aria-label={`Continuar con ${plural(markedSigns.length, "síntoma marcado", "síntomas marcados")}`}
            className="alg-pop sticky bottom-[5.5rem] z-10 mx-auto mt-4 flex min-h-14 w-full max-w-md items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-base font-semibold text-white shadow-soft"
          >
            Continuar ({markedSigns.length})
            <ArrowDown className="h-5 w-5 shrink-0" aria-hidden="true" />
          </button>
        ) : null}

        {saved ? (
          <div role="status" className="alg-pop mt-4 flex flex-col items-center gap-2 rounded-3xl bg-emerald-50 p-5 text-center">
            <span className="alg-pop flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
              <DrawnCheck className="h-10 w-10" />
            </span>
            <p className="text-lg font-semibold leading-6 text-emerald-950">Guardamos tu reacción en el historial</p>
            <p className="text-base leading-6 text-emerald-900">También aparecerá en Reportes para que puedas imprimirla.</p>
          </div>
        ) : null}

        {markedSigns.length > 0 ? (
          <div id="reaccion-lista" className="alg-rise mt-4 scroll-mt-24 rounded-3xl bg-background p-4">
            <h3 className="text-lg font-semibold text-ink">Lo que estoy sintiendo</h3>

            {firstSevere ? (
              <div className="alg-pop mt-2 rounded-2xl bg-red-700 p-4 text-white">
                <p className="flex items-start gap-2 text-base font-bold leading-6">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  Marcaste una señal de alarma. Busca atención de emergencia antes de llenar esto.
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    returnFocusRef.current = event.currentTarget;
                    setOpenLabel(firstSevere.label);
                  }}
                  className="mt-3 min-h-12 w-full rounded-full bg-white px-4 py-2 text-base font-semibold text-red-800 transition active:scale-[0.98]"
                >
                  Ver qué hacer
                </button>
              </div>
            ) : null}

            <ul className="mt-3 space-y-2">
              {markedSigns.map((sign) => (
                <li key={sign.label} className="alg-pop flex items-center gap-3 rounded-2xl bg-white py-1 pl-3 pr-1">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-hidden="true">
                    <DrawnCheck className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-base font-semibold leading-5 text-ink [overflow-wrap:anywhere]">{sign.label}</span>
                  <button
                    type="button"
                    onClick={() => toggle(sign.label)}
                    aria-label={`Quitar: ${sign.label}`}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-slate-100 active:scale-95"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>

            <ReactionLogForm
              signs={markedSigns}
              onSave={onSave}
              onSaved={() => {
                setMarked([]);
                setSaved(true);
              }}
            />
          </div>
        ) : null}

        <div className="mt-4">
          <CallButtons contacts={contacts} />
        </div>
      </section>

      <ReactionHistory reactions={reactions} onDelete={onDelete} />

      {openSign ? (
        <ReactionDialog
          sign={openSign}
          marked={marked.includes(openSign.label)}
          contacts={contacts}
          onToggle={() => {
            toggle(openSign.label);
            setOpenLabel(null);
          }}
          onClose={() => setOpenLabel(null)}
          returnFocusRef={returnFocusRef}
        />
      ) : null}
    </>
  );
}
