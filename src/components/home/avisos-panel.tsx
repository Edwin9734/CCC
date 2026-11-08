import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck } from "lucide-react";
import { CriticalAlert } from "@/components/measurements/critical-alert";
import { SectionCard } from "@/components/section-card";
import { formatDate } from "@/lib/date-utils";
import { METRIC_LABELS, getStatusLabel } from "@/lib/ranges";
import type { ContactsInfo } from "@/lib/contacts";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import type { StreakSummary } from "@/lib/racha";

function statusStyle(status?: string) {
  switch (status) {
    case "LOW":
      return { bg: "bg-blue-50", text: "text-blue-700" };
    case "NORMAL":
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

export function AvisosPanel({
  critical,
  contacts,
  notices,
  latest,
  streak
}: {
  critical: MeasurementWithStatus[];
  contacts: ContactsInfo | null;
  notices: MeasurementWithStatus[];
  latest: { label: string; data: MeasurementWithStatus | undefined }[];
  streak: StreakSummary | null;
}) {
  const missing = streak
    ? [
        !streak.today.water ? "agua" : null,
        !streak.today.sleep ? "sueño" : null,
        !streak.today.food ? "una comida" : null
      ].filter((item): item is string => item !== null)
    : [];

  return (
    <div className="space-y-6">
      {critical.map((item) => (
        <CriticalAlert
          key={item.id}
          title={`Valor crítico: ${METRIC_LABELS[item.metric]}`}
          message={`Tu última medición fue ${item.value} mg/dL, registrada el ${formatDate(item.measured_at)}.`}
          contacts={contacts}
        />
      ))}

      <SectionCard title="Mis avisos" description="Lo que conviene revisar según tu última medición y tu día.">
        <ul className="space-y-3">
          {notices.map((item) => (
            <li key={item.id}>
              <Link
                href="/mediciones"
                className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-200"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold leading-6">
                    {METRIC_LABELS[item.metric]}: {getStatusLabel(item.status)}
                  </span>
                  <span className="mt-0.5 block text-sm leading-6">
                    {item.value} mg/dL, medido el {formatDate(item.measured_at)}. Coméntalo con tu médico.
                  </span>
                </span>
                <ChevronRight className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}

          {missing.length > 0 ? (
            <li>
              <Link
                href="/racha"
                className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white p-4 text-ink transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-accent/15"
              >
                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1 text-base leading-6">
                  <span className="font-semibold">Para sumar hoy a tu racha</span> te falta registrar: {missing.join(", ")}.
                </span>
                <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ) : null}

          {critical.length === 0 && notices.length === 0 && missing.length === 0 ? (
            <li className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-base font-semibold text-emerald-900">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              No tienes avisos por ahora.
            </li>
          ) : null}
        </ul>
      </SectionCard>

      <SectionCard title="Estado general" description="Tu última medición de cada indicador.">
        <div className="grid gap-4 md:grid-cols-3">
          {latest.map(({ label, data }) => {
            const style = statusStyle(data?.status);
            return (
              <article
                key={label}
                className={`rounded-3xl p-5 ${style.bg} ${data?.status === "CRITICAL" ? "border-2 border-red-700" : ""}`}
              >
                <p className={`text-sm font-semibold ${style.text}`}>{label}</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{data ? getStatusLabel(data.status) : "Sin datos"}</p>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {data
                    ? `${data.value} mg/dL · ${formatDate(data.measured_at)}`
                    : "Aún no hay una medición registrada para este indicador."}
                </p>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
