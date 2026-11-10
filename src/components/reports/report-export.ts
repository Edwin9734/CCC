// Genera un PDF de una parte de la página (con el tamaño de letra original).
import { withDefaultTextSize } from "@/lib/text-size";

export type PdfMode = "save" | "share";

export async function exportPdf(element: HTMLElement, fileName: string, mode: PdfMode): Promise<"saved" | "shared"> {
  const html2pdf = (await import("html2pdf.js")).default;
  const options = {
    margin: 10,
    filename: `${fileName}.pdf`,
    image: { type: "jpeg" as const, quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
    pagebreak: { mode: ["css", "legacy"], avoid: [".print-avoid-break", "tr", "h2"] }
  };

  // Mientras se genera, la hoja usa el ancho de papel y sin animaciones.
  element.classList.add("report-exporting");
  try {
    return await withDefaultTextSize(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const worker = html2pdf().set(options).from(element);

      if (mode === "share") {
        const blob = (await worker.outputPdf("blob")) as Blob;
        const file = new File([blob], `${fileName}.pdf`, { type: "application/pdf" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: fileName });
          return "shared";
        }
      }

      await html2pdf().set(options).from(element).save();
      return "saved";
    });
  } finally {
    element.classList.remove("report-exporting");
  }
}
