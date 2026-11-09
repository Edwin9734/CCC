import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Check, Droplets, Moon, Utensils } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { FruitPlate, HeartFlame, RunningPerson, WaterBottle } from "@/components/racha/racha-art";
import { WATER_GOAL_GLASSES } from "@/lib/habits-config";
import { cn } from "@/lib/utils";
import type { RachaView, WeekHeart } from "@/lib/racha";

const STATUS_TEXT: Record<WeekHeart["status"], string> = {
  complete: "día registrado",
  grace: "sin registro, cubierto por el día de gracia",
  missed: "sin registro",
  pending: "hoy, todavía sin completar",
  future: "todavía no llega"
};

function dayWord(count: number) {
  return count === 1 ? "día" : "días";
}

function TodayItem({
  done,
  label,
  href,
  icon
}: {
  done: boolean;
  label: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-2 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-accent/15",
        done ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-black/10 bg-white text-ink hover:bg-slate-50"
      )}
    >
      {done ? <Check className="h-4 w-4 shrink-0" /> : icon}
      {label}
      <span className="sr-only">{done ? ": registrado hoy" : ": falta registrar hoy"}</span>
    </Link>
  );
}

function ActionCard({
  href,
  label,
  title,
  helper,
  children
}: {
  href: string;
  label: string;
  title: string;
  helper: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="ab-card block rounded-[1.75rem] p-5 text-center transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-accent/15 motion-reduce:transition-none"
    >
      {children}
      <p className="mt-2 text-lg font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{helper}</p>
    </Link>
  );
}

export function RachaPanel({ view, waterRestricted }: { view: RachaView; waterRestricted: boolean }) {
  const { streak, waterGlassesToday: glasses, activityMinutesToday, mealsToday } = view;
  const missing = [
    !streak.today.water ? "agua" : null,
    !streak.today.sleep ? "sueño" : null,
    !streak.today.food ? "una comida" : null
  ].filter((item): item is string => item !== null);

  const todayMessage = streak.today.complete
    ? "¡Muy bien! Hoy ya sumaste tu corazón."
    : `Para sumar hoy te falta registrar: ${missing.join(", ")}.`;

  const waterTitle = waterRestricted
    ? `${glasses} ${glasses === 1 ? "vaso" : "vasos"} hoy`
    : `${glasses} de ${WATER_GOAL_GLASSES} vasos`;
  const waterHelper = waterRestricted
    ? "Tu médico debe indicarte cuánta agua tomar. Toca la botella para anotar tus vasos."
    : glasses >= WATER_GOAL_GLASSES
      ? "¡Meta de hoy cumplida! Toca la botella para ver tu registro."
      : "Toca la botella para agregar más agua.";

  return (
    <div className="space-y-6">
      <SectionCard title="Mi racha" description="Cada día con agua, sueño y al menos una comida suma un corazón.">
        <div className="flex flex-col items-center text-center">
          <div className="racha-heart-pop relative h-52 w-48 max-w-full">
            <HeartFlame status={streak.current > 0 ? "complete" : "missed"} beating className="h-full w-full" />
            <p
              className={cn(
                "absolute inset-x-0 top-[71%] -translate-y-1/2 text-5xl font-bold leading-none",
                streak.current > 0 ? "text-white" : "text-sky-900"
              )}
            >
              {streak.current}
            </p>
          </div>
          <p className="text-2xl font-semibold text-ink">
            {streak.current} {dayWord(streak.current)} de racha
          </p>
          <p className="mt-1 text-sm text-muted">
            Tu mejor racha: {streak.best} {dayWord(streak.best)}
          </p>
        </div>

        <ul aria-label="Corazones de esta semana" className="mx-auto mt-6 grid max-w-xl grid-cols-7 gap-1 sm:gap-2">
          {streak.week.map((day, index) => (
            <li
              key={day.date}
              aria-label={`${day.dayName}: ${STATUS_TEXT[day.status]}`}
              className="racha-heart-pop flex flex-col items-center"
              style={{ "--i": index + 1 } as CSSProperties}
            >
              <HeartFlame
                status={day.status}
                className={cn("h-auto w-full max-w-[3.5rem]", day.status === "pending" && "racha-today-pulse")}
              />
              <span
                className={cn(
                  "mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  day.isToday ? "bg-accent text-white" : "text-muted"
                )}
              >
                {day.letter}
              </span>
              <span className="h-4 text-[0.65rem] font-semibold leading-4 text-sky-700">
                {day.status === "grace" ? "Gracia" : ""}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-2">
            <HeartFlame status="complete" className="h-6 w-6" /> Con registro
          </span>
          <span className="flex items-center gap-2">
            <HeartFlame status="missed" className="h-6 w-6" /> Sin registro
          </span>
        </div>

        <p className="mt-5 text-center text-base font-semibold leading-7 text-ink">{todayMessage}</p>
        <div className="mx-auto mt-3 grid max-w-xl grid-cols-3 gap-2">
          <TodayItem done={streak.today.water} label="Agua" href="/habitos?tab=agua" icon={<Droplets className="h-4 w-4 shrink-0" />} />
          <TodayItem done={streak.today.sleep} label="Sueño" href="/habitos?tab=agua" icon={<Moon className="h-4 w-4 shrink-0" />} />
          <TodayItem done={streak.today.food} label="Comida" href="/diario" icon={<Utensils className="h-4 w-4 shrink-0" />} />
        </div>

        <p className="mt-4 text-center text-sm leading-6 text-muted">
          {streak.graceAvailable
            ? "Si se te olvida un día, tu día de gracia de esta semana cuida tu racha."
            : "Ya usaste tu día de gracia de esta semana. La próxima semana tendrás otro."}
        </p>
      </SectionCard>

      <ActionCard href="/habitos?tab=agua" label={`${waterTitle}. Ir a Agua y sueño`} title={waterTitle} helper={waterHelper}>
        <WaterBottle glasses={glasses} showGoalMarks={!waterRestricted} className="mx-auto h-56 w-auto" />
      </ActionCard>

      <div className="grid gap-6 sm:grid-cols-2">
        <ActionCard
          href="/diario"
          label="Ir al Diario para anotar lo que comiste"
          title="Mi plato"
          helper={
            mealsToday > 0
              ? `Hoy llevas ${mealsToday} ${mealsToday === 1 ? "comida registrada" : "comidas registradas"}. Toca para ver tu Diario.`
              : "Toca el plato para anotar lo que comiste."
          }
        >
          <FruitPlate className="mx-auto h-40 w-auto" />
        </ActionCard>

        <ActionCard
          href="/habitos?tab=actividad"
          label="Ir a Actividad para registrar ejercicio"
          title="A moverse"
          helper={
            activityMinutesToday > 0
              ? `Hoy llevas ${activityMinutesToday} minutos de actividad. Toca para agregar más.`
              : "Toca para registrar tu actividad física."
          }
        >
          <RunningPerson className="mx-auto h-40 w-auto" />
        </ActionCard>
      </div>
    </div>
  );
}
