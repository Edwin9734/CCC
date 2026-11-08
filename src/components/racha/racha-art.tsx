import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { WATER_GOAL_GLASSES } from "@/lib/habits-config";
import type { HeartStatus } from "@/lib/racha";

const HEART_PATH =
  "M50 106C50 106 6 80 6 50C6 35 17 26 29 26C38 26 45 31 50 39C55 31 62 26 71 26C83 26 94 35 94 50C94 80 50 106 50 106Z";
const FLAME_PATH =
  "M50 2C52 14 66 22 66 40C66 52 58 60 50 60C42 60 34 52 34 41C34 33 38 27 43 23C44 29 47 32 49 33C47 24 47 12 50 2Z";
const FLAME_INNER_PATH = "M50 28C51 34 58 38 58 46C58 52 54 56 50 56C46 56 42 52 42 47C42 40 48 36 50 28Z";

const HEART_COLORS: Record<
  HeartStatus,
  { heart: string; stroke: string; flame: string | null; inner: string | null; dashed: boolean }
> = {
  complete: { heart: "#f43f5e", stroke: "#be123c", flame: "#dc2626", inner: "#fbbf24", dashed: false },
  grace: { heart: "#bfdbfe", stroke: "#60a5fa", flame: "#7dd3fc", inner: "#e0f2fe", dashed: false },
  missed: { heart: "#bfdbfe", stroke: "#60a5fa", flame: "#7dd3fc", inner: "#e0f2fe", dashed: false },
  pending: { heart: "#ffffff", stroke: "#fb7185", flame: null, inner: null, dashed: true },
  future: { heart: "#f8f8fa", stroke: "#cbd0da", flame: null, inner: null, dashed: true }
};

export function HeartFlame({
  status,
  beating = false,
  className
}: {
  status: HeartStatus;
  beating?: boolean;
  className?: string;
}) {
  const colors = HEART_COLORS[status];

  return (
    <svg viewBox="0 0 100 110" aria-hidden="true" className={className}>
      <g className={beating ? "racha-beat" : undefined}>
        <path
          d={HEART_PATH}
          fill={colors.heart}
          stroke={colors.stroke}
          strokeWidth={3}
          strokeDasharray={colors.dashed ? "6 6" : undefined}
          strokeLinejoin="round"
        />
        {!colors.dashed ? <ellipse cx="29" cy="47" rx="9" ry="6" fill="#fff" opacity="0.45" /> : null}
      </g>
      {colors.flame && colors.inner ? (
        <>
          <path className="racha-flame" d={FLAME_PATH} fill={colors.flame} stroke="#fff" strokeWidth={2} />
          <path className="racha-flame-inner" d={FLAME_INNER_PATH} fill={colors.inner} />
        </>
      ) : null}
    </svg>
  );
}

const BOTTLE_PATH =
  "M48 34L72 34L72 52C72 62 96 66 96 88L96 196C96 206 88 212 80 212L40 212C32 212 24 206 24 196L24 88C24 66 48 62 48 52Z";
const BOTTLE_TOP = 72;
const BOTTLE_BOTTOM = 212;
const WAVE_PATH = "M-120 0Q-90 -9 -60 0T0 0T60 0T120 0T180 0T240 0V170H-120Z";

export function WaterBottle({
  glasses,
  showGoalMarks,
  className
}: {
  glasses: number;
  showGoalMarks: boolean;
  className?: string;
}) {
  const level = Math.min(1, glasses / WATER_GOAL_GLASSES);
  const waterY = BOTTLE_BOTTOM - level * (BOTTLE_BOTTOM - BOTTLE_TOP);
  const step = (BOTTLE_BOTTOM - BOTTLE_TOP) / WATER_GOAL_GLASSES;
  const marks = Array.from({ length: WATER_GOAL_GLASSES - 1 }, (_, index) => BOTTLE_BOTTOM - step * (index + 1));

  return (
    <svg viewBox="0 0 120 220" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="racha-bottle-clip">
          <path d={BOTTLE_PATH} />
        </clipPath>
      </defs>

      <g className="racha-bottle-sway">
        <rect x="44" y="8" width="32" height="20" rx="5" fill="#0ea5e9" />
        <rect x="46" y="26" width="28" height="9" rx="2" fill="#7dd3fc" />
        <path d={BOTTLE_PATH} fill="#f0f9ff" />

        <g clipPath="url(#racha-bottle-clip)">
          {glasses > 0 ? (
            <g className="racha-water" style={{ "--water-y": `${waterY}px` } as CSSProperties}>
              <path className="racha-wave-back" d={WAVE_PATH} fill="#7dd3fc" transform="translate(0 -5)" />
              <path className="racha-wave" d={WAVE_PATH} fill="#38bdf8" />
              <circle className="racha-bubble" cx="46" cy="50" r="3.5" fill="#fff" style={{ "--delay": "0s" } as CSSProperties} />
              <circle className="racha-bubble" cx="66" cy="62" r="2.5" fill="#fff" style={{ "--delay": "0.9s" } as CSSProperties} />
              <circle className="racha-bubble" cx="78" cy="44" r="3" fill="#fff" style={{ "--delay": "1.7s" } as CSSProperties} />
            </g>
          ) : null}
        </g>

        {showGoalMarks
          ? marks.map((y) => <line key={y} x1="82" x2="96" y1={y} y2={y} stroke="#0284c7" strokeWidth="2" opacity="0.55" />)
          : null}

        <path d={BOTTLE_PATH} fill="none" stroke="#0284c7" strokeWidth="4" strokeLinejoin="round" />
        <path d="M36 96L36 186" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.65" />
      </g>
    </svg>
  );
}

