import Link from "next/link";
import type { CSSProperties } from "react";
import { AlertTriangle, BellRing, ChevronRight, Pill } from "lucide-react";
import { HeartFlame } from "@/components/racha/racha-art";
import "@/components/racha/racha.css";
import { METRIC_LABELS } from "@/lib/ranges";
import type { StreakSummary } from "@/lib/racha";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import type { NextReminder } from "@/lib/supabase/medications";

const TILES: { href: string; label: string; helper: string; image: string }[] = [
  { href: "/mediciones", label: "Mediciones", helper: "Anota tus análisis", image: "mediciones" },
  { href: "/medicamentos", label: "Medicamentos", helper: "Tus medicinas", image: "medicamentos" },
  { href: "/diario", label: "Diario", helper: "Lo que comiste", image: "diario" },
  { href: "/habitos", label: "Hábitos", helper: "Agua, sueño, actividad", image: "habitos" },
  { href: "/racha", label: "Racha", helper: "Logros y gráficas", image: "racha" },
  { href: "/antecedentes", label: "Antecedentes", helper: "Tu historia de salud", image: "antecedentes" },
  { href: "/plan", label: "Mi plan", helper: "Metas y consejos", image: "plan" },
  { href: "/dietas", label: "Dietas", helper: "Guía y recetas", image: "dietas" },
  { href: "/reportes", label: "Reportes", helper: "Para tu médico", image: "reportes" }
];

function reminderDay(reminder: NextReminder) {
  if (reminder.dayOffset === 0) return "hoy";
  if (reminder.dayOffset === 1) return "mañana";
  return `en ${reminder.dayOffset} días`;
}

function dayWord(count: number) {
  return count === 1 ? "día" : "días";
}

function TodayRow({
  href,
  title,
  helper,
  art
}: {
  href: string;
  title: string;
  helper: string;
  art: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] items-center gap-4 rounded-2xl px-2 py-2 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-accent/15"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center">{art}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold leading-6 text-ink">{title}</span>
        <span className="mt-0.5 block text-sm leading-5 text-muted">{helper}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}

export function InicioPanel({
  streak,
  nextReminder,
  noticeCount,
  critical
}: {
  streak: StreakSummary | null;
  nextReminder: NextReminder | null;
  noticeCount: number;
  critical: MeasurementWithStatus[];
}) {
  return (
    <div className="space-y-5">
      {critical.map((item) => (
        <Link
          key={item.id}
          href="/dashboard?tab=avisos"
          role="alert"
          className="flex items-center gap-3 rounded-3xl border-2 border-red-700 bg-red-50 p-4 text-red-900 shadow-soft transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-300"
        >
          <AlertTriangle className="h-7 w-7 shrink-0 text-red-700" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-6">
              Valor crítico: {METRIC_LABELS[item.metric]}, {item.value} mg/dL
            </span>
            <span className="mt-1 block text-sm font-semibold leading-5">
              Consulta a un médico lo antes posible. Toca para ver qué hacer y a quién llamar.
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      ))}

      <section aria-label="Tu día de hoy" className="ab-card divide-y divide-black/5 rounded-[1.75rem] p-3">
        {streak ? (
          <TodayRow
            href="/racha"
            title={`${streak.current} ${dayWord(streak.current)} de racha`}
            helper={streak.today.complete ? "Hoy ya sumaste tu corazón." : "Registra agua, sueño y una comida."}
            art={<HeartFlame status={streak.current > 0 ? "complete" : "missed"} beating className="h-14 w-auto" />}
          />
        ) : null}
        <TodayRow
          href="/habitos?tab=medicamentos"
          title={nextReminder ? `Próxima toma: ${nextReminder.time}` : "Sin tomas programadas"}
          helper={
            nextReminder ? `${nextReminder.medicationName}, ${reminderDay(nextReminder)}` : "Agrega tus medicinas con su horario."
          }
          art={
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <Pill className="h-6 w-6" aria-hidden="true" />
            </span>
          }
        />
      </section>

      {noticeCount > 0 ? (
        <Link
          href="/dashboard?tab=avisos"
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-base font-semibold text-amber-900 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200"
        >
          <BellRing className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {noticeCount === 1 ? "Tienes 1 aviso sobre tus mediciones" : `Tienes ${noticeCount} avisos sobre tus mediciones`}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}

      <nav aria-label="Secciones de la aplicación">
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {TILES.map((tile, index) => (
            <li key={tile.href}>
              <Link
                href={tile.href}
                className="ab-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] text-center focus:outline-none focus:ring-4 focus:ring-accent/25"
                style={{ animationDelay: `${index * 45}ms` } as CSSProperties}
              >
                <span className="block overflow-hidden">
                  <img
                    src={`/home/${tile.image}.webp`}
                    alt=""
                    aria-hidden="true"
                    decoding="async"
                    className="block aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105 group-active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                </span>
                <span className="flex flex-1 flex-col justify-center p-3">
                  <span className="w-full text-lg font-semibold leading-6 text-ink">{tile.label}</span>
                  <span className="mt-0.5 w-full text-sm leading-5 text-muted">{tile.helper}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
