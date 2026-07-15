import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { MeasurementChart } from "@/components/charts/measurement-chart";
import { PDFExportButton } from "@/components/charts/pdf-export-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";

export default async function ReportesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let measurements: MeasurementWithStatus[] = [];

  if (data.user) {
    try {
      measurements = await getMeasurements(supabase, { limit: 100 });
    } catch (err) {
      console.error("Error loading measurements:", err);
    }
  }

  const totalMeasurements = measurements.length;
  const lastMeasurement = measurements[0];
  const dateRange = measurements.length > 0 
    ? `${new Date(measurements[measurements.length - 1].measured_at).toLocaleDateString("es-ES")} - ${new Date(measurements[0].measured_at).toLocaleDateString("es-ES")}`
    : "Sin datos";

  return (
    <AppShell
      title="Reportes"
      description="Exporta gráficas y tu historial de mediciones en formato PDF."
      userEmail={data.user?.email ?? null}
    >
      <div id="report-content" className="space-y-6">
        {/* Header del Reporte */}
        <div className="rounded-2xl border border-black/10 bg-surface p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-ink">Reporte de Seguimiento</h2>
              <p className="mt-2 text-muted">Sistema de Control de Colesterol para Adultos Mayores</p>
            </div>
            <PDFExportButton elementId="report-content" fileName="reporte-colesterol" />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-background p-4">
              <p className="text-sm text-muted">Período</p>
              <p className="mt-1 font-semibold text-ink">{dateRange}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-sm text-muted">Mediciones</p>
              <p className="mt-1 text-2xl font-bold text-accent">{totalMeasurements}</p>
            </div>
            <div className="rounded-xl bg-background p-4">
              <p className="text-sm text-muted">Última medición</p>
              <p className="mt-1 font-semibold text-ink">
                {lastMeasurement 
                  ? new Date(lastMeasurement.measured_at).toLocaleDateString("es-ES")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Gráficas */}
        <SectionCard 
          title="Evolución de Indicadores" 
          description="Tendencia de HDL, LDL y triglicéridos durante el período."
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <MeasurementChart measurements={measurements} metric="HDL" title="Colesterol HDL (Bueno)" />
            <MeasurementChart measurements={measurements} metric="LDL" title="Colesterol LDL (Malo)" />
            <MeasurementChart measurements={measurements} metric="TRIGLYCERIDES" title="Triglicéridos" />
          </div>
        </SectionCard>

        {/* Tabla de Mediciones */}
        <SectionCard 
          title="Historial Completo" 
          description="Todas las mediciones registradas en orden cronológico."
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-background text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Indicador</th>
                  <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {measurements.length > 0 ? (
                  measurements.map((m) => (
                    <tr key={m.id} className="border-t border-black/5">
                      <td className="px-4 py-3 text-muted">
                        {new Date(m.measured_at).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{m.metric}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">{m.value} mg/dL</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          m.status === "LOW" ? "bg-blue-100 text-blue-700" :
                          m.status === "NORMAL" ? "bg-green-100 text-green-700" :
                          m.status === "BORDERLINE" ? "bg-yellow-100 text-yellow-700" :
                          m.status === "HIGH" ? "bg-orange-100 text-orange-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-black/5">
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      No hay mediciones registradas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Notas Médicas */}
        <SectionCard 
          title="Recomendaciones" 
          description="Consejos generales para el control del colesterol."
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="font-semibold text-blue-900">HDL (Colesterol Bueno)</p>
              <p className="mt-1 text-sm text-blue-800">Mantener arriba de 40 mg/dL en hombres y 50 mg/dL en mujeres.</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-4">
              <p className="font-semibold text-orange-900">LDL (Colesterol Malo)</p>
              <p className="mt-1 text-sm text-orange-800">Mantener bajo 130 mg/dL. Ideal bajo 100 mg/dL.</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4">
              <p className="font-semibold text-purple-900">Triglicéridos</p>
              <p className="mt-1 text-sm text-purple-800">Mantener bajo 150 mg/dL.</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}