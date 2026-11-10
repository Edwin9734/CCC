"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowDown, ArrowUp, Check, ClipboardCopy, Download, Eye, FileText, HeartPulse, LayoutList, MessageCircle, Printer, Share2, ShieldAlert, Stethoscope, X } from "lucide-react";
import { Hero, TextHelpers, fieldClass, useToast } from "@/components/antecedentes/antecedentes-ui";
import { ReportDocument, type ReportOptions } from "@/components/reports/report-document";
import { exportPdf } from "@/components/reports/report-export";
import { printWithTarget } from "@/lib/print-utils";
import { METRIC_LABELS, type LipidMetric } from "@/lib/ranges";
import {
  ALL_SECTIONS,
  METRICS,
  PERIODS,
  QUESTION_IDEAS,
  SECTION_LABELS,
  TEMPLATES,
  buildShareText,
  measurementsInPeriod,
  type PeriodKey,
  type ReportData,
  type ReportSectionKey,
  type TemplateKey
} from "@/lib/report-builder";
import { useDrawer } from "@/lib/use-drawer";

const TEMPLATE_ICON: Record<TemplateKey, typeof FileText> = {
  medico: Stethoscope,
  colesterol: HeartPulse,
  emergencia: AlertTriangle,
  alergias: ShieldAlert,
  completo: LayoutList
};

const NOTES_KEY = "reportes-preguntas";

function orderFor(template: TemplateKey) {
  const chosen = TEMPLATES.find((item) => item.key === template)?.sections ?? ALL_SECTIONS;
  return { order: [...chosen, ...ALL_SECTIONS.filter((key) => !chosen.includes(key))], enabled: new Set(chosen) };
}

function DocumentArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#fff" opacity="0.14" />
      <g className="pln-float">
        <rect x="28" y="16" width="64" height="86" rx="8" fill="#fff" />
        <rect x="36" y="26" width="30" height="6" rx="3" fill="#bae6fd" />
        <path className="ant-ecg" d="M36 62h10l5-12 8 22 6-14 5 4h14" fill="none" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        <path d="M36 82h48M36 90h32" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />
      </g>
      <circle className="ant-pop" cx="88" cy="88" r="15" fill="#22c55e" />
      <path d="m81 88 5 5 9-10" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Switch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 ${on ? "bg-sky-700" : "bg-slate-300"}`} aria-hidden="true">
      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-200 motion-reduce:transition-none ${on ? "left-7" : "left-1"}`} />
    </span>
  );
}

