import { MeasurementChart } from "@/components/charts/measurement-chart";
import { SectionCard } from "@/components/section-card";
import { formatDate } from "@/lib/date-utils";
import { getStatusLabel } from "@/lib/ranges";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";

export function HistorialPanel({ measurements }: { measurements: MeasurementWithStatus[] }) {
  return (
    <div className="space-y-6">
      <SectionCard
        title="Últimas mediciones"
        description={measurements.length > 0 ? `Tus ${measurements.length} registros más recientes.` : undefined}
      >
        {measurements.length > 0 ? (
          <>
            {/* Vista de TABLA: visible desde sm hacia arriba */}
            <div className="hidden overflow-x-auto rounded-2xl border border-black/5 sm:block">
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
                  {measurements.map((item) => (
                    <tr key={item.id} className="border-t border-black/5 bg-white">
                      <td className="px-4 py-4 font-semibold text-ink">{item.metric}</td>
                      <td className="px-4 py-4 text-muted">{item.value} mg/dL</td>
                      <td className={`px-4 py-4 ${item.status === "CRITICAL" ? "font-bold text-red-800" : "text-muted"}`}>
                        {getStatusLabel(item.status)}
                      </td>
                      <td className="px-4 py-4 text-muted">{formatDate(item.measured_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de TARJETAS: visible solo en móvil */}
            <div className="space-y-3 sm:hidden">
              {measurements.map((item) => (
                <article key={item.id} className="rounded-2xl border border-black/5 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <p className="font-semibold text-ink">{item.metric}</p>
                    <p className="text-sm text-muted">{formatDate(item.measured_at)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2">
                    <p className="text-muted">{item.value} mg/dL</p>
                    <p className={`text-sm ${item.status === "CRITICAL" ? "font-bold text-red-800" : "font-semibold text-ink"}`}>
                      {getStatusLabel(item.status)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-black/5 bg-white px-4 py-6 text-center text-sm text-muted">
            No hay mediciones registradas aún.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Evolución de indicadores" description="Gráficas de HDL, LDL y triglicéridos a lo largo del tiempo.">
        <div className="grid gap-6 lg:grid-cols-3">
          <MeasurementChart measurements={measurements} metric="HDL" title="Colesterol HDL (Bueno)" />
          <MeasurementChart measurements={measurements} metric="LDL" title="Colesterol LDL (Malo)" />
          <MeasurementChart measurements={measurements} metric="TRIGLYCERIDES" title="Triglicéridos" />
        </div>
      </SectionCard>
    </div>
  );
}
