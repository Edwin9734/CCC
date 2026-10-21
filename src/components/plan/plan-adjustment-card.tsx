import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, CircleDashed, Lightbulb, MinusCircle } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import {
  ADJUSTMENT_DISCLAIMER,
  MIN_RECORDED_DAYS,
  type AreaStatus,
  type ComplianceLevel,
  type PlanAdjustment,
  type TrendDirection
} from "@/lib/plan-adjustment";

const TREND_STYLE: Record<TrendDirection, { badge: string; card: string; icon: typeof CheckCircle2 }> = {
  improving: { badge: "bg-emerald-600 text-white", card: "border-emerald-200 bg-emerald-50", icon: CheckCircle2 },
  stable: { badge: "bg-slate-200 text-slate-800", card: "border-slate-200 bg-slate-50", icon: MinusCircle },
  worsening: { badge: "bg-orange-600 text-white", card: "border-orange-200 bg-orange-50", icon: AlertTriangle },
  insufficient: { badge: "bg-slate-200 text-slate-800", card: "border-black/5 bg-white", icon: CircleDashed }
};

const LEVEL_BADGE: Record<ComplianceLevel, string> = {
  high: "bg-emerald-600 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-orange-600 text-white",
  unknown: "bg-slate-200 text-slate-800"
};

const AREA_STYLE: Record<AreaStatus, { label: string; text: string; card: string; icon: typeof CheckCircle2 }> = {
  met: { label: "Cumplido", text: "text-emerald-700", card: "border-emerald-200 bg-emerald-50", icon: CheckCircle2 },
  not_met: { label: "Por mejorar", text: "text-orange-700", card: "border-orange-200 bg-orange-50", icon: AlertCircle },
  no_data: { label: "Sin datos", text: "text-muted", card: "border-black/5 bg-white", icon: CircleDashed }
};

export function PlanAdjustmentCard({ adjustment }: { adjustment: PlanAdjustment }) {
  const { trends, compliance, changes, recommendations } = adjustment;

  return (
    <SectionCard
      title="Ajuste de tu plan"
      description="Tu plan se recalcula con tu evolución y con tu cumplimiento de los últimos 7 días."
    >
      <div className="space-y-8">
        {/* Evolución */}
        <div>
          <h3 className="text-lg font-semibold text-ink">Tu evolución</h3>
          <p className="mt-1 text-sm leading-6 text-muted">Comparamos tu última medición con la anterior.</p>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {trends.map((trend) => {
              const style = TREND_STYLE[trend.direction];
              const Icon = style.icon;
              return (
                <article key={trend.metric} className={`rounded-3xl border p-5 ${style.card}`}>
                  <p className="text-sm font-semibold text-muted">{trend.label}</p>
                  <span
                    className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}
                  >
                    <Icon className="h-4 w-4" />
                    {trend.directionLabel}
                  </span>
                  <p className="mt-3 text-sm leading-6 text-ink">{trend.detail}</p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Cumplimiento */}
        <div>
          <h3 className="text-lg font-semibold text-ink">Tu cumplimiento (últimos 7 días)</h3>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-base font-semibold ${LEVEL_BADGE[compliance.level]}`}>
              {compliance.levelLabel}
            </span>
            <p className="text-sm leading-6 text-ink">{compliance.levelMessage}</p>
          </div>

          {compliance.evaluable ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {compliance.areas.map((area) => {
                const style = AREA_STYLE[area.status];
                const Icon = style.icon;
                return (
                  <article key={area.key} className={`rounded-3xl border p-4 ${style.card}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base font-semibold text-ink">{area.label}</p>
                      <span className={`flex items-center gap-1.5 text-sm font-semibold ${style.text}`}>
                        <Icon className="h-4 w-4" />
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink">{area.value}</p>
                    <p className="text-xs text-muted">Meta: {area.goal}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4 text-sm leading-6 text-muted">
              Se evalúa cuando registras algo en al menos {MIN_RECORDED_DAYS} de los últimos 7 días.{" "}
              <Link href="/habitos" className="font-semibold text-accent underline">
                Ir a Hábitos
              </Link>{" "}
              o{" "}
              <Link href="/diario" className="font-semibold text-accent underline">
                ir al Diario
              </Link>
              .
            </div>
          )}
        </div>

        {/* Qué cambió */}
        <div>
          <h3 className="text-lg font-semibold text-ink">Qué cambió en tu plan</h3>
          <div className="mt-3 space-y-3">
            {changes.map((change) => (
              <article key={change.title} className="rounded-3xl border border-black/5 bg-background p-4">
                <p className="text-base font-semibold text-ink">{change.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted">{change.detail}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Qué hacer esta semana */}
        <div>
          <h3 className="text-lg font-semibold text-ink">Qué hacer esta semana</h3>
          <ul className="mt-3 space-y-2">
            {recommendations.map((text) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 text-base leading-7 text-ink"
              >
                <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 text-xs leading-5 text-muted">{ADJUSTMENT_DISCLAIMER}</p>
    </SectionCard>
  );
}