export function FruitPlate({ className }: { className?: string }) {
  const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

  return (
    <svg viewBox="0 0 200 150" aria-hidden="true" className={className}>
      <ellipse cx="100" cy="134" rx="78" ry="9" fill="#172033" opacity="0.1" />
      <path d="M18 92C24 124 58 134 100 134C142 134 176 124 182 92Z" fill="#fff" stroke="#fda4af" strokeWidth="3" />
      <ellipse cx="100" cy="92" rx="82" ry="14" fill="#ffe4e9" stroke="#fda4af" strokeWidth="3" />

      <g className="racha-fruit" style={delay(0.2)}>
        <path d="M34 86C46 112 92 110 108 72C96 86 56 94 34 86Z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g className="racha-fruit" style={delay(0)}>
        <circle cx="74" cy="58" r="24" fill="#fb923c" />
        <circle cx="66" cy="50" r="5" fill="#fff" opacity="0.5" />
        <path d="M74 34C74 28 80 24 86 26C85 32 80 35 74 34Z" fill="#16a34a" />
      </g>
      <g className="racha-fruit" style={delay(0.7)}>
        <path d="M128 42C114 32 98 42 100 62C102 80 114 92 124 88C128 86 130 86 134 88C144 92 156 80 158 62C160 42 142 32 128 42Z" fill="#ef4444" />
        <path d="M128 42C128 34 130 28 136 24" stroke="#78350f" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M132 32C138 24 148 26 150 30C144 36 138 36 132 32Z" fill="#22c55e" />
        <ellipse cx="114" cy="56" rx="5" ry="9" fill="#fff" opacity="0.4" />
      </g>
      <g className="racha-fruit" style={delay(1.1)}>
        {[
          [152, 72],
          [164, 72],
          [146, 83],
          [158, 83],
          [170, 83],
          [152, 93],
          [164, 93]
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1.5" />
        ))}
      </g>

      <path className="racha-sparkle" style={delay(0)} d="M34 26L37 35L46 38L37 41L34 50L31 41L22 38L31 35Z" fill="#fbbf24" />
      <path className="racha-sparkle" style={delay(1.1)} d="M172 18L174 25L181 27L174 29L172 36L170 29L163 27L170 25Z" fill="#fb7185" />
    </svg>
  );
}

function origin(x: number, y: number): CSSProperties {
  return { transformOrigin: `${x}px ${y}px` };
}

function Leg({ opposite, thighColor, shoeColor }: { opposite: boolean; thighColor: string; shoeColor: string }) {
  const phase = opposite ? "racha-opposite" : undefined;

  return (
    <g className={cn("racha-limb racha-thigh", phase)} style={origin(95, 106)}>
      <line x1="95" y1="106" x2="95" y2="142" stroke={thighColor} strokeWidth="15" strokeLinecap="round" />
      <g className={cn("racha-limb racha-shin", phase)} style={origin(95, 142)}>
        <line x1="95" y1="142" x2="95" y2="174" stroke="#e8a87c" strokeWidth="11" strokeLinecap="round" />
        <path d="M88 170L103 170C112 171 118 176 118 182L88 182Z" fill={shoeColor} />
      </g>
    </g>
  );
}

function Arm({ opposite, color }: { opposite: boolean; color: string }) {
  return (
    <g className={cn("racha-limb racha-arm", opposite ? "racha-opposite" : undefined)} style={origin(106, 62)}>
      <line x1="106" y1="62" x2="106" y2="90" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <g transform="rotate(-82 106 90)">
        <line x1="106" y1="90" x2="106" y2="114" stroke="#e8a87c" strokeWidth="10" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function RunningPerson({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className={className}>
      <ellipse className="racha-shadow" cx="100" cy="188" rx="46" ry="6" fill="#172033" opacity="0.14" />
      <svg x="0" y="186" width="200" height="14" viewBox="0 0 200 14">
        <g className="racha-ground">
          {[0, 50, 100, 150, 200].map((x) => (
            <rect key={x} x={x + 6} y="6" width="26" height="4" rx="2" fill="#fda4af" />
          ))}
        </g>
      </svg>

      <g className="racha-body">
        <Arm opposite={false} color="#be123c" />
        <Leg opposite thighColor="#1e3a8a" shoeColor="#0f766e" />
        <line x1="106" y1="62" x2="96" y2="104" stroke="#f43f5e" strokeWidth="27" strokeLinecap="round" />
        <Leg opposite={false} thighColor="#2563eb" shoeColor="#14b8a6" />
        <Arm opposite color="#fb7185" />

        <rect x="104" y="40" width="12" height="14" rx="5" fill="#e8a87c" />
        <circle cx="114" cy="30" r="17" fill="#f2b68a" />
        <path d="M98 31C95 15 110 8 122 11C130 13 133 19 132 23C122 18 108 21 104 32C103 36 99 36 98 31Z" fill="#cbd5e1" />
        <path d="M100 22C110 15 122 15 132 20" stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="123" cy="29" r="2" fill="#172033" />
        <path d="M119 37C122 40 126 40 128 37" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}
