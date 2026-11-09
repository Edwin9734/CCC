"use client";

import { useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Lightbulb, Printer, Search, Share2, ShieldAlert, X } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { ALLERGY_TIPS, checkFood } from "@/lib/allergy-insights";
import type { ContactsInfo } from "@/lib/contacts";
import { printWithTarget } from "@/lib/print-utils";
import type { AllergyRow } from "@/lib/supabase/allergies";
import { useDrawer } from "@/lib/use-drawer";

export function FoodChecker({ names }: { names: string[] }) {
  const [query, setQuery] = useState("");
  const { direct, results } = useMemo(() => checkFood(query, names), [query, names]);
  const searching = query.trim().length >= 2;

  return (
    <SectionCard title="¿Puedo comer esto?" description="Busca un alimento o una receta y lo comparamos con tus alergias.">
      <label className="relative block">
        <span className="sr-only">Alimento o receta</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. camarones, pan, mosh"
          className="w-full min-w-0 rounded-2xl border border-black/10 bg-background py-4 pl-12 pr-14 text-base outline-none placeholder:text-muted focus:ring-4 focus:ring-accent/15"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </label>

      {searching ? (
        <div className="mt-3 space-y-2" aria-live="polite">
          {direct.length > 0 ? (
            <p className="alg-pop flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-base font-semibold leading-6 text-rose-950">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              Coincide con tu alergia: {direct.join(", ")}. Evítalo.
            </p>
          ) : null}

          {results.length > 0 ? (
            <ul className="grid gap-2 md:grid-cols-2">
              {results.map((result, index) => {
                const flagged = result.allergies.length > 0;
                return (
                  <li
                    key={result.key}
                    className={`alg-rise flex items-center gap-3 rounded-2xl border p-2 ${flagged ? "border-rose-300 bg-rose-50" : "border-black/5 bg-white"}`}
                    style={{ "--i": index } as CSSProperties}
                  >
                    {result.image ? (
                      <img src={result.image} alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-5 text-ink">{result.name}</p>
                      <p className={`mt-0.5 text-sm font-semibold leading-5 ${flagged ? "text-rose-900" : "text-muted"}`}>
                        {flagged ? `Posible alergia: ${result.allergies.join(", ")}` : `${result.kind}: no coincide con lo que registraste`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : direct.length === 0 ? (
            <p className="alg-pop rounded-2xl bg-background p-3 text-base leading-6 text-ink">
              No lo tenemos en la guía. Revisa su etiqueta o pregunta a tu médico.
            </p>
          ) : null}

          {results.some((result) => result.allergies.length === 0) ? (
            <p className="text-sm leading-6 text-muted">
              «No coincide» no significa que sea seguro: revisa siempre los ingredientes.
            </p>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}

export function TipsCard() {
  const [index, setIndex] = useState(0);

  return (
    <section className="ab-card rounded-[1.75rem] border-amber-200 bg-amber-50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="alg-shield flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white" aria-hidden="true">
          <Lightbulb className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Consejo {index + 1} de {ALLERGY_TIPS.length}
          </p>
          <p key={index} className="alg-rise mt-1 text-lg leading-7 text-ink">
            {ALLERGY_TIPS[index]}
          </p>
          <button
            type="button"
            onClick={() => setIndex((value) => (value + 1) % ALLERGY_TIPS.length)}
            className="mt-3 min-h-12 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            Otro consejo
          </button>
        </div>
      </div>
    </section>
  );
}

export function AllergyCardDialog({
  allergies,
  contacts,
  onClose,
  returnFocusRef
}: {
  allergies: AllergyRow[];
  contacts: ContactsInfo | null;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  useDrawer({ open: true, onClose, panelRef, returnFocusRef });

  const share = async () => {
    const list = allergies.map((allergy) => `- ${allergy.allergy_name}${allergy.notes ? ` (${allergy.notes})` : ""}`).join("\n");
    const text = `Tengo alergia a:\n${list}\nPor favor, avíseme si un alimento contiene alguno de estos ingredientes.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mis alergias", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setStatus("Copiamos tu lista. Ya puedes pegarla en un mensaje.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus("No se pudo compartir. Puedes mostrar esta pantalla.");
    }
  };

  const emergency = contacts?.emergency?.phone ? contacts.emergency : null;
  const buttonClass =
    "flex min-h-14 flex-1 basis-40 items-center justify-center gap-2 rounded-full px-4 py-3 text-base font-semibold transition active:scale-95";

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3">
      <section
        ref={panelRef}
        id="allergy-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="allergy-card-title"
        onClick={(event) => event.stopPropagation()}
        className="alg-pop max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-5 text-ink shadow-soft sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-700 text-white" aria-hidden="true">
              <ShieldAlert className="h-8 w-8" />
            </span>
            <h2 id="allergy-card-title" className="text-3xl font-bold leading-9">
              Tengo alergia a:
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label="Cerrar"
            className="no-print flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white transition hover:bg-slate-50"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {allergies.map((allergy) => (
            <li key={allergy.id} className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3">
              <p className="text-2xl font-bold leading-8 text-red-950">{allergy.allergy_name}</p>
              {allergy.notes ? <p className="text-base leading-6 text-red-900">{allergy.notes}</p> : null}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-lg font-semibold leading-7">Por favor, avíseme si un alimento contiene alguno de estos ingredientes.</p>
        {emergency ? (
          <p className="mt-2 text-base leading-6">
            En caso de emergencia, llamar a {emergency.name ?? "mi contacto"}: <span className="font-bold">{emergency.phone}</span>
          </p>
        ) : null}

        <div className="no-print mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => printWithTarget("allergy")} className={`${buttonClass} border border-black/10 bg-white text-ink hover:bg-slate-50`}>
            <Printer className="h-5 w-5" aria-hidden="true" />
            Imprimir
          </button>
          <button type="button" onClick={share} className={`${buttonClass} bg-accent text-white hover:bg-accentDark`}>
            <Share2 className="h-5 w-5" aria-hidden="true" />
            Compartir
          </button>
        </div>
        {status ? (
          <p role="status" className="no-print alg-pop mt-2 text-center text-sm font-semibold text-emerald-800">
            {status}
          </p>
        ) : null}
      </section>
    </div>,
    document.body
  );
}