export function ShareDialog({ onClose, onPdf, onText, onCopy, busy, textLabel = "Enviar un resumen corto", textHint = "Valores, medicinas y alergias en texto", title = "Compartir el reporte" }: { onClose: () => void; onPdf: () => void; onText: () => void; onCopy: () => void; busy: boolean; textLabel?: string; textHint?: string; title?: string }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  useDrawer({ open: true, onClose, panelRef, returnFocusRef: returnRef });

  const option = "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-black/10 bg-white p-3 text-left text-base font-bold leading-5 text-ink transition active:scale-[0.98] disabled:opacity-60";
  return createPortal(
    <div onClick={onClose} className="ant-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-3">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()} className="ant-modal w-full max-w-md rounded-[2rem] bg-surface p-4 text-ink shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xl font-bold">{title}</p>
          <button type="button" onClick={onClose} data-autofocus aria-label="Cerrar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white transition active:scale-95">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="space-y-2">
          <button type="button" onClick={onPdf} disabled={busy} className={option}>
            <FileText className="h-7 w-7 shrink-0 text-sky-700" aria-hidden="true" />
            <span className="min-w-0">
              {busy ? "Preparando el PDF…" : "Enviar el PDF"}
              <span className="block text-sm font-semibold text-muted">Por WhatsApp, correo u otra app</span>
            </span>
          </button>
          <button type="button" onClick={onText} className={option}>
            <MessageCircle className="h-7 w-7 shrink-0 text-emerald-700" aria-hidden="true" />
            <span className="min-w-0">
              {textLabel}
              <span className="block text-sm font-semibold text-muted">{textHint}</span>
            </span>
          </button>
          <button type="button" onClick={onCopy} className={option}>
            <ClipboardCopy className="h-7 w-7 shrink-0 text-violet-700" aria-hidden="true" />
            <span className="min-w-0">
              Copiar el resumen
              <span className="block text-sm font-semibold text-muted">Para pegarlo donde quieras</span>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ReportBuilder({ data, initialTemplate }: { data: ReportData; initialTemplate: TemplateKey }) {
  const [template, setTemplate] = useState<TemplateKey | null>(initialTemplate);
  const [{ order, enabled }, setLayout] = useState(() => orderFor(initialTemplate));
  const [period, setPeriod] = useState<PeriodKey>("365");
  const [metrics, setMetrics] = useState<LipidMetric[]>(METRICS);
  const [large, setLarge] = useState(false);
  const [signature, setSignature] = useState(true);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("Reporte de salud");
  const [busy, setBusy] = useState<null | "pdf" | "share">(null);
  const [shareOpen, setShareOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toastElement, showToast } = useToast();

  // Las preguntas se guardan como borrador en este celular.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NOTES_KEY);
      if (saved) setNotes(saved);
    } catch {
      // Sin almacenamiento, las preguntas valen mientras la página esté abierta.
    }
  }, []);

  const changeNotes = (next: string) => {
    setNotes(next);
    try {
      window.localStorage.setItem(NOTES_KEY, next);
    } catch {
      // Ver arriba.
    }
  };

  const sections = order.filter((key) => enabled.has(key));
  const options: ReportOptions = { sections, period, metrics, large, signature, notes, title: title.trim() || "Reporte de salud" };
  const rows = measurementsInPeriod(data.measurements, period, data.today, metrics);

  const applyTemplate = (key: TemplateKey) => {
    setTemplate(key);
    setLayout(orderFor(key));
    showToast(`Plantilla «${TEMPLATES.find((item) => item.key === key)?.label}» lista`);
  };

  const toggleSection = (key: ReportSectionKey) => {
    setTemplate(null);
    setLayout(({ order: current, enabled: on }) => {
      const next = new Set(on);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { order: current, enabled: next };
    });
  };

  const move = (key: ReportSectionKey, step: number) => {
    setTemplate(null);
    setLayout(({ order: current, enabled: on }) => {
      const index = current.indexOf(key);
      // Si la sección está activa, salta las apagadas para que el cambio se note en la hoja.
      let target = index + step;
      while (on.has(key) && target >= 0 && target < current.length && !on.has(current[target])) target += step;
      if (target < 0 || target >= current.length) target = index + step;
      if (target < 0 || target >= current.length) return { order: current, enabled: on };
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return { order: next, enabled: on };
    });
  };

  const toggleMetric = (metric: LipidMetric) => setMetrics((current) => (current.includes(metric) ? (current.length > 1 ? current.filter((item) => item !== metric) : current) : METRICS.filter((item) => item === metric || current.includes(item))));

  const countOf = (key: ReportSectionKey) => {
    if (key === "tabla") return `${rows.length} mediciones`;
    if (key === "graficas") return `${metrics.length} gráficas`;
    if (key === "medicinas") return `${data.medications.length} medicinas`;
    if (key === "alergias") return `${data.allergies.length} alergias · ${data.reactions.length} reacciones`;
    if (key === "antecedentes") return `${data.conditions.length + data.historyConditions.length} enfermedades · ${data.exams.length} exámenes`;
    if (key === "preguntas") return notes.trim() ? "Con tus preguntas" : "Con líneas para escribir";
    return null;
  };

  const fileName = `reporte-salud-${data.today}`;

  const runPdf = async (mode: "save" | "share") => {
    const element = document.getElementById("report-document");
    if (!element) return;
    setBusy(mode === "save" ? "pdf" : "share");
    try {
      const result = await exportPdf(element, fileName, mode);
      showToast(result === "shared" ? "¡Reporte compartido!" : "PDF descargado");
      setShareOpen(false);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") showToast("No se pudo generar el PDF. Inténtalo de nuevo.", true);
    } finally {
      setBusy(null);
    }
  };

  const shareText = async () => {
    const text = buildShareText(data);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        setShareOpen(false);
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("Resumen copiado");
      setShareOpen(false);
    } catch {
      // Cancelado por la persona.
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(data));
      showToast("Resumen copiado. Pégalo donde quieras.");
      setShareOpen(false);
    } catch {
      showToast("No se pudo copiar.", true);
    }
  };

  const showPreview = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    previewRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const step = (number: number, label: string) => (
    <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-700 text-base text-white">{number}</span>
      {label}
    </h3>
  );

  const actionClass = "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-sm font-bold leading-4 transition active:scale-95 disabled:opacity-60 [overflow-wrap:anywhere]";

  return (
    <div className="space-y-4">
      <Hero
        tone="sky"
        art={<DocumentArt />}
        title="Mis reportes"
        text="Arma tu reporte, mira cómo queda y llévalo a tu médico."
        stats={[
          { label: "Mediciones", value: rows.length },
          { label: "Secciones", value: sections.length },
          { label: "Medicinas", value: data.medications.length }
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <section className="ant-rise ab-card rounded-[1.75rem] p-4">
            {step(1, "Elige un tipo de reporte")}
            <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
              {TEMPLATES.map((item, index) => {
                const Icon = TEMPLATE_ICON[item.key];
                const active = template === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => applyTemplate(item.key)}
                    aria-pressed={active}
                    className={`ant-pop flex min-h-[5.5rem] flex-col items-start justify-center gap-1 rounded-2xl border-2 p-3 text-left transition active:scale-95 ${active ? "border-sky-700 bg-sky-700 text-white shadow-soft" : "border-black/10 bg-white text-ink"}`}
                    style={{ "--i": index } as CSSProperties}
                  >
                    <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    <span className="text-base font-bold leading-5">{item.label}</span>
                    <span className={`text-sm leading-4 ${active ? "text-white/85" : "text-muted"}`}>{item.hint}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ant-rise ab-card rounded-[1.75rem] p-4">
            {step(2, "Periodo e indicadores")}
            <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Periodo">
              {PERIODS.map((item) => (
                <button key={item.key} type="button" onClick={() => setPeriod(item.key)} aria-pressed={period === item.key} className={`min-h-11 rounded-full border-2 px-4 py-1.5 text-base font-semibold transition active:scale-95 ${period === item.key ? "border-sky-700 bg-sky-700 text-white" : "border-black/10 bg-white text-ink"}`}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Indicadores">
              {METRICS.map((metric) => {
                const on = metrics.includes(metric);
                return (
                  <button key={metric} type="button" onClick={() => toggleMetric(metric)} aria-pressed={on} className={`flex min-h-11 items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-base font-semibold transition active:scale-95 ${on ? "border-sky-700 bg-sky-50 text-sky-950" : "border-black/10 bg-white text-muted"}`}>
                    {on ? <Check className="ant-pop h-5 w-5 shrink-0" aria-hidden="true" /> : null}
                    {METRIC_LABELS[metric].split(" (")[0]}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="ant-rise ab-card rounded-[1.75rem] p-4">
            {step(3, "Secciones y orden")}
            <p className="mt-1 text-sm leading-5 text-muted">Activa las que quieras y usa las flechas para cambiar el orden.</p>
            <ul className="mt-2 space-y-1.5">
              {order.map((key, index) => {
                const on = enabled.has(key);
                const count = countOf(key);
                return (
                  <li key={key} className={`report-row flex items-center justify-end gap-1 rounded-2xl border-2 p-1.5 transition-colors duration-200 ${on ? "border-sky-200 bg-white" : "border-transparent bg-slate-100"}`}>
                    <button type="button" role="switch" aria-checked={on} onClick={() => toggleSection(key)} className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 text-left transition active:scale-[0.99]">
                      <Switch on={on} />
                      <span className="min-w-0">
                        <span className={`block text-base font-bold leading-5 [overflow-wrap:anywhere] ${on ? "text-ink" : "text-muted"}`}>{SECTION_LABELS[key]}</span>
                        {count ? <span className="block text-sm leading-4 text-muted">{count}</span> : null}
                      </span>
                    </button>
                    <button type="button" onClick={() => move(key, -1)} disabled={index === 0} aria-label={`Subir ${SECTION_LABELS[key]}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-900 transition active:scale-90 disabled:opacity-30">
                      <ArrowUp className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(key, 1)} disabled={index === order.length - 1} aria-label={`Bajar ${SECTION_LABELS[key]}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-900 transition active:scale-90 disabled:opacity-30">
                      <ArrowDown className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ant-rise ab-card space-y-3 rounded-[1.75rem] p-4">
            {step(4, "Detalles")}
            <label className="block">
              <span className="block text-base font-bold text-ink">Título del reporte</span>
              <input type="text" value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} className={`mt-1 ${fieldClass("sky")}`} />
            </label>
            {[
              { label: "Letra grande en la hoja", on: large, set: () => setLarge(!large) },
              { label: "Espacio para la firma del médico", on: signature, set: () => setSignature(!signature) }
            ].map((item) => (
              <button key={item.label} type="button" role="switch" aria-checked={item.on} onClick={item.set} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left text-base font-semibold leading-5 text-ink transition active:scale-[0.99]">
                <span className="min-w-0">{item.label}</span>
                <Switch on={item.on} />
              </button>
            ))}
            {enabled.has("preguntas") ? (
              <div className="ant-rise">
                <label className="block">
                  <span className="block text-base font-bold text-ink">Preguntas para mi médico</span>
                  <span className="block text-sm text-muted">Se guardan en este celular para la próxima vez.</span>
                  <textarea rows={4} value={notes} maxLength={1200} onChange={(event) => changeNotes(event.target.value)} placeholder="Escribe lo que quieras preguntar" className={`mt-1 ${fieldClass("sky")}`} />
                </label>
                <TextHelpers tone="sky" options={QUESTION_IDEAS} value={notes} onPick={(next) => changeNotes(next.replace(/\. (¿)/g, "\n$1"))} />
              </div>
            ) : null}
          </section>
        </div>

        <div ref={previewRef} className="scroll-mt-24 space-y-2 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-lg font-bold text-ink">
            <Eye className="h-5 w-5 text-sky-700" aria-hidden="true" />
            Así se verá tu reporte
          </p>
          <div className="report-preview overflow-hidden rounded-2xl shadow-soft ring-1 ring-black/10">
            <ReportDocument data={data} options={options} />
          </div>
        </div>
      </div>

      <div className="no-print sticky bottom-[5.5rem] z-20 rounded-[1.5rem] border border-black/10 bg-white/95 p-1.5 shadow-soft backdrop-blur-xl">
        <div className="grid grid-cols-4 gap-1.5 lg:grid-cols-3">
          <button type="button" onClick={showPreview} className={`${actionClass} bg-slate-100 text-ink lg:hidden`}>
            <Eye className="h-6 w-6 shrink-0" aria-hidden="true" />
            Ver hoja
          </button>
          <button type="button" onClick={() => printWithTarget("report")} disabled={sections.length === 0} className={`${actionClass} bg-sky-700 text-white`}>
            <Printer className="h-6 w-6 shrink-0" aria-hidden="true" />
            Imprimir
          </button>
          <button type="button" onClick={() => runPdf("save")} disabled={busy !== null || sections.length === 0} className={`${actionClass} bg-rose-700 text-white`}>
            <Download className="h-6 w-6 shrink-0" aria-hidden="true" />
            {busy === "pdf" ? "Creando…" : "PDF"}
          </button>
          <button type="button" onClick={() => setShareOpen(true)} disabled={sections.length === 0} className={`${actionClass} bg-emerald-700 text-white`}>
            <Share2 className="h-6 w-6 shrink-0" aria-hidden="true" />
            Compartir
          </button>
        </div>
      </div>

      {shareOpen ? <ShareDialog busy={busy === "share"} onClose={() => setShareOpen(false)} onPdf={() => runPdf("share")} onText={shareText} onCopy={copyText} /> : null}
      {toastElement}
    </div>
  );
}
