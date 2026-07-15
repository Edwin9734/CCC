import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { MeasurementForm } from "@/components/measurements/measurement-form";
import { MeasurementList } from "@/components/measurements/measurement-list";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MeasurementsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <AppShell
      title="Mediciones"
      description="Captura manual de HDL, LDL y triglicéridos con validación y cálculo de rangos."
      userEmail={data.user?.email ?? null}
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Nueva medición" description="Formulario pensado para ingreso rápido y sin pasos innecesarios.">
          <MeasurementForm />
        </SectionCard>

        <SectionCard title="Historial reciente" description="Tu lista de mediciones registradas en orden cronológico.">
          <MeasurementList />
        </SectionCard>
      </div>
    </AppShell>
  );
}