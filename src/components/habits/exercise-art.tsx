// Ilustraciones de los grupos de edad para el explorador de rutinas.
import type { AgeGroup } from "@/lib/exercise-recommendations";

const SKIN = "#f2c29b";
const INK = "#172033";

function Face({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <circle cx={cx - r * 0.38} cy={cy - r * 0.05} r={r * 0.11} fill={INK} />
      <circle cx={cx + r * 0.38} cy={cy - r * 0.05} r={r * 0.11} fill={INK} />
      <path d={`M${cx - r * 0.35} ${cy + r * 0.35}Q${cx} ${cy + r * 0.65} ${cx + r * 0.35} ${cy + r * 0.35}`} fill="none" stroke={INK} strokeWidth={r * 0.12} strokeLinecap="round" />
      <circle cx={cx - r * 0.62} cy={cy + r * 0.3} r={r * 0.14} fill="#fb7185" opacity="0.45" />
      <circle cx={cx + r * 0.62} cy={cy + r * 0.3} r={r * 0.14} fill="#fb7185" opacity="0.45" />
    </>
  );
}

function Kid() {
  return (
    <svg viewBox="12 4 60 75" className="h-full w-full" aria-hidden="true">
      <ellipse cx="40" cy="75" rx="22" ry="3" fill={INK} opacity="0.1" />
      <rect x="31" y="58" width="7" height="15" rx="3.5" fill="#1e3a8a" />
      <rect x="42" y="58" width="7" height="15" rx="3.5" fill="#1e3a8a" />
      <path d="M27 45Q40 38 53 45L52 62H28Z" fill="#facc15" />
      <path d="M28 47L20 56M52 47L59 53" stroke={SKIN} strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="28" r="14" fill={SKIN} />
      <path d="M26 26Q28 12 40 13Q53 12 54 26Q47 18 40 20Q33 18 26 26Z" fill="#7c2d12" />
      <circle cx="25" cy="24" r="4" fill="#7c2d12" />
      <circle cx="55" cy="24" r="4" fill="#7c2d12" />
      <Face cx={40} cy={29} r={12} />
      <g className="pln-updown">
        <circle cx="64" cy="48" r="7" fill="#f97316" />
        <path d="M57 48H71M64 41V55" stroke="#fff" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function Youth() {
  return (
    <svg viewBox="12 4 60 75" className="h-full w-full" aria-hidden="true">
      <ellipse cx="40" cy="76" rx="20" ry="3" fill={INK} opacity="0.1" />
      <rect x="32" y="52" width="7" height="22" rx="3.5" fill="#334155" />
      <rect x="41" y="52" width="7" height="22" rx="3.5" fill="#334155" />
      <rect x="29" y="71" width="11" height="5" rx="2.5" fill="#fff" stroke="#e11d48" strokeWidth="1.5" />
      <rect x="40" y="71" width="11" height="5" rx="2.5" fill="#fff" stroke="#e11d48" strokeWidth="1.5" />
      <path d="M27 36Q40 30 53 36L52 56H28Z" fill="#8b5cf6" />
      <path d="M36 34V44M44 34V44" stroke="#ddd6fe" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 39L22 52M52 39L58 52" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" />
      <circle cx="40" cy="20" r="11" fill={SKIN} />
      <path d="M29 18Q31 7 41 8Q51 8 51 18Q45 13 38 15Q33 14 29 18Z" fill="#1c1917" />
      <path d="M28 21Q28 7 40 7Q52 7 52 21" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
      <rect x="25" y="18" width="5" height="8" rx="2.5" fill="#0ea5e9" />
      <rect x="50" y="18" width="5" height="8" rx="2.5" fill="#0ea5e9" />
      <Face cx={40} cy={21} r={9} />
    </svg>
  );
}

function Adult() {
  return (
    <svg viewBox="12 4 60 75" className="h-full w-full" aria-hidden="true">
      <ellipse cx="40" cy="76" rx="20" ry="3" fill={INK} opacity="0.1" />
      <rect x="32" y="52" width="7" height="23" rx="3.5" fill="#1e293b" />
      <rect x="41" y="52" width="7" height="23" rx="3.5" fill="#1e293b" />
      <path d="M26 35Q40 29 54 35L53 56H27Z" fill="#0d9488" />
      <path d="M36 33L40 38L44 33" fill="#fff" />
      <path d="M40 37L38 46L40 50L42 46Z" fill="#e11d48" />
      <path d="M27 38L21 52M53 38L60 50" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" />
      <g className="pln-updown">
        <rect x="56" y="48" width="14" height="11" rx="2" fill="#92400e" />
        <path d="M60 48V45H66V48" fill="none" stroke="#92400e" strokeWidth="2" />
      </g>
      <circle cx="40" cy="20" r="11" fill={SKIN} />
      <path d="M29 18Q30 8 40 8Q50 8 51 18Q47 12 40 13Q33 12 29 18Z" fill="#44403c" />
      <Face cx={40} cy={21} r={9} />
    </svg>
  );
}

function Elder() {
  return (
    <svg viewBox="12 4 60 75" className="h-full w-full" aria-hidden="true">
      <ellipse cx="40" cy="76" rx="22" ry="3" fill={INK} opacity="0.1" />
      <rect x="31" y="53" width="7" height="22" rx="3.5" fill="#57534e" />
      <rect x="40" y="53" width="7" height="22" rx="3.5" fill="#57534e" />
      <path d="M25 37Q38 30 51 36L50 57H26Z" fill="#e11d48" />
      <path d="M30 40V55M46 40V55" stroke="#fecdd3" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M27 40L22 52M50 39L58 46" stroke="#e11d48" strokeWidth="6" strokeLinecap="round" />
      <path d="M59 45V75M59 45Q59 40 64 41" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="21" r="11" fill={SKIN} />
      <path d="M27 20Q26 10 38 9Q50 10 49 20Q48 14 43 14Q38 11 33 14Q28 14 27 20Z" fill="#e5e7eb" stroke="#cbd5e1" strokeWidth="1" />
      <circle cx="34.5" cy="21" r="3.3" fill="none" stroke={INK} strokeWidth="1.3" />
      <circle cx="41.5" cy="21" r="3.3" fill="none" stroke={INK} strokeWidth="1.3" />
      <path d="M37.8 21H38.2" stroke={INK} strokeWidth="1.3" />
      <circle cx="34.5" cy="21" r="0.9" fill={INK} />
      <circle cx="41.5" cy="21" r="0.9" fill={INK} />
      <path d="M34.5 26.5Q38 29 41.5 26.5" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function AgeArt({ group }: { group: AgeGroup }) {
  if (group === "nino") return <Kid />;
  if (group === "joven") return <Youth />;
  if (group === "adulto") return <Adult />;
  return <Elder />;
}
