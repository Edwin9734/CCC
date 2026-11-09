import type { CSSProperties, ReactNode } from "react";

function Scene({ children, className = "h-full w-full" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const delay = (value: string) => ({ "--delay": value }) as CSSProperties;

export function TargetArt() {
  return (
    <Scene>
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <circle cx="56" cy="64" r="42" fill="#fff" />
      <circle cx="56" cy="64" r="30" fill="#fb7185" />
      <circle cx="56" cy="64" r="18" fill="#fff" />
      <circle cx="56" cy="64" r="8" fill="#e11d48" />
      <g className="pln-arrow">
        <path d="m56 64 44-44" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
        <path d="m96 12 3 12 12 3-11 11-12-3-3-12Z" fill="#fbbf24" />
      </g>
    </Scene>
  );
}

export function SlidersArt() {
  return (
    <Scene>
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <rect x="18" y="20" width="84" height="80" rx="16" fill="#fff" />
      {[42, 62, 82].map((y) => (
        <rect key={y} x="30" y={y - 3} width="60" height="6" rx="3" fill="#ddd6fe" />
      ))}
      <circle className="pln-slider-a" cx="52" cy="42" r="9" fill="#7c3aed" />
      <circle className="pln-slider-b" cx="68" cy="62" r="9" fill="#f43f5e" />
      <circle className="pln-slider-a" cx="60" cy="82" r="9" fill="#f59e0b" style={{ animationDelay: "-1s" }} />
    </Scene>
  );
}

export function BulbArt() {
  return (
    <Scene>
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <circle className="pln-glow" cx="60" cy="50" r="38" fill="#fde68a" opacity="0.6" />
      <path d="M60 18a30 30 0 0 0-18 54c4 3 6 7 6 12h24c0-5 2-9 6-12a30 30 0 0 0-18-54Z" fill="#fff7cc" />
      <path d="M50 52l10 10 10-10M60 62v22" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="48" y="88" width="24" height="8" rx="4" fill="#fff" />
      <rect x="51" y="98" width="18" height="7" rx="3.500" fill="#e0f2f1" />
    </Scene>
  );
}

// Una ilustración animada para cada consejo.
export function TipArt({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "alimentacion":
      return (
        <Scene className={className}>
          <g className="pln-sway">
            <path d="M60 14c20 0 32 30 32 54a32 32 0 0 1-64 0c0-24 12-54 32-54Z" fill="#65a30d" />
            <path d="M60 24c14 0 24 26 24 44a24 24 0 0 1-48 0c0-18 10-44 24-44Z" fill="#d9f99d" />
            <circle cx="60" cy="72" r="15" fill="#92400e" />
            <circle cx="55" cy="67" r="4" fill="#b45309" />
          </g>
        </Scene>
      );
    case "azucar-alcohol":
      return (
        <Scene className={className}>
          <path d="M38 34h44l-6 72H44Z" fill="#fff" stroke="#fda4af" strokeWidth="3" />
          <path d="M41 56h38l-4 48H45Z" fill="#b45309" />
          <circle className="pln-float" cx="52" cy="78" r="4" fill="#fde68a" />
          <circle className="pln-float" style={delay("-1s")} cx="66" cy="66" r="3" fill="#fde68a" />
          <path d="M68 34l10-24" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
          <path className="pln-glow" d="M22 24 98 104" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" />
        </Scene>
      );
    case "actividad":
      return (
        <Scene className={className}>
          <g className="pln-updown">
            <path d="M20 58c12-4 20-20 26-20 8 0 8 12 18 16l26 8c8 3 10 9 10 16H24c-6 0-8-14-4-20Z" fill="#f97316" />
            <rect x="22" y="78" width="80" height="12" rx="6" fill="#fff" stroke="#fdba74" strokeWidth="3" />
            <path d="M52 44l10 6M47 52l10 6" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          </g>
          <path className="pln-float" d="M10 104h26M50 106h34" stroke="#fdba74" strokeWidth="5" strokeLinecap="round" />
        </Scene>
      );
    case "peso":
      return (
        <Scene className={className}>
          <rect x="20" y="30" width="80" height="76" rx="18" fill="#fff" stroke="#c4b5fd" strokeWidth="3" />
          <path d="M34 62a26 26 0 0 1 52 0Z" fill="#ede9fe" />
          <path className="pln-sway" style={{ transformOrigin: "50% 100%" }} d="M60 62 72 42" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
          <circle cx="60" cy="62" r="6" fill="#7c3aed" />
          <rect x="42" y="78" width="36" height="14" rx="7" fill="#ddd6fe" />
        </Scene>
      );
    case "tabaco":
      return (
        <Scene className={className}>
          <rect x="16" y="66" width="74" height="16" rx="4" fill="#fff" stroke="#cbd5e1" strokeWidth="3" />
          <rect x="70" y="66" width="20" height="16" fill="#fdba74" />
          <path className="pln-float" d="M28 56c-8-8 8-12 0-22M42 56c-8-8 8-12 0-22" fill="none" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <path className="pln-glow" d="M14 22 106 104" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" />
        </Scene>
      );
    case "agua":
      return (
        <Scene className={className}>
          <path className="pln-updown" d="M60 12c16 22 32 38 32 58a32 32 0 0 1-64 0c0-20 16-36 32-58Z" fill="#38bdf8" />
          <path d="M42 72a18 18 0 0 0 14 18" fill="none" stroke="#e0f2fe" strokeWidth="6" strokeLinecap="round" />
        </Scene>
      );
    case "sueno":
      return (
        <Scene className={className}>
          <path className="pln-sway" d="M78 14a46 46 0 1 0 28 66A40 40 0 0 1 78 14Z" fill="#6366f1" />
          <g className="pln-glow" fill="#fbbf24">
            <circle cx="88" cy="32" r="5" />
            <circle cx="102" cy="52" r="3.500" />
            <circle cx="72" cy="50" r="3" />
          </g>
        </Scene>
      );
    case "estres":
      return (
        <Scene className={className}>
          <g className="pln-spin" fill="#fda4af">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <ellipse key={angle} cx="60" cy="34" rx="13" ry="22" transform={`rotate(${angle} 60 60)`} />
            ))}
          </g>
          <circle className="pln-glow" cx="60" cy="60" r="16" fill="#fde68a" />
        </Scene>
      );
    case "medicamentos":
      return (
        <Scene className={className}>
          <g className="pln-sway">
            <g transform="rotate(-38 60 60)">
              <rect x="18" y="42" width="84" height="36" rx="18" fill="#fff" stroke="#c4b5fd" strokeWidth="3" />
              <path d="M36 42h24v36H36a18 18 0 0 1 0-36Z" fill="#7c3aed" />
            </g>
          </g>
          <circle className="pln-float" cx="92" cy="92" r="9" fill="#34d399" />
        </Scene>
      );
    default:
      return (
        <Scene className={className}>
          <rect x="24" y="20" width="72" height="88" rx="10" fill="#fff" stroke="#7dd3fc" strokeWidth="3" />
          <rect x="44" y="12" width="32" height="16" rx="6" fill="#fbbf24" />
          <path className="ant-ecg" d="M34 66h14l6-16 10 30 6-14h16" fill="none" stroke="#e11d48" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        </Scene>
      );
  }
}
