import { AppShell } from "@/components/app-shell";
import { MeasurementsManager } from "@/components/measurements/measurements-manager";
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
      <MeasurementsManager />
    </AppShell>
  );
}