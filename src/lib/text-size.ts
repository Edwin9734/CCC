// Tamaño de letra de todo el sistema.
// Nivel 1 = tamaño original, nivel 5 = 50% más grande.
export const TEXT_SIZE_MIN = 1;
export const TEXT_SIZE_MAX = 5;
export const TEXT_SIZE_DEFAULT = 2;
export const TEXT_SIZE_STORAGE_KEY = "ccc-text-size";
export const TEXT_SIZE_ATTRIBUTE = "data-text-size";

// Script que se ejecuta antes de pintar la página, para aplicar el tamaño guardado
// sin que se vea un parpadeo. Los tamaños en sí se definen en globals.css.
export const TEXT_SIZE_INIT_SCRIPT = `(function(){try{var s=window.localStorage.getItem("${TEXT_SIZE_STORAGE_KEY}");var n=s?parseInt(s,10):${TEXT_SIZE_DEFAULT};if(!(n>=${TEXT_SIZE_MIN}&&n<=${TEXT_SIZE_MAX})){n=${TEXT_SIZE_DEFAULT};}document.documentElement.setAttribute("${TEXT_SIZE_ATTRIBUTE}",String(n));}catch(e){document.documentElement.setAttribute("${TEXT_SIZE_ATTRIBUTE}","${TEXT_SIZE_DEFAULT}");}})();`;

// Lee el nivel que está aplicado en la página (lo puso el script inicial).
export function readTextSize(): number {
  const fromPage = Number(document.documentElement.getAttribute(TEXT_SIZE_ATTRIBUTE));
  if (Number.isInteger(fromPage) && fromPage >= TEXT_SIZE_MIN && fromPage <= TEXT_SIZE_MAX) {
    return fromPage;
  }
  return TEXT_SIZE_DEFAULT;
}

// Aplica un nivel y lo guarda en el navegador. Devuelve el nivel final (entre 1 y 5).
export function applyTextSize(level: number): number {
  const finalLevel = Math.min(TEXT_SIZE_MAX, Math.max(TEXT_SIZE_MIN, Math.round(level)));
  document.documentElement.setAttribute(TEXT_SIZE_ATTRIBUTE, String(finalLevel));
  try {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, String(finalLevel));
  } catch {
    // Sin almacenamiento disponible: el cambio vale solo mientras la página esté abierta.
  }
  return finalLevel;
}

// Ejecuta una tarea (como generar un PDF) con el tamaño original y luego
// devuelve la página al tamaño que tenía la persona.
export async function withDefaultTextSize<T>(task: () => PromiseLike<T>): Promise<T> {
  const root = document.documentElement;
  const previous = root.getAttribute(TEXT_SIZE_ATTRIBUTE);

  try {
    root.setAttribute(TEXT_SIZE_ATTRIBUTE, String(TEXT_SIZE_MIN));
    // Esperamos un momento para que la página y las gráficas se reacomoden.
    await new Promise((resolve) => setTimeout(resolve, 300));
    return await task();
  } finally {
    if (previous === null) {
      root.removeAttribute(TEXT_SIZE_ATTRIBUTE);
    } else {
      root.setAttribute(TEXT_SIZE_ATTRIBUTE, previous);
    }
  }
}