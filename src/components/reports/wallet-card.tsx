"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Download, HeartPulse, Printer, RotateCw, Scissors } from "lucide-react";
import { useToast } from "@/components/antecedentes/antecedentes-ui";
import { exportPdf } from "@/components/reports/report-export";
import { printWithTarget } from "@/lib/print-utils";
import type { ReportData } from "@/lib/report-builder";

type Field = "alergias" | "enfermedades" | "emergencia" | "medicinas" | "valores" | "medico";

const FIELDS: { key: Field; label: string; side: "front" | "back" }[] = [
  { key: "alergias", label: "Alergias", side: "front" },
  { key: "enfermedades", label: "Enfermedades", side: "front" },
  { key: "emergencia", label: "Contacto de emergencia", side: "front" },
  { key: "medicinas", label: "Medicinas", side: "back" },
  { key: "valores", label: "Últimos valores", side: "back" },
  { key: "medico", label: "Mi médico", side: "back" }
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="leading-[1.25]">
      <span className="font-bold">{label}: </span>
      {children}
    </p>
  );
}

function Front({ data, show }: { data: ReportData; show: Set<Field> }) {
  const emergency = data.contacts?.emergency;
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[0.8em] border border-rose-200 bg-white text-slate-900">
      <div className="flex items-center gap-[0.4em] bg-gradient-to-r from-rose-700 to-orange-600 px-[0.8em] py-[0.45em] text-white">
        <HeartPulse className="h-[1.4em] w-[1.4em] shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[0.75em] font-bold uppercase tracking-wider">Tarjeta de salud</p>
          <p className="truncate text-[1.15em] font-bold leading-tight">{data.patient.name ?? "Mi nombre"}</p>
        </div>
      </div>
      <div className="flex-1 space-y-[0.3em] overflow-hidden px-[0.8em] py-[0.5em] text-[0.85em]">
        {show.has("alergias") ? <Row label="Alergias">{data.allergies.length > 0 ? data.allergies.map((item) => item.name).join(", ") : "Ninguna conocida"}</Row> : null}
        {show.has("enfermedades") ? <Row label="Enfermedades">{data.conditions.length > 0 ? data.conditions.join(", ") : "Ninguna registrada"}</Row> : null}
        {show.has("emergencia") ? (
          <Row label="En emergencia llamar a">
            {emergency ? `${emergency.name ?? ""}${emergency.relationship ? ` (${emergency.relationship})` : ""}${emergency.phone ? ` · ${emergency.phone}` : ""}` : "Sin contacto guardado"}
          </Row>
        ) : null}
      </div>
    </div>
  );
}

function Back({ data, show }: { data: ReportData; show: Set<Field> }) {
  const doctor = data.contacts?.doctor;
  const latest = (["LDL", "TRIGLYCERIDES", "HDL"] as const)
    .map((metric) => {
      const row = data.measurements.find((item) => item.metric === metric && item.measured_at <= data.today);
      return row ? `${metric === "TRIGLYCERIDES" ? "TG" : metric} ${row.value}` : null;
    })
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[0.8em] border border-sky-200 bg-white text-slate-900">
      <div className="flex-1 space-y-[0.3em] overflow-hidden px-[0.8em] py-[0.6em] text-[0.85em]">
        {show.has("medicinas") ? (
          <div>
            <p className="font-bold">Medicinas:</p>
            {data.medications.length > 0 ? (
              <ul className="leading-[1.25]">
                {data.medications.slice(0, 5).map((med) => (
                  <li key={med.id} className="truncate">
                    • {med.name} {med.dosage}
                    {med.schedule ? ` (${med.schedule})` : ""}
                  </li>
                ))}
                {data.medications.length > 5 ? <li>• y {data.medications.length - 5} más</li> : null}
              </ul>
            ) : (
              <p>Ninguna</p>
            )}
          </div>
        ) : null}
        {show.has("valores") && latest ? <Row label="Últimos valores (mg/dL)">{latest}</Row> : null}
        {show.has("medico") ? <Row label="Médico">{doctor ? `${doctor.name ?? ""}${doctor.phone ? ` · ${doctor.phone}` : ""}` : "Sin médico guardado"}</Row> : null}
      </div>
      <p className="bg-sky-50 px-[0.8em] py-[0.3em] text-[0.65em] text-slate-600">Actualizada el {data.today.split("-").reverse().join("/")}</p>
    </div>
  );
}

