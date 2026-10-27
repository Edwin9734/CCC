import type { CSSProperties } from "react";

const BOTTLE = "bottle";

// Frutas, medicinas, ejercicio, libretas, botellas de agua y corazones
const ITEMS = [
  "🍎", "💊", "🏃", "🍌", "💉", "🚴", "🍇", "♥", "🧘", "🍊", "🩺", "🏋️",
  "🍓", "💊", "🚶", "🥑", "♥", "🍉", "🧪", "🤸", "🍐", "💊", "🍋", "🏃",
  "📓", BOTTLE, "📔", "💧", BOTTLE, "📝", "📒", BOTTLE, "📓", BOTTLE
];

function Bottle() {
  return (
    <svg viewBox="0 0 24 44" aria-hidden="true">
      <rect x="8" y="1" width="8" height="6" rx="2" fill="#0ea5e9" />
      <path d="M8 7h8l5 9v24a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V16z" fill="#7dd3fc" stroke="#0284c7" strokeWidth="1.5" />
      <rect x="5" y="22" width="14" height="10" fill="#e0f2fe" />
    </svg>
  );
}

export function FloatingBackground() {
  const n = ITEMS.length;

  return (
    <div aria-hidden="true">
      <div className="login-blob b1" />
      <div className="login-blob b2" />
      <div className="login-blob b3" />
      {ITEMS.map((item, k) => {
        const style = {
          "--x": `${((k * 100) / n + (k % 3) * 2).toFixed(1)}%`,
          "--d": `${18 + (k % 6) * 3}s`,
          "--p": `${3.5 + (k % 4)}s`,
          "--dl": `-${((k * 2.7) % 24).toFixed(1)}s`,
          "--fs": `${40 + ((k * 17) % 5) * 8}px`
        } as CSSProperties;

        return (
          <span key={k} className="l-fl" style={style}>
            <i>{item === BOTTLE ? <Bottle /> : item}</i>
          </span>
        );
      })}
    </div>
  );
}