"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import type { Dose } from "@/lib/habits-config";
import type { IntakeStatus } from "@/lib/supabase/habits";

function statusText(dose: Dose) {
  if (dose.status === "taken") return "Tomada";
  if (dose.status === "skipped") return "No tomada";
  return dose.due ? "Sin registrar" : "Más tarde";
}

export function MedicationIntakeCard({
  doses,
  hasMedications,
  onMark
}: {
  doses: Dose[];
  hasMedications: boolean;
  onMark: (dose: Dose, status: IntakeStatus) => void;
}) {
  const taken = doses.filter((d) => d.status === "taken").length;

  return (
    <SectionCard
      title="Medicamentos del día"
      description="Marca si tomaste cada medicamento. Los horarios salen de la sección Medicamentos."
    >
      {!hasMedications ? (
        <p className="text-sm leading-6 text-muted">
          Aún no tienes medicamentos registrados.{" "}
          <Link href="/medicamentos" className="font-semibold text-accent underline">
            Registrar medicamentos
          </Link>
        </p>
      ) : doses.length === 0 ? (
        <p className="text-sm leading-6 text-muted">
          No tienes tomas programadas para este día. Solo aparecen los medicamentos que tienen un horario.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm font-semibold text-ink">
            Tomadas: {taken} de {doses.length}
          </p>

          <div className="space-y-3">
            {doses.map((dose) => {
              const isTaken = dose.status === "taken";
              const isSkipped = dose.status === "skipped";

              return (
                <article key={dose.scheduleId} className="rounded-3xl border border-black/5 bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-ink">
                        {dose.medicationName} <span className="text-sm font-normal text-muted">{dose.dosage}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <Clock className="h-4 w-4" />
                        {dose.time} · {statusText(dose)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onMark(dose, "taken")}
                        aria-pressed={isTaken}
                        className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                          isTaken
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-black/10 bg-white text-ink hover:bg-slate-50"
                        }`}
                      >
                        La tomé
                      </button>
                      <button
                        type="button"
                        onClick={() => onMark(dose, "skipped")}
                        aria-pressed={isSkipped}
                        className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
                          isSkipped
                            ? "border-amber-600 bg-amber-600 text-white"
                            : "border-black/10 bg-white text-ink hover:bg-slate-50"
                        }`}
                      >
                        No la tomé
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-5 text-muted">
            Si marcaste algo por error, toca otra vez el mismo botón para quitar la marca.
          </p>
        </>
      )}
    </SectionCard>
  );
}