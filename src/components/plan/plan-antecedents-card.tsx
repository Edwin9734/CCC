import { AlertTriangle, Info } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import type { ProfileExtras } from "@/lib/plan-profile";

export function PlanAntecedentsCard({ extras }: { extras: ProfileExtras }) {
  const hasAny = extras.antecedents.length > 0 || extras.otherConditions.length > 0;

  return (
    <SectionCard
      title="Tus antecedentes"
      description="Lo que marcaste en «Mis datos» y cómo se relaciona con tu plan."
    >
      {!hasAny ? (
        <p className="text-sm leading-6 text-muted">
          No tienes enfermedades marcadas como «Padece». Si tienes alguna, márcala en «Mis datos» (el botón de arriba a
          la derecha) para ver notas sobre ella.
        </p>
      ) : (
        <div className="space-y-3">
          {extras.antecedents.map((item) => (
            <article
              key={item.key}
              className={`rounded-3xl border p-4 ${
                item.highlight ? "border-amber-300 bg-amber-50" : "border-black/5 bg-background"
              }`}
            >
              <p className="flex items-center gap-2 text-base font-semibold text-ink">
                {item.highlight ? <AlertTriangle className="h-4 w-4 text-amber-700" /> : null}
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-6 text-ink">{item.note}</p>
            </article>
          ))}

          {extras.otherConditions.length > 0 ? (
            <article className="rounded-3xl border border-black/5 bg-background p-4">
              <p className="flex items-center gap-2 text-base font-semibold text-ink">
                <Info className="h-4 w-4 text-accent" />
                Otras enfermedades que registraste
              </p>
              <p className="mt-1 text-sm leading-6 text-ink">{extras.otherConditions.join(", ")}.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Este plan no las considera: coméntalas con tu médico.
              </p>
            </article>
          ) : null}
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-muted">
        Estas notas son generales y no reemplazan la indicación de tu médico. Si no coinciden con lo que él te indicó,
        sigue sus indicaciones.
      </p>
    </SectionCard>
  );
}