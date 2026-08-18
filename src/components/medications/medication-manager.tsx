"use client";

import { useState } from "react";
import { SectionCard } from "@/components/section-card";
import { MedicationForm } from "@/components/medications/medication-form";
import { MedicationList } from "@/components/medications/medication-list";

export function MedicationManager() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard title="Nuevo medicamento" description="Campos simples para que el usuario lo complete sin confusión.">
        <MedicationForm onSuccess={() => setRefreshTrigger((v) => v + 1)} />
      </SectionCard>

      <SectionCard title="Lista actual" description="Tus medicamentos registrados con sus horarios.">
        <MedicationList refreshTrigger={refreshTrigger} />
      </SectionCard>
    </div>
  );
}