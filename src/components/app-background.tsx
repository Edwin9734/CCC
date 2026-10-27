import type { CSSProperties } from "react";

// Versión suave del fondo del login: manchas de color y unos pocos íconos flotando.
// Va fijo detrás del contenido, no recibe clics y no se imprime.
const ITEMS = ["🍎", "💊", "🏃", "🥑", "♥", "💧", "🩺", "🍇", "📓", "🧘", "🍊", "♥"];

export function AppBackground() {
  const n = ITEMS.length;

  return (
    <div className="ab-bg no-print" aria-hidden="true">
      <div className="ab-blob b1" />
      <div className="ab-blob b2" />
      <div className="ab-blob b3" />
      {ITEMS.map((item, k) => {
        const style = {
          "--x": `${((k * 100) / n + (k % 3) * 2).toFixed(1)}%`,
          "--d": `${22 + (k % 6) * 3}s`,
          "--p": `${3.5 + (k % 4)}s`,
          "--dl": `-${((k * 3.1) % 28).toFixed(1)}s`,
          fontSize: `${30 + ((k * 7) % 4) * 6}px`
        } as CSSProperties;

        return (
          <span key={k} className="ab-fl" style={style}>
            <i>{item}</i>
          </span>
        );
      })}
    </div>
  );
}