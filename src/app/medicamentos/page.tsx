import { AppShell } from "@/components/app-shell";
import { MedicationManager } from "@/components/medications/medication-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MedicationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <AppShell
      title="Medicamentos"
      description="Registro de nombre, dosis y horarios para generar recordatorios por notificación y correo."
      userEmail={data.user?.email ?? null}
    >
      <MedicationManager />
    </AppShell>
  );
}