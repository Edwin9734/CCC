import { SectionCard } from "@/components/section-card";
import { SEVERITY_LABEL, formatReactionDate } from "@/lib/allergy-reactions";
import type { AllergyReactionRow } from "@/lib/supabase/allergies";

export function ReactionReportSection({ reactions }: { reactions: AllergyReactionRow[] }) {
  return (
    <SectionCard title="Historial de alergias" description="Reacciones registradas, con sus síntomas y la causa que sospecha el paciente.">
      {reactions.length === 0 ? (
        <p className="rounded-xl bg-background p-4 text-center text-muted">No hay reacciones registradas aún.</p>
      ) : (
        <ul className="space-y-3">
          {reactions.map((reaction) => (
            <li key={reaction.id} className="print-avoid-break rounded-xl border border-black/10 bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{formatReactionDate(reaction.occurred_at)}</p>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${reaction.severity === "severe" ? "bg-red-100 text-red-900" : "bg-amber-100 text-amber-950"}`}>
                  {SEVERITY_LABEL[reaction.severity]}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink">
                <span className="font-semibold">Síntomas: </span>
                {reaction.symptoms.join(", ")}
              </p>
              <p className="text-sm leading-6 text-ink">
                <span className="font-semibold">Posible causa: </span>
                {reaction.causes.length > 0 ? reaction.causes.join(", ") : "Sin anotar"}
              </p>
              {reaction.details ? (
                <p className="text-sm leading-6 text-ink">
                  <span className="font-semibold">Descripción: </span>
                  {reaction.details}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
