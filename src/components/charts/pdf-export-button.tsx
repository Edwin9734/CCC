"use client";

import { Download } from "lucide-react";
import { withDefaultTextSize } from "@/lib/text-size";

interface PDFExportButtonProps {
  elementId: string;
  fileName: string;
}

export function PDFExportButton({ elementId, fileName }: PDFExportButtonProps) {
  const handleExport = async () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Lo que NO debe salir en el PDF de mediciones:
    // el propio botón, el panel de casillas y toda la sección de la guía.
    const excludedIds = ["pdf-export-button", "print-report-panel", "guide-section"];
    const excludedElements = excludedIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const previousDisplay = excludedElements.map((el) => el.style.display);
    excludedElements.forEach((el) => {
      el.style.display = "none";
    });

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const options = {
        margin: 10,
        filename: `${fileName}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
        // Solo evita cortar filas de tabla y tarjetas de gráfica individuales.
        pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".chart-card"] }
      };

      // El PDF siempre se genera con el tamaño de letra original.
      await withDefaultTextSize(() => html2pdf().set(options).from(element).save());
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      excludedElements.forEach((el, i) => {
        el.style.display = previousDisplay[i];
      });
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-teal-700"
    >
      <Download className="h-4 w-4" />
      Descargar PDF Mediciones
    </button>
  );
}