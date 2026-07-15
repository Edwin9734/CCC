import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { MeasurementChart } from "@/components/charts/measurement-chart";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getLipidStatus, getStatusLabel } from "@/lib/ranges";

export default async function DashboardPage() {            //autentication    
  const supabase = await createSupabaseServerClient();    //crear conexion  
  const { data } = await supabase.auth.getUser();         //obtener datos de usuario 
  
  let measurements: MeasurementWithStatus[] = [];         //crar lista vacia para almacenar mediciones y con withStatus para obtener propiedades obligatoias
  let alertCount = 0;                                    //variable para contador 
  
  if (data.user) {                                       //si hay usuario logueado se carga informacion 
    try {                                                //medida de seguirdad si supabase se cae mandara un error a consola
      measurements = await getMeasurements(supabase, { limit: 50 });   //descarga las ultimas 50 mediciones 
      alertCount = measurements.filter((m) =>                  //recorre la lista y crea un subgrupo con estados higt
        m.status === "HIGH" || m.status === "VERY_HIGH" || m.status === "BORDERLINE"
      ).length;
    } catch (err) {
      console.error("Error loading measurements:", err);
    }
  }

  return (                                      //estructura visual con componentes anidados
    <AppShell
      title="Panel principal"
      description="Resumen rápido de tus mediciones, alertas, medicamentos y reportes."
      userEmail={data.user?.email ?? null}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Próximo recordatorio" value="08:00" helper="Medicamento matutino programado para hoy." tone="good" />
        <StatCard label="Alertas activas" value={alertCount.toString()} helper={alertCount > 0 ? "Hay mediciones que merecen revisión." : "Todo en rango normal."} tone={alertCount > 0 ? "warning" : "good"} />
        <StatCard label="Mediciones registradas" value={measurements.length.toString()} helper="Total de registros en tu historial." />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Últimas mediciones"
          description="Las gráficas se conectarán a estas mediciones para mostrar evolución por fecha."
        >
          <div className="overflow-hidden rounded-2xl border border-black/5">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Indicador</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {measurements.length > 0 ? (
                  measurements.map((item) => (
                    <tr key={item.id} className="border-t border-black/5 bg-white">
                      <td className="px-4 py-4 font-semibold text-ink">{item.metric}</td>
                      <td className="px-4 py-4 text-muted">{item.value} mg/dL</td>
                      <td className="px-4 py-4 text-muted">{getStatusLabel(item.status as any)}</td>
                      <td className="px-4 py-4 text-muted">{new Date(item.measured_at).toLocaleDateString("es-ES")}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-black/5 bg-white">
                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-muted">
                      No hay mediciones registradas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Estado general" description="Vista compacta pensada para adultos mayores.">
          <div className="grid gap-4">
            <article className="rounded-3xl bg-accentSoft p-5">
              <p className="text-sm font-semibold text-accent">HDL</p>
              <p className="mt-2 text-2xl font-semibold text-ink">Normal</p>
              <p className="mt-1 text-sm leading-6 text-muted">Muestra buena tendencia en el seguimiento más reciente.</p>
            </article>
            <article className="rounded-3xl bg-amber-50 p-5">
              <p className="text-sm font-semibold text-warning">LDL</p>
              <p className="mt-2 text-2xl font-semibold text-ink">Alerta leve</p>
              <p className="mt-1 text-sm leading-6 text-muted">Conviene revisar hábitos y continuar con el control.</p>
            </article>
            <article className="rounded-3xl bg-rose-50 p-5">
              <p className="text-sm font-semibold text-danger">Triglicéridos</p>
              <p className="mt-2 text-2xl font-semibold text-ink">Revisión recomendada</p>
              <p className="mt-1 text-sm leading-6 text-muted">El sistema marcará esta lectura para notificación.</p>
            </article>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Evolución de indicadores" description="Gráficas de tendencia para HDL, LDL y triglicéridos a lo largo del tiempo.">
          <div className="grid gap-6 lg:grid-cols-3">
            <MeasurementChart measurements={measurements} metric="HDL" title="Colesterol HDL (Bueno)" />
            <MeasurementChart measurements={measurements} metric="LDL" title="Colesterol LDL (Malo)" />
            <MeasurementChart measurements={measurements} metric="TRIGLYCERIDES" title="Triglicéridos" />
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}