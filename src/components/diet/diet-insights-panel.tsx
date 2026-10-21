import Link from "next/link";
import { AlertTriangle, CheckCircle2, Pill } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { DIET_ITEMS } from "@/lib/diet-data";
import type { DietInsights } from "@/lib/diet-insights";

const NAME_BY_ID = new Map(DIET_ITEMS.map((item) => [item.id, item.name]));

function Chips({ ids, className }: { ids: string[]; className: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {ids.map((id) => (
        <span key={id} className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
          {NAME_BY_ID.get(id) ?? id}
        </span>
      ))}
    </div>
  );
}

export function DietInsightsPanel({ insights }: { insights: DietInsights }) {
  return (
    <SectionCard
      title="Para ti"
      description="Sugerencias según tus últimas mediciones y los medicamentos que tienes registrados."
    >
      <div className="space-y-4">
        {!insights.hasMeasurements ? (
          <div className="rounded-2xl border border-black/5 bg-white p-4 text-sm leading-6 text-muted">
            Aún no tienes mediciones registradas, por eso no podemos personalizar las sugerencias.{" "}
            <Link href="/mediciones" className="font-semibold text-accent underline">
              Registrar una medición
            </Link>
          </div>
        ) : null}

        {insights.allNormal ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Tus últimas mediciones no muestran valores en alerta. Sigue con una alimentación balanceada y consulta la
              guía de abajo cuando tengas dudas.
            </p>
          </div>
        ) : null}

        {insights.metricInsights.map((insight) => (
          <article
            key={insight.metric}
            className={`rounded-3xl border p-5 ${
              insight.tone === "danger" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <h3 className="text-lg font-semibold text-ink">{insight.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink">{insight.message}</p>

            <p className="mt-4 text-sm font-semibold text-ink">Conviene priorizar:</p>
            <Chips ids={insight.goodIds} className="bg-emerald-100 text-emerald-800" />

            <p className="mt-4 text-sm font-semibold text-ink">Conviene evitar:</p>
            <Chips ids={insight.avoidIds} className="bg-rose-100 text-rose-800" />
          </article>
        ))}

        {insights.medicationNotes.length > 0 ? (
          <div className="rounded-3xl border border-amber-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-amber-700" />
              <h3 className="text-lg font-semibold text-ink">Sobre tus medicamentos</h3>
            </div>
            <div className="mt-3 space-y-3">
              {insights.medicationNotes.map((note, index) => (
                <div
                  key={`${note.medicationName}-${index}`}
                  className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-900"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{note.message}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!insights.hasMedications ? (
          <p className="text-sm leading-6 text-muted">
            Si registras tus medicamentos, también te avisaremos de posibles interacciones con alimentos y bebidas.{" "}
            <Link href="/medicamentos" className="font-semibold text-accent underline">
              Ir a Medicamentos
            </Link>
          </p>
        ) : null}

        <p className="text-xs leading-5 text-muted">
          Estas sugerencias son orientativas y no reemplazan la indicación de tu médico.
        </p>
      </div>
    </SectionCard>
  );
}