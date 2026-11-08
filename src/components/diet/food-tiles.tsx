"use client";

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { DIET_ITEM_BY_ID, type DietItem } from "@/lib/diet-data";
import { FoodDialog } from "@/components/diet/food-dialog";
import { FoodPhotoTile } from "@/components/diet/food-photo-tile";

export const FOOD_GRID_WIDE = "grid grid-cols-2 gap-3 min-[440px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";
export const FOOD_GRID_NARROW = "grid grid-cols-2 gap-3 min-[440px]:grid-cols-3";

// Lista de alimentos como tarjetas (imagen grande y nombre). Al tocar una se abre su detalle.
// Muestra las primeras "limit" y un botón para ver todas.
export function FoodTiles({
  ids,
  allergyMatches = {},
  limit = 8,
  narrow = false
}: {
  ids: string[];
  allergyMatches?: Record<string, string[]>;
  limit?: number;
  narrow?: boolean; // para cuando la lista va dentro de una columna angosta
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
      <div className={cn("mt-2", narrow ? FOOD_GRID_NARROW : FOOD_GRID_WIDE)}>
        {visible.map((item) => (
          <FoodPhotoTile
            key={item.id}
            item={item}
            tinted
            opensDialog
            flagged={Boolean(allergyMatches[item.id])}
            onClick={(event) => {
              returnRef.current = event.currentTarget;
              setOpenId(item.id);
            }}
          />
        ))}
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
