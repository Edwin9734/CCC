"use client";

import type { CSSProperties, ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { formatLongDate } from "@/lib/antecedentes";
import { SEVERITY_LABEL, formatReactionDate } from "@/lib/allergy-reactions";
import { METRIC_LABELS, getStatusLabel, type LipidMetric } from "@/lib/ranges";
import { PERIODS, SECTION_LABELS, measurementsInPeriod, type PeriodKey, type ReportData, type ReportSectionKey } from "@/lib/report-builder";

const STATUS_STYLE: Record<string, string> = {
  LOW: "bg-orange-100 text-orange-900",
  NORMAL: "bg-emerald-100 text-emerald-900",
  PROTECTIVE: "bg-emerald-100 text-emerald-900",
  BORDERLINE: "bg-amber-100 text-amber-900",
  HIGH: "bg-orange-100 text-orange-900",
  VERY_HIGH: "bg-red-100 text-red-900",
  CRITICAL: "bg-red-700 text-white"
};

const LINE_COLOR: Record<LipidMetric, string> = { LDL: "#e11d48", TRIGLYCERIDES: "#d97706", HDL: "#059669" };

function shortDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}/${Number(month)}/${year.slice(2)}`;
}

function goalOf(metric: LipidMetric, hdlMinimum: number) {
  return metric === "LDL" ? 100 : metric === "TRIGLYCERIDES" ? 150 : hdlMinimum;
}

function Block({ id, title, index, children }: { id: ReportSectionKey; title: string; index: number; children: ReactNode }) {
  return (
    <section id={`report-${id}`} className="report-block ant-rise mt-[1.4em]" style={{ "--i": index } as CSSProperties}>
      <h2 className="print-keep-with-next mb-[0.5em] border-l-[5px] border-rose-600 pl-[0.5em] text-[1.2em] font-bold leading-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg bg-slate-50 p-[0.6em] text-[0.9em] text-slate-500">{text}</p>;
}

function Chart({ metric, rows, hdlMinimum }: { metric: LipidMetric; rows: ReportData["measurements"]; hdlMinimum: number }) {
  const points = rows
    .filter((row) => row.metric === metric)
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .map((row) => ({ date: shortDate(row.measured_at), value: Number(row.value) }));
  const goal = goalOf(metric, hdlMinimum);

  return (
    <div className="print-avoid-break rounded-xl border border-slate-200 p-[0.6em]">
      <p className="text-[0.95em] font-bold text-slate-800">
        {METRIC_LABELS[metric]} <span className="font-semibold text-slate-500">· meta {metric === "HDL" ? `${goal} o más` : `menos de ${goal}`}</span>
      </p>
      {points.length === 0 ? (
        <p className="py-[1em] text-center text-[0.85em] text-slate-500">Sin mediciones en este periodo.</p>
      ) : (
        <div className="h-[11em]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} minTickGap={16} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickLine={false} axisLine={false} domain={[(min: number) => Math.floor(Math.min(min, goal) * 0.85), (max: number) => Math.ceil(Math.max(max, goal) * 1.1)]} />
              <ReferenceLine y={goal} stroke="#059669" strokeDasharray="5 4" strokeWidth={1.5} />
              <Line type="linear" dataKey="value" stroke={LINE_COLOR[metric]} strokeWidth={2} dot={{ r: 3, fill: LINE_COLOR[metric] }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export interface ReportOptions {
  sections: ReportSectionKey[];
  period: PeriodKey;
  metrics: LipidMetric[];
  large: boolean;
  signature: boolean;
  notes: string;
  title: string;
}

export function ReportDocument({ data, options }: { data: ReportData; options: ReportOptions }) {
  const rows = measurementsInPeriod(data.measurements, options.period, data.today, options.metrics);
  const periodLabel = PERIODS.find((item) => item.key === options.period)?.label ?? "";
  const { patient, contacts } = data;

  const latestOf = (metric: LipidMetric) => data.measurements.filter((row) => row.metric === metric && row.measured_at <= data.today);

  const render = (key: ReportSectionKey, index: number) => {
    const title = SECTION_LABELS[key];
    switch (key) {
      case "datos":
        return (
          <Block key={key} id={key} title="Datos del paciente" index={index}>
            <dl className="grid grid-cols-2 gap-x-[1em] gap-y-[0.4em] text-[0.9em] sm:grid-cols-3">
              {[
                ["Nombre", patient.name ?? "—"],
                ["Edad", patient.age !== null ? `${patient.age} años` : "—"],
                ["Sexo", patient.sex ?? "—"],
                ["Peso", patient.weightLb ? `${patient.weightLb} lb` : "—"],
                ["Estatura", patient.heightCm ? `${patient.heightCm} cm` : "—"],
                ["IMC", patient.bmi ?? "—"],
                ["Médico", contacts?.doctor ? `${contacts.doctor.name ?? "—"}${contacts.doctor.phone ? ` · ${contacts.doctor.phone}` : ""}` : "—"],
                ["Emergencia", contacts?.emergency ? `${contacts.emergency.name ?? "—"}${contacts.emergency.relationship ? ` (${contacts.emergency.relationship})` : ""}${contacts.emergency.phone ? ` · ${contacts.emergency.phone}` : ""}` : "—"]
              ].map(([label, value]) => (
                <div key={label} className={label === "Médico" || label === "Emergencia" ? "col-span-2 sm:col-span-3" : ""}>
                  <dt className="text-[0.85em] font-semibold text-slate-500">{label}</dt>
                  <dd className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{value}</dd>
                </div>
              ))}
            </dl>
          </Block>
        );
      case "resumen":
        return (
          <Block key={key} id={key} title={title} index={index}>
            <p className="mb-[0.5em] text-[0.9em] text-slate-700">
              Nivel de riesgo según el colesterol: <span className="font-bold text-slate-900">{data.riskLabel}</span>
            </p>
            <div className="grid gap-[0.5em] sm:grid-cols-3">
              {options.metrics.map((metric) => {
                const list = latestOf(metric);
                const last = list[0];
                const previous = list[1];
                const delta = last && previous ? Math.round((Number(last.value) - Number(previous.value)) * 10) / 10 : null;
                return (
                  <div key={metric} className="print-avoid-break rounded-xl border border-slate-200 p-[0.6em]">
                    <p className="text-[0.85em] font-semibold text-slate-500">{METRIC_LABELS[metric]}</p>
                    {last ? (
                      <>
                        <p className="text-[1.6em] font-bold leading-tight text-slate-900">
                          {last.value} <span className="text-[0.5em] font-semibold text-slate-500">mg/dL</span>
                        </p>
                        <span className={`inline-block rounded-full px-[0.6em] py-[0.1em] text-[0.8em] font-semibold ${STATUS_STYLE[last.status] ?? "bg-slate-100"}`}>{getStatusLabel(last.status)}</span>
                        <p className="mt-[0.3em] text-[0.8em] text-slate-500">
                          {formatLongDate(last.measured_at)}
                          {delta !== null ? ` · ${delta > 0 ? "+" : ""}${delta} vs. anterior` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-[0.9em] text-slate-500">Sin mediciones</p>
                    )}
                  </div>
                );
              })}
            </div>
          </Block>
        );
      case "graficas":
        return (
          <Block key={key} id={key} title={`${title} · ${periodLabel}`} index={index}>
            <div className="grid gap-[0.6em]">
              {options.metrics.map((metric) => (
                <Chart key={metric} metric={metric} rows={rows} hdlMinimum={data.hdlMinimum} />
              ))}
            </div>
          </Block>
        );
      case "tabla":
        return (
          <Block key={key} id={key} title={`${title} · ${periodLabel}`} index={index}>
            {rows.length === 0 ? (
              <Empty text="No hay mediciones en este periodo." />
            ) : (
              <table className="w-full border-collapse text-[0.85em]">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-600">
                    <th className="p-[0.4em] font-semibold">Fecha</th>
                    <th className="p-[0.4em] font-semibold">Indicador</th>
                    <th className="p-[0.4em] text-right font-semibold">Valor</th>
                    <th className="p-[0.4em] font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-200">
                      <td className="p-[0.4em]">{shortDate(row.measured_at)}</td>
                      <td className="p-[0.4em] font-semibold">{row.metric === "TRIGLYCERIDES" ? "Triglicéridos" : row.metric}</td>
                      <td className="p-[0.4em] text-right font-semibold">{row.value}</td>
                      <td className="p-[0.4em]">
                        <span className={`inline-block rounded-full px-[0.5em] text-[0.9em] font-semibold ${STATUS_STYLE[row.status] ?? ""}`}>{getStatusLabel(row.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Block>
        );
      case "medicinas":
        return (
          <Block key={key} id={key} title={title} index={index}>
            {data.medications.length === 0 ? (
              <Empty text="No hay medicinas registradas." />
            ) : (
              <>
                <ul className="grid gap-[0.4em]">
                  {data.medications.map((med) => (
                    <li key={med.id} className="print-avoid-break rounded-xl border border-slate-200 p-[0.5em]">
                      <p className="font-bold text-slate-900">
                        {med.name} <span className="font-semibold text-slate-600">· {med.dosage}</span>
                      </p>
                      <p className="text-[0.85em] text-slate-700">{med.schedule || "Cuando la necesita"}</p>
                      {med.instructions ? <p className="text-[0.85em] text-slate-500">{med.instructions}</p> : null}
                    </li>
                  ))}
                </ul>
                {data.adherence.total > 0 ? (
                  <p className="mt-[0.4em] text-[0.85em] text-slate-700">
                    Tomas marcadas en los últimos 30 días: <span className="font-bold">{data.adherence.taken} de {data.adherence.total}</span> ({Math.round((data.adherence.taken / data.adherence.total) * 100)}%).
                  </p>
                ) : null}
              </>
            )}
          </Block>
        );
      case "alergias":
        return (
          <Block key={key} id={key} title={title} index={index}>
            <p className="text-[0.9em] text-slate-800">
              <span className="font-semibold">Alergias registradas: </span>
              {data.allergies.length > 0 ? data.allergies.map((item) => (item.notes ? `${item.name} (${item.notes})` : item.name)).join(", ") : "Ninguna"}
            </p>
            {data.reactions.length > 0 ? (
              <ul className="mt-[0.4em] grid gap-[0.4em]">
                {data.reactions.slice(0, 20).map((reaction) => (
                  <li key={reaction.id} className="print-avoid-break rounded-xl border border-slate-200 p-[0.5em] text-[0.85em]">
                    <p className="font-bold text-slate-900">
                      {formatReactionDate(reaction.occurred_at)} · <span className={reaction.severity === "severe" ? "text-red-800" : "text-amber-800"}>{SEVERITY_LABEL[reaction.severity]}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Síntomas: </span>
                      {reaction.symptoms.join(", ")}
                    </p>
                    <p>
                      <span className="font-semibold">Posible causa: </span>
                      {reaction.causes.length > 0 ? reaction.causes.join(", ") : "Sin anotar"}
                    </p>
                    {reaction.details ? <p className="text-slate-600">{reaction.details}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-[0.3em] text-[0.85em] text-slate-500">Sin reacciones registradas.</p>
            )}
          </Block>
        );
      case "antecedentes": {
        const current = data.historyConditions.filter((item) => item.kind === "current");
        const past = data.historyConditions.filter((item) => item.kind === "past");
        return (
          <Block key={key} id={key} title={title} index={index}>
            {data.conditions.length > 0 ? (
              <p className="text-[0.9em] text-slate-800">
                <span className="font-semibold">Padece: </span>
                {data.conditions.join(", ")}
              </p>
            ) : null}
            {current.length > 0 ? (
              <div className="mt-[0.4em] text-[0.85em]">
                <p className="font-bold text-slate-900">Enfermedades actuales</p>
                <ul className="list-disc pl-[1.2em]">
                  {current.map((item) => (
                    <li key={item.name}>
                      {item.name}
                      {item.duration ? ` (${item.duration.toLowerCase()})` : ""}
                      {item.symptoms.length > 0 ? `: ${item.symptoms.join(", ")}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {past.length > 0 ? (
              <div className="mt-[0.4em] text-[0.85em]">
                <p className="font-bold text-slate-900">Enfermedades anteriores</p>
                <ul className="list-disc pl-[1.2em]">
                  {past.map((item) => (
                    <li key={item.name}>
                      {item.name}
                      {item.year ? ` (${item.year})` : ""}
                      {item.genetic ? " · de familia" : ""}
                      {item.howCured ? ` · ${item.howCured}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.exams.length > 0 ? (
              <div className="mt-[0.4em] text-[0.85em]">
                <p className="font-bold text-slate-900">Exámenes recientes</p>
                <ul className="list-disc pl-[1.2em]">
                  {data.exams.slice(0, 10).map((exam, examIndex) => (
                    <li key={`${exam.type}-${examIndex}`}>
                      {exam.type}
                      {exam.date ? ` · ${formatLongDate(exam.date)}` : ""}
                      {exam.status === "attention" ? " · alterado" : exam.status === "normal" ? " · normal" : ""}
                      {exam.result ? `: ${exam.result}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.conditions.length === 0 && data.historyConditions.length === 0 && data.exams.length === 0 ? <Empty text="Sin enfermedades ni exámenes registrados." /> : null}
          </Block>
        );
      }
      case "habitos": {
        const { week } = data;
        const tiles = [
          ...(week.waterRestricted ? [] : [["Agua", `${week.waterDays} de 7 días con la meta`]]),
          ["Sueño", week.sleepAverage !== null ? `${week.sleepAverage.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h de promedio` : "Sin registro"],
          ["Actividad", `${week.activityMinutes} min en ${week.activeDays} días`],
          ["Medicinas", week.dosesScheduled > 0 ? `${week.dosesTaken} de ${week.dosesScheduled} tomas` : "Sin tomas"]
        ];
        return (
          <Block key={key} id={key} title={`${title} (últimos 7 días)`} index={index}>
            <div className="grid grid-cols-2 gap-[0.5em] sm:grid-cols-4">
              {tiles.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-[0.5em]">
                  <p className="text-[0.8em] font-semibold text-slate-500">{label}</p>
                  <p className="text-[0.95em] font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </Block>
        );
      }
      case "preguntas":
        return (
          <Block key={key} id={key} title={title} index={index}>
            {options.notes.trim() ? (
              <p className="whitespace-pre-line rounded-xl border border-slate-200 p-[0.6em] text-[0.95em] text-slate-900">{options.notes.trim()}</p>
            ) : (
              <div className="space-y-[1.2em] pt-[0.6em]">
                {[0, 1, 2].map((line) => (
                  <div key={line} className="border-b border-dashed border-slate-400" />
                ))}
              </div>
            )}
          </Block>
        );
      case "recomendaciones":
        return (
          <Block key={key} id={key} title={title} index={index}>
            <ul className="grid gap-[0.4em] text-[0.9em] sm:grid-cols-3">
              <li className="rounded-xl bg-emerald-50 p-[0.5em]">
                <span className="font-bold">HDL:</span> {data.hdlMinimum} mg/dL o más.
              </li>
              <li className="rounded-xl bg-rose-50 p-[0.5em]">
                <span className="font-bold">LDL:</span> menos de 100 mg/dL.
              </li>
              <li className="rounded-xl bg-amber-50 p-[0.5em]">
                <span className="font-bold">Triglicéridos:</span> menos de 150 mg/dL.
              </li>
            </ul>
          </Block>
        );
    }
  };

  return (
    <article id="report-document" data-large={options.large} className="report-paper bg-white text-slate-900">
      <header className="flex flex-wrap items-start justify-between gap-[0.6em] border-b-[3px] border-rose-600 pb-[0.6em]">
        <div className="min-w-0">
          <p className="text-[0.8em] font-bold uppercase tracking-wider text-rose-700">Control de Colesterol</p>
          <h1 className="text-[1.6em] font-bold leading-tight">{options.title}</h1>
          {patient.name ? <p className="text-[1em] font-semibold text-slate-700">{patient.name}</p> : null}
        </div>
        <div className="text-right text-[0.8em] text-slate-600">
          <p>Generado el {formatLongDate(data.today)}</p>
          <p>Periodo: {periodLabel.toLowerCase()}</p>
        </div>
      </header>

      {options.sections.length === 0 ? <p className="py-[3em] text-center text-slate-500">Elige al menos una sección.</p> : options.sections.map((key, index) => render(key, index))}

      {options.signature ? (
        <div className="report-block print-avoid-break mt-[2em] grid gap-[1.5em] sm:grid-cols-2">
          <div>
            <div className="h-[2.5em] border-b border-slate-500" />
            <p className="mt-[0.2em] text-[0.8em] text-slate-600">Firma y sello del médico</p>
          </div>
          <div>
            <div className="h-[2.5em] border-b border-slate-500" />
            <p className="mt-[0.2em] text-[0.8em] text-slate-600">Próxima cita</p>
          </div>
        </div>
      ) : null}

      <p className="mt-[1.6em] border-t border-slate-200 pt-[0.5em] text-[0.7em] leading-snug text-slate-500">
        Información registrada por el paciente en la app. Es orientativa y no reemplaza la evaluación de su médico.
      </p>
    </article>
  );
}
