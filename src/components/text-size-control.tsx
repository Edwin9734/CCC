"use client";

import { useEffect, useState } from "react";
import { TEXT_SIZE_MAX, TEXT_SIZE_MIN, applyTextSize, readTextSize } from "@/lib/text-size";

export function TextSizeControl() {
  // Empieza en null hasta que la página carga, para no mostrar un número equivocado.
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    setLevel(readTextSize());
  }, []);

  const change = (delta: number) => {
    const current = level ?? readTextSize();
    setLevel(applyTextSize(current + delta));
  };

  const atMin = level !== null && level <= TEXT_SIZE_MIN;
  const atMax = level !== null && level >= TEXT_SIZE_MAX;

  const buttonClass =
    "flex h-10 w-10 items-center justify-center rounded-full bg-accentSoft font-bold text-accent transition hover:bg-teal-100 focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      role="group"
      aria-label="Tamaño de letra"
      className="no-print flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5 shadow-soft"
    >
      <button
        type="button"
        onClick={() => change(-1)}
        disabled={level === null || atMin}
        aria-label="Disminuir tamaño de letra"
        className={`${buttonClass} text-sm`}
      >
        A−
      </button>

      <span aria-live="polite" className="min-w-[5.5rem] text-center text-xs font-semibold text-muted">
        {level === null ? "Letra" : `Letra ${level} de ${TEXT_SIZE_MAX}`}
      </span>

      <button
        type="button"
        onClick={() => change(1)}
        disabled={level === null || atMax}
        aria-label="Aumentar tamaño de letra"
        className={`${buttonClass} text-lg`}
      >
        A+
      </button>
    </div>
  );
}