"use client";

import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { Check, Plus } from "lucide-react";
import { FoodDialog } from "@/components/diet/food-dialog";
import { FoodImage } from "@/components/diet/food-image";
import { DIET_ITEM_BY_ID, type DietItem, type TrafficLight } from "@/lib/diet-data";

export interface DietApi {
  setShopping: (ids: string[], on: boolean) => Promise<void>;
  logMeal: (meal: "desayuno" | "colacion" | "almuerzo" | "cena", foodIds: string[]) => Promise<void>;
}

// Ocupa todo el ancho de la pantalla aunque esté dentro del contenido con márgenes.
export const STICKY_BAR = "diet-sticky -mx-4 border-b border-black/5 bg-[#fff1f3]/90 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8";

export const LIGHT: Record<TrafficLight, { dot: string; ring: string; bar: string; label: string; chip: string }> = {
  green: { dot: "bg-emerald-500", ring: "ring-emerald-400", bar: "bg-emerald-500", label: "Con frecuencia", chip: "border-emerald-700 bg-emerald-700 text-white" },
  yellow: { dot: "bg-amber-500", ring: "ring-amber-400", bar: "bg-amber-400", label: "Con moderación", chip: "border-amber-500 bg-amber-400 text-amber-950" },
  red: { dot: "bg-rose-500", ring: "ring-rose-400", bar: "bg-rose-500", label: "Evitar", chip: "border-rose-700 bg-rose-700 text-white" }
};

export function itemsOf(ids: string[]) {
  return ids.flatMap((id): DietItem[] => {
    const item = DIET_ITEM_BY_ID.get(id);
    return item ? [item] : [];
  });
}

// Un solo cuadro de detalle por pantalla.
export function useFoodDialog(allergyMatches: Record<string, string[]>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  const open = (event: MouseEvent<HTMLElement>, id: string) => {
    returnRef.current = event.currentTarget;
    setOpenId(id);
  };

  const dialog = <FoodDialog foodId={openId} allergies={openId ? allergyMatches[openId] : undefined} onClose={() => setOpenId(null)} returnFocusRef={returnRef} />;
  return { open, dialog };
}

// Alimento en círculo con su nombre debajo.
export function FoodAvatar({ item, index = 0, flagged = false, onOpen }: { item: DietItem; index?: number; flagged?: boolean; onOpen: (event: MouseEvent<HTMLElement>) => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="ant-pop flex w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-2xl p-1 text-center transition active:scale-95"
      style={{ "--i": index } as CSSProperties}
    >
      <span className={`relative block rounded-full ring-[3px] ring-offset-2 ${flagged ? "ring-rose-600" : LIGHT[item.level].ring}`}>
        <FoodImage id={item.id} size={56} rounded="rounded-full" />
      </span>
      <span className="text-sm font-semibold leading-4 text-ink [overflow-wrap:anywhere]">{item.name}</span>
    </button>
  );
}

export function ShoppingToggle({ on, name, onToggle }: { on: boolean; name: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      aria-label={`${name} en mi lista de compras`}
      className={`absolute left-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full shadow-soft transition active:scale-90 ${on ? "bg-emerald-700 text-white" : "bg-white text-ink"}`}
    >
      {on ? <Check key="on" className="ant-pop h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}

// Barra de colores con cuántos alimentos hay de cada nivel.
export function LightBar({ items }: { items: DietItem[] }) {
  const counts = (["green", "yellow", "red"] as TrafficLight[]).map((level) => ({ level, count: items.filter((item) => item.level === level).length }));
  const total = items.length || 1;
  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-sm" role="img" aria-label={counts.map((entry) => `${entry.count} ${LIGHT[entry.level].label.toLowerCase()}`).join(", ")}>
        {counts.map((entry, index) =>
          entry.count > 0 ? <div key={entry.level} className={`pln-grow h-full ${LIGHT[entry.level].bar}`} style={{ "--to": `${(entry.count / total) * 100}%`, "--i": index } as CSSProperties} /> : null
        )}
      </div>
      <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        {counts.map((entry) => (
          <li key={entry.level} className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <span className={`h-3 w-3 rounded-full ${LIGHT[entry.level].dot}`} aria-hidden="true" />
            {entry.count} {LIGHT[entry.level].label.toLowerCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MenuArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <rect x="20" y="24" width="80" height="78" rx="12" fill="#fff" />
      <rect x="20" y="24" width="80" height="20" rx="10" fill="#fdba74" />
      <rect x="34" y="16" width="8" height="16" rx="4" fill="#9a3412" />
      <rect x="78" y="16" width="8" height="16" rx="4" fill="#9a3412" />
      <g className="pln-float">
        <circle cx="60" cy="74" r="20" fill="#ecfccb" stroke="#84cc16" strokeWidth="3" />
        <circle cx="53" cy="70" r="6" fill="#22c55e" />
        <circle cx="66" cy="78" r="5" fill="#f97316" />
        <circle cx="64" cy="66" r="4" fill="#ef4444" />
      </g>
    </svg>
  );
}
