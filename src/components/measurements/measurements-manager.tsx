"use client";

import { useState } from "react";
import { SectionCard } from "@/components/section-card";
import { MeasurementForm } from "@/components/measurements/measurement-form";
import { MeasurementList } from "@/components/measurements/measurement-list";

export function MeasurementsManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Nueva medición" description="Formulario pensado para ingreso rápido y sin pasos innecesarios.">
        <MeasurementForm onSuccess={() => setRefreshTrigger((v) => v + 1)} />
      </SectionCard>

      <SectionCard title="Historial reciente" description="Tu lista de mediciones registradas en orden cronológico.">
        <MeasurementList refreshTrigger={refreshTrigger} />
      </SectionCard>
    </div>
  );
}