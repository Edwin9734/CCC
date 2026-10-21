import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { StatCard } from "@/components/stat-card";
import { MeasurementChart } from "@/components/charts/measurement-chart";
import { CriticalAlert } from "@/components/measurements/critical-alert";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getNextReminder, type NextReminder } from "@/lib/supabase/medications";
import { METRIC_LABELS, getStatusLabel, isAlertStatus } from "@/lib/ranges";
import { formatDate } from "@/lib/date-utils";

function getStatusStyle(status?: string) {
  switch (status) {
    case "LOW":
      return { bg: "bg-blue-50", text: "text-blue-700" };
    case "NORMAL":
      return { bg: "bg-accentSoft", text: "text-accent" };
    case "PROTECTIVE":
      return { bg: "bg-emerald-50", text: "text-emerald-700" };
    case "BORDERLINE":
      return { bg: "bg-amber-50", text: "text-warning" };
    case "HIGH":
      return { bg: "bg-orange-50", text: "text-orange-700" };
    case "VERY_HIGH":
      return { bg: "bg-rose-50", text: "text-danger" };
    case "CRITICAL":
      return { bg: "bg-red-100", text: "text-red-800" };
    default:
      return { bg: "bg-slate-50", text: "text-muted" };
  }
}

function formatReminderHelper(reminder: NextReminder) {
  const when = reminder.dayOffset === 0 ? "hoy" : reminder.dayOffset === 1 ? "mañana" : `en ${reminder.dayOffset} días`;
  return `${reminder.medicationName} · ${when}`;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let measurements: MeasurementWithStatus[] = [];
  let alertCount = 0;
  let nextReminder: NextReminder | null = null;

  if (data.user) {
    try {
      measurements = await getMeasurements(supabase, { limit: 50 });
      alertCount = measurements.filter((m) => isAlertStatus(m.status)).length;
    } catch (err) {
      console.error("Error loading measurements:", err);
    }

    try {
      nextReminder = await getNextReminder(supabase);
    } catch (err) {
      console.error("Error loading next reminder:", err);
    }
  }

  const latestByMetric = (metric: string) => measurements.find((m) => m.metric === metric);
  const latestHDL = latestByMetric("HDL");
  const latestLDL = latestByMetric("LDL");
  const latestTriglycerides = latestByMetric("TRIGLYCERIDES");

  // Mientras la última medición de un indicador siga siendo crítica, se muestra el aviso.
  const criticalLatest = [latestHDL, latestLDL, latestTriglycerides].filter(
    (m): m is MeasurementWithStatus => m !== undefined && m.status === "CRITICAL"
  );

  return (
    <AppShell
      title="Panel principal"
      description="Resumen rápido de tus mediciones, alertas, medicamentos y reportes."
      userEmail={data.user?.email ?? null}
    >
      {criticalLatest.length > 0 ? (
        <div className="mb-6 space-y-4">
          {criticalLatest.map((m) => (
            <CriticalAlert
              key={m.id}
              title={`Valor crítico: ${METRIC_LABELS[m.metric]}`}
              message={`Tu última medición fue ${m.value} mg/dL, registrada el ${formatDate(m.measured_at)}.`}
            />
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Próximo recordatorio"
          value={nextReminder ? nextReminder.time : "—"}
          helper={nextReminder ? formatReminderHelper(nextReminder) : "No tienes medicamentos con horario programado."}
          tone={nextReminder ? "good" : "neutral"}
        />
        <StatCard
          label="Alertas activas"
          value={alertCount.toString()}
          helper={
            criticalLatest.length > 0
              ? "Hay un valor crítico. Consulta a un médico lo antes posible."
              : alertCount > 0
                ? "Hay mediciones que merecen revisión."
                : "Todo en rango normal."
          }
          tone={criticalLatest.length > 0 ? "danger" : alertCount > 0 ? "warning" : "good"}
        />
        <StatCard label="Mediciones registradas" value={measurements.length.toString()} helper="Total de registros en tu historial." />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard
          title="Últimas mediciones"
          description="Las gráficas se conectarán a estas mediciones para mostrar evolución por fecha."
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
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ink">{item.metric}</p>
                      <p className="text-sm text-muted">{formatDate(item.measured_at)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
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

        <SectionCard title="Estado general" description="Vista compacta pensada para adultos mayores.">
          <div className="grid gap-4">
            {[
              { label: "HDL", data: latestHDL },
              { label: "LDL", data: latestLDL },
              { label: "Triglicéridos", data: latestTriglycerides }
            ].map(({ label, data: latest }) => {
              const style = getStatusStyle(latest?.status);
              return (
                <article
                  key={label}
                  className={`rounded-3xl p-5 ${style.bg} ${latest?.status === "CRITICAL" ? "border-2 border-red-700" : ""}`}
                >
                  <p className={`text-sm font-semibold ${style.text}`}>{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {latest ? getStatusLabel(latest.status) : "Sin datos"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {latest
                      ? `${latest.value} mg/dL · ${formatDate(latest.measured_at)}`
                      : "Aún no hay una medición registrada para este indicador."}
                  </p>
                </article>
              );
            })}
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