export function WalletCard({ data }: { data: ReportData }) {
  const [flipped, setFlipped] = useState(false);
  const [show, setShow] = useState<Set<Field>>(() => new Set(FIELDS.map((field) => field.key)));
  const [busy, setBusy] = useState(false);
  const { toastElement, showToast } = useToast();

  const toggle = (key: Field) => {
    setShow((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    const side = FIELDS.find((field) => field.key === key)?.side;
    setFlipped(side === "back");
  };

  const download = async () => {
    const element = document.getElementById("wallet-print");
    if (!element) return;
    setBusy(true);
    try {
      await exportPdf(element, "tarjeta-de-salud", "save");
      showToast("PDF descargado");
    } catch {
      showToast("No se pudo generar el PDF. Inténtalo de nuevo.", true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="ant-rise ab-card rounded-[1.75rem] p-4">
        <h2 className="text-xl font-bold text-ink">Tarjeta de bolsillo</h2>
        <p className="mt-1 text-base leading-6 text-muted">Llévala en tu cartera: en una emergencia dice tus alergias, medicinas y a quién llamar. Tócala para voltearla.</p>

        <button type="button" onClick={() => setFlipped(!flipped)} aria-label={flipped ? "Ver el frente de la tarjeta" : "Ver el reverso de la tarjeta"} className="wallet-flip mx-auto mt-4 block w-full max-w-[22rem]">
          <span className="wallet-inner relative block aspect-[85.6/54] w-full" data-flipped={flipped}>
            <span className="wallet-face absolute inset-0 block text-left shadow-soft [container-type:inline-size]" style={{ borderRadius: "0.8em" }}>
              <span className="block h-full" style={{ fontSize: "4.2cqw" } as CSSProperties}>
                <Front data={data} show={show} />
              </span>
            </span>
            <span className="wallet-face wallet-back absolute inset-0 block text-left shadow-soft [container-type:inline-size]">
              <span className="block h-full" style={{ fontSize: "4.2cqw" } as CSSProperties}>
                <Back data={data} show={show} />
              </span>
            </span>
          </span>
        </button>

        <button type="button" onClick={() => setFlipped(!flipped)} className="mx-auto mt-3 flex min-h-12 items-center gap-2 rounded-full bg-slate-100 px-5 py-2 text-base font-semibold text-ink transition active:scale-95">
          <RotateCw className="h-5 w-5 shrink-0" aria-hidden="true" />
          Voltear ({flipped ? "reverso" : "frente"})
        </button>
      </section>

      <section className="ant-rise ab-card rounded-[1.75rem] p-4">
        <h3 className="text-lg font-bold text-ink">¿Qué quieres que diga?</h3>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {FIELDS.map((field) => {
            const on = show.has(field.key);
            return (
              <button key={field.key} type="button" role="switch" aria-checked={on} onClick={() => toggle(field.key)} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left text-base font-semibold leading-5 text-ink transition active:scale-[0.99]">
                <span className="min-w-0">
                  {field.label}
                  <span className="block text-sm font-normal text-muted">{field.side === "front" ? "Frente" : "Reverso"}</span>
                </span>
                <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "bg-rose-600" : "bg-slate-300"}`} aria-hidden="true">
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all motion-reduce:transition-none ${on ? "left-7" : "left-1"}`} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
        <button type="button" onClick={() => printWithTarget("wallet")} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-sky-700 px-4 py-2 text-lg font-bold text-white shadow-soft transition active:scale-95">
          <Printer className="h-6 w-6 shrink-0" aria-hidden="true" />
          Imprimir
        </button>
        <button type="button" onClick={download} disabled={busy} className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-rose-700 px-4 py-2 text-lg font-bold text-white shadow-soft transition active:scale-95 disabled:opacity-60">
          <Download className="h-6 w-6 shrink-0" aria-hidden="true" />
          {busy ? "Creando…" : "PDF"}
        </button>
      </div>
      <p className="flex items-start gap-2 text-sm leading-5 text-muted">
        <Scissors className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Se imprime a tamaño de tarjeta: recórtala por la línea punteada y dóblala por la mitad.
      </p>

      {/* Hoja para imprimir o guardar en PDF, a tamaño real (fuera de la pantalla) */}
      <div id="wallet-print" className="wallet-print bg-white p-[6mm] text-slate-900">
        <p className="mb-[3mm] text-[9pt] text-slate-600">Recorta por la línea punteada y dobla por la mitad.</p>
        <div className="flex w-[171.2mm] border-[0.4mm] border-dashed border-slate-500">
          <div className="h-[54mm] w-[85.6mm] border-r-[0.4mm] border-dashed border-slate-500 p-[1mm]" style={{ fontSize: "8pt" }}>
            <Front data={data} show={show} />
          </div>
          <div className="h-[54mm] w-[85.6mm] p-[1mm]" style={{ fontSize: "8pt" }}>
            <Back data={data} show={show} />
          </div>
        </div>
      </div>
      {toastElement}
    </div>
  );
}
