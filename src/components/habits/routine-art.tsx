import type { CSSProperties } from "react";

export function ReadingBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 104" className={className} aria-hidden="true">
      <ellipse cx="80" cy="97" rx="62" ry="5" fill="#172033" opacity="0.1" />
      <path d="M80 26C64 16 38 16 18 22V88C38 82 64 82 80 92Z" fill="#fff" stroke="#7c3aed" strokeWidth="3" strokeLinejoin="round" />
      <path d="M80 26C96 16 122 16 142 22V88C122 82 96 82 80 92Z" fill="#fff" stroke="#7c3aed" strokeWidth="3" strokeLinejoin="round" />
      {[38, 50, 62].map((y) => (
        <path key={y} d={`M32 ${y}C44 ${y - 4} 58 ${y - 3} 70 ${y + 2}`} fill="none" stroke="#ddd6fe" strokeWidth="3" strokeLinecap="round" />
      ))}
      {[38, 50, 62].map((y) => (
        <path key={y} d={`M128 ${y}C116 ${y - 4} 102 ${y - 3} 90 ${y + 2}`} fill="none" stroke="#ddd6fe" strokeWidth="3" strokeLinecap="round" />
      ))}
      <path className="hab-page" d="M80 26C94 20 112 19 130 23V85C112 81 94 82 80 92Z" fill="#ede9fe" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
      {[
        { x: 40, text: "♥", color: "#f43f5e", delay: "0s" },
        { x: 80, text: "A", color: "#7c3aed", delay: "1s" },
        { x: 118, text: "★", color: "#f59e0b", delay: "2s" }
      ].map((item) => (
        <text
          key={item.x}
          className="hab-letter"
          style={{ "--delay": item.delay } as CSSProperties}
          x={item.x}
          y="18"
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill={item.color}
        >
          {item.text}
        </text>
      ))}
    </svg>
  );
}

export function Butterfly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={`hab-float ${className ?? ""}`} aria-hidden="true">
      <g className="hab-wing hab-wing-left">
        <path d="M58 48C42 14 10 12 8 34C7 52 34 58 58 52Z" fill="#a78bfa" />
        <path d="M58 54C36 56 18 66 24 80C31 94 52 78 58 58Z" fill="#f472b6" />
        <circle cx="28" cy="34" r="7" fill="#fff" opacity="0.7" />
      </g>
      <g className="hab-wing hab-wing-right">
        <path d="M62 48C78 14 110 12 112 34C113 52 86 58 62 52Z" fill="#a78bfa" />
        <path d="M62 54C84 56 102 66 96 80C89 94 68 78 62 58Z" fill="#f472b6" />
        <circle cx="92" cy="34" r="7" fill="#fff" opacity="0.7" />
      </g>
      <rect x="56" y="30" width="8" height="48" rx="4" fill="#312e81" />
      <path d="M58 32C54 22 48 18 44 18M62 32C66 22 72 18 76 18" fill="none" stroke="#312e81" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function GrowingPlant({ stage, className }: { stage: 0 | 1 | 2 | 3; className?: string }) {
  return (
    <svg viewBox="0 0 90 110" className={className} aria-hidden="true">
      <g className="hab-sway">
        {stage === 0 ? <ellipse cx="45" cy="76" rx="8" ry="6" fill="#92400e" /> : null}
        {stage >= 1 ? <path d="M45 82C45 66 45 54 45 44" fill="none" stroke="#16a34a" strokeWidth="5" strokeLinecap="round" /> : null}
        {stage >= 1 ? <path d="M45 56C36 42 24 42 18 44C22 56 34 60 45 56Z" fill="#22c55e" /> : null}
        {stage >= 2 ? <path d="M45 50C54 34 68 34 74 36C70 50 56 54 45 50Z" fill="#4ade80" /> : null}
        {stage >= 3 ? (
          <g>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cx="45" cy="18" rx="7" ry="11" fill="#f472b6" transform={`rotate(${angle} 45 28)`} />
            ))}
            <circle cx="45" cy="28" r="7" fill="#facc15" />
          </g>
        ) : null}
      </g>
      <path d="M22 80H68L62 106H28Z" fill="#b45309" />
      <rect x="18" y="74" width="54" height="10" rx="3" fill="#d97706" />
    </svg>
  );
}
