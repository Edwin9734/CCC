"use client";

import { useMemo, useRef, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { DIET_ITEM_BY_ID, type DietItem } from "@/lib/diet-data";
import { FoodDialog } from "@/components/diet/food-dialog";
import { FoodImage } from "@/components/diet/food-image";

const TONE = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  avoid: "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
} as const;

// Lista de alimentos como fichas pequeñas (imagen + nombre). Al tocar una se abre su detalle.
// Muestra las primeras "limit" y un botón para ver todas.
export function FoodTiles({
  ids,
  tone,
  allergyMatches = {},
  limit = 8
}: {
  ids: string[];
  tone: "good" | "avoid";
  allergyMatches?: Record<string, string[]>;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  const items = useMemo(
    () =>
      ids.flatMap((id): DietItem[] => {
        const item = DIET_ITEM_BY_ID.get(id);
        return item ? [item] : [];
      }),
    [ids]
  );

  if (items.length === 0) {
    return <p className="mt-2 text-sm text-muted">—</p>;
  }

  const visible = expanded ? items : items.slice(0, limit);

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {visible.map((item) => {
          const flagged = Boolean(allergyMatches[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              aria-haspopup="dialog"
              onClick={(event) => {
                returnRef.current = event.currentTarget;
                setOpenId(item.id);
              }}
              className={cn(
                "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
                TONE[tone]
              )}
            >
              <FoodImage id={item.id} size={32} rounded="rounded-full" className="bg-white" />
              {item.name}
              {flagged ? <ShieldAlert className="h-3.5 w-3.5 text-rose-700" /> : null}
            </button>
          );
        })}
      </div>

      {items.length > limit ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          {expanded ? "Ver menos" : `Ver todos (${items.length})`}
        </button>
      ) : null}

      <FoodDialog
        foodId={openId}
        allergies={openId ? allergyMatches[openId] : undefined}
        onClose={() => setOpenId(null)}
        returnFocusRef={returnRef}
      />
    </>
  );
}