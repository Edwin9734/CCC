"use client";

import { useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
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

  // Se dibuja directamente en <body>: las tarjetas de la app tienen efectos que harían que
  // "fixed" se mida contra la tarjeta y no contra la pantalla, y la ventana quedaría fuera de lugar.
  return createPortal(
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="ant-modal max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl bg-surface text-ink shadow-soft"
      >
        {/* Foto grande arriba, para que se aprecie bien */}
        <div className="relative bg-white">
          <FoodImage id={item.id} size={480} eager fill rounded="rounded-none" className="max-h-[45dvh]" />
          <button
            type="button"
            onClick={onClose}
            data-autofocus
            aria-label="Cerrar"
            className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-accent/25 active:scale-95"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-5 pt-4">
          <h2 id="food-dialog-title" className="text-2xl font-bold leading-7 text-ink">
            {item.name}
          </h2>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${BADGE[item.level]}`}>
            {TRAFFIC_LABEL[item.level]}
          </span>

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
        </div>
      </section>
    </div>,
    document.body
  );
}