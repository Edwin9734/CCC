"use client";

import { useRef, type RefObject } from "react";
import { AlertTriangle, ShieldAlert, X } from "lucide-react";
import { DIET_ITEM_BY_ID, TRAFFIC_LABEL, type TrafficLight } from "@/lib/diet-data";
import { FoodImage } from "@/components/diet/food-image";
import { useDrawer } from "@/lib/use-drawer";

const BADGE: Record<TrafficLight, string> = {
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-rose-100 text-rose-800"
};

// Ventana pequeña con el detalle de un alimento: imagen, semáforo, por qué conviene y porción.
export function FoodDialog({
  foodId,
  allergies,
  onClose,
  returnFocusRef
}: {
  foodId: string | null;
  allergies?: string[];
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const item = foodId ? DIET_ITEM_BY_ID.get(foodId) : undefined;

  useDrawer({ open: Boolean(item), onClose, panelRef, returnFocusRef });

  if (!item) return null;

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-soft sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <FoodImage id={item.id} size={80} rounded="rounded-2xl" className="bg-white p-1" />
            <div>
              <h2 id="food-dialog-title" className="text-xl font-semibold text-ink">
                {item.name}
              </h2>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${BADGE[item.level]}`}>
                {TRAFFIC_LABEL[item.level]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label="Cerrar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-accent/15"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {allergies && allergies.length > 0 ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-100 p-3 text-sm font-semibold leading-6 text-rose-900">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Posible alergia: {allergies.join(", ")}</p>
          </div>
        ) : null}

        <p className="mt-4 text-base leading-7 text-ink">{item.why}</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          <span className="font-semibold text-ink">Porción o frecuencia: </span>
          {item.portion}
        </p>

        {item.warning ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{item.warning}</p>
          </div>
        ) : null}

        <p className="mt-4 text-xs leading-5 text-muted">
          Información general: no reemplaza la indicación de tu médico o nutricionista.
        </p>
      </section>
    </div>
  );
}