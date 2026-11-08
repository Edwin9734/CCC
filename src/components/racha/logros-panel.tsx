import type { CSSProperties } from "react";
import { Apple, Flame, Footprints, Lock, Stethoscope, type LucideIcon } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Medal, MedalGroupKey, MedalTier, RachaView } from "@/lib/racha";

const GROUP_ICONS: Record<MedalGroupKey, LucideIcon> = {
  racha: Flame,
  comida: Apple,
  ejercicio: Footprints,
  mediciones: Stethoscope
};

const TIER_COLORS: Record<MedalTier, { outer: string; inner: string; text: string; name: string }> = {
  bronze: { outer: "#b45309", inner: "#f0b27a", text: "text-amber-950", name: "Bronce" },
  silver: { outer: "#64748b", inner: "#e2e8f0", text: "text-slate-800", name: "Plata" },
  gold: { outer: "#d97706", inner: "#fde047", text: "text-amber-900", name: "Oro" }
};

function MedalArt({
  icon: Icon,
  tier,
  earned,
  index
}: {
  icon: LucideIcon;
  tier: MedalTier;
  earned: boolean;
  index: number;
}) {
  const colors = TIER_COLORS[tier];

  return (
    <div className="racha-medal-in relative h-20 w-16 shrink-0" style={{ "--i": index } as CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 64 80" className="h-full w-full">
        <path d="M14 0H30L38 28H22Z" fill={earned ? "#e11d48" : "#cbd5e1"} />
        <path d="M50 0H34L26 28H42Z" fill={earned ? "#2563eb" : "#94a3b8"} />
        <circle cx="32" cy="50" r="28" fill={earned ? colors.outer : "#94a3b8"} />
        <circle cx="32" cy="50" r="22" fill={earned ? colors.inner : "#e2e8f0"} />
      </svg>
      <span className={cn("absolute inset-x-0 bottom-[1.05rem] flex justify-center", earned ? colors.text : "text-slate-500")}>
        {earned ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
      </span>
      {earned ? (
        <span className="absolute bottom-0.5 left-0.5 right-0.5 top-[0.9rem] overflow-hidden rounded-full">
          <span className="racha-shine absolute inset-y-0 w-1/3 bg-white/60" />
        </span>
      ) : null}
    </div>
  );
}

function MedalRow({ medal, icon, index }: { medal: Medal; icon: LucideIcon; index: number }) {
  const earned = medal.earnedOn !== null;
  const percent = Math.round((medal.progress / medal.goal) * 100);

  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-3xl border p-4",
        earned ? "border-amber-200 bg-amber-50" : "border-black/5 bg-white"
      )}
    >
      <MedalArt icon={icon} tier={medal.tier} earned={earned} index={index} />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-6 text-ink">{medal.title}</p>
        <p className="text-sm leading-5 text-muted">{medal.description}</p>
        {medal.earnedOn ? (
          <p className="mt-1 text-sm font-semibold text-amber-900">
            {TIER_COLORS[medal.tier].name} · Ganada el {formatDate(medal.earnedOn)}
          </p>
        ) : (
          <>
            <div className="mt-2 h-2.5 w-full rounded-full bg-black/10" aria-hidden="true">
              <div className="h-2.5 rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {medal.progress} de {medal.goal} {medal.unit}
            </p>
          </>
        )}
      </div>
    </li>
  );
}

export function LogrosPanel({ view }: { view: RachaView }) {
  const percent = Math.round((view.earnedMedals / view.totalMedals) * 100);

  return (
    <div className="space-y-6">
      <SectionCard title="Mis logros" description="Cada medalla reconoce tu constancia.">
        <p className="text-3xl font-semibold text-ink">
          {view.earnedMedals} de {view.totalMedals} medallas
        </p>
        <div className="mt-3 h-3 w-full rounded-full bg-black/10" aria-hidden="true">
          <div className="h-3 rounded-full bg-accent" style={{ width: `${percent}%` }} />
        </div>
      </SectionCard>

      {view.medalGroups.map((group) => (
        <SectionCard key={group.key} title={group.title} description={group.description}>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.medals.map((medal, index) => (
              <MedalRow key={medal.id} medal={medal} icon={GROUP_ICONS[group.key]} index={index} />
            ))}
          </ul>
        </SectionCard>
      ))}
    </div>
  );
}
