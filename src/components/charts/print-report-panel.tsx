"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { printWithTarget } from "@/lib/print-utils";

interface PrintSection {
  key: string;
  label: string;
}

const SECTIONS: PrintSection[] = [
  { key: "evolucion", label: "Evolución de indicadores" },
  { key: "historial", label: "Historial completo" },
  { key: "recomendaciones", label: "Recomendaciones" }
];

export function PrintReportPanel() {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    evolucion: true,
    historial: true,
    recomendaciones: true
  });

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    // Le decimos al documento qué secciones mostrar antes de imprimir,
    // usando atributos data- que la hoja de estilo @media print lee.
    document.body.setAttribute("data-print-evolucion", String(selected.evolucion));
    document.body.setAttribute("data-print-historial", String(selected.historial));
    document.body.setAttribute("data-print-recomendaciones", String(selected.recomendaciones));
    printWithTarget("report");
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-surface p-6">
      <h3 className="text-base font-semibold text-ink">Imprimir reporte</h3>
      <p className="mt-1 text-sm text-muted">Elige qué secciones quieres incluir al imprimir.</p>

      <div className="mt-4 grid gap-3">
        {SECTIONS.map((section) => (
          <label key={section.key} className="flex items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={selected[section.key]}
              onChange={() => toggle(section.key)}
              className="h-5 w-5 rounded border-black/20 accent-accent"
            />
            {section.label}
          </label>
        ))}
      </div>

      <button
        onClick={handlePrint}
        className="mt-5 flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-teal-700"
      >
        <Printer className="h-4 w-4" />
        Imprimir
      </button>
    </div>
  );
}