export type PrintTarget = "report" | "guide";

// Marca qué se va a imprimir (reporte o guía) y abre el diálogo de impresión.
// La marca se quita sola cuando termina o se cancela la impresión.
export function printWithTarget(target: PrintTarget) {
  const body = document.body;
  body.setAttribute("data-print-target", target);

  const cleanup = () => {
    body.removeAttribute("data-print-target");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}