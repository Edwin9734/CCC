"use client";

import type { CSSProperties, MouseEventHandler } from "react";
import { Check, ShieldAlert } from "lucide-react";
import { FoodImage } from "@/components/diet/food-image";
import { TRAFFIC_LABEL, type DietItem, type TrafficLight } from "@/lib/diet-data";
import { cn } from "@/lib/utils";

const DOT: Record<TrafficLight, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-rose-500"
};

const CARD: Record<TrafficLight, string> = {
  green: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
  yellow: "border-amber-200 bg-amber-50 hover:bg-amber-100",
  red: "border-rose-200 bg-rose-50 hover:bg-rose-100"
};

// Ficha de un alimento: imagen grande arriba y el nombre debajo.
export function FoodPhotoTile({
  item,
  label,
  tinted = false,
  selected,
  flagged = false,
  forYou = false,
  subtitle,
  opensDialog = false,
  style,
  onClick
}: {
  item: DietItem;
  label?: string; // texto en lugar del nombre (por ejemplo, un ingrediente con su cantidad)
  tinted?: boolean; // colorea la ficha según el semáforo
  selected?: boolean; // si se indica, la ficha funciona como casilla
  flagged?: boolean;
  forYou?: boolean;
  subtitle?: string;
  opensDialog?: boolean;
  style?: CSSProperties;
  onClick: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-haspopup={opensDialog ? "dialog" : undefined}
      style={style}
      className={cn(
        "flex h-full w-full flex-col rounded-3xl border-2 p-2 text-center transition active:scale-[0.97] focus:outline-none focus:ring-4 focus:ring-accent/20 motion-reduce:transition-none",
        selected
          ? "border-accent bg-accentSoft"
          : flagged
            ? "border-rose-300 bg-rose-50 hover:bg-rose-100"
            : tinted
              ? CARD[item.level]
              : "border-black/5 bg-white hover:bg-slate-50",
        forYou && !selected ? "ring-2 ring-accent" : ""
      )}
    >
      <span className="relative block overflow-hidden rounded-2xl bg-white">
        <FoodImage id={item.id} fill size={160} rounded="rounded-2xl" />

        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-soft">
          {flagged ? (
            <ShieldAlert className="h-4 w-4 text-rose-700" aria-hidden="true" />
          ) : (
            <span className={`h-3.5 w-3.5 rounded-full ${DOT[item.level]}`} aria-hidden="true" />
          )}
          <span className="sr-only">{flagged ? "Posible alergia" : TRAFFIC_LABEL[item.level]}</span>
        </span>

        {selected ? (
          <span className="absolute left-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}

        {forYou ? (
          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
            Para ti
          </span>
        ) : null}
      </span>

      <span className="mt-2 block px-0.5 text-sm font-semibold leading-5 text-ink">{label ?? item.name}</span>
      {subtitle ? <span className="mt-0.5 block text-xs leading-4 text-muted">{subtitle}</span> : null}
    </button>
  );
}
