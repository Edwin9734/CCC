"use client";

import { Download } from "lucide-react";

interface PDFExportButtonProps {
  elementId: string;
  fileName: string;
}

export function PDFExportButton({ elementId, fileName }: PDFExportButtonProps) {
  const handleExport = async () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      // Dinámicamente importar html2pdf para evitar SSR issues
      const html2pdf = (await import("html2pdf.js")).default;

      const options = {
        margin: 10,
        filename: `${fileName}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
      };

      html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("Error al generar PDF:", error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-teal-700"
    >
      <Download className="h-4 w-4" />
      Descargar PDF
    </button>
  );
}
