"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@/components/antecedentes/antecedentes.css";
import "@/components/habits/habits.css";
import "@/components/plan/plan.css";
import { useToast } from "@/components/antecedentes/antecedentes-ui";
import { CriticalAlert } from "@/components/measurements/critical-alert";
import { MeasurementEntry } from "@/components/measurements/measurement-entry";
import { MeasurementEvolution } from "@/components/measurements/measurement-evolution";
import { MeasurementHistory } from "@/components/measurements/measurement-history";
import { sortRecent, type MeasurementApi } from "@/components/measurements/measurement-ui";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import type { ContactsInfo } from "@/lib/contacts";
import type { Sex } from "@/lib/profile";
import { URGENT_CARE_TEXT, buildCriticalMessage, getLipidStatus, type CriticalMessage, type LipidMetric } from "@/lib/ranges";
import { MEASUREMENT_TABS } from "@/lib/section-tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { createMeasurement, deleteMeasurement, updateMeasurement, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { logCriticalAlert } from "@/lib/supabase/notifications";
import { useDrawer } from "@/lib/use-drawer";

function CriticalDialog({ alert, contacts, onClose }: { alert: CriticalMessage; contacts: ContactsInfo | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  useDrawer({ open: true, onClose, panelRef, returnFocusRef });

  return createPortal(
    <div className="ant-fade fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-3">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={alert.title} className="ant-modal max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl">
        <CriticalAlert
          title={alert.title}
          message={alert.message}
          contacts={contacts}
          footnote="Si te equivocaste al escribir el valor, corrígelo o bórralo en Historial."
          onDismiss={onClose}
        />
      </div>
    </div>,
    document.body
  );
}

export function MeasurementsManager({
  initialMeasurements,
  contacts,
  sex,
  today,
  initialTab,
  api: apiOverride
}: {
  initialMeasurements: MeasurementWithStatus[];
  contacts: ContactsInfo | null;
  sex: Sex | null;
  today: string;
  initialTab: string;
  api?: MeasurementApi;
}) {
  const api = useMemo<MeasurementApi>(() => {
    if (apiOverride) return apiOverride;
    const supabase = createSupabaseBrowserClient();
    return {
      create: (input) => createMeasurement(supabase, input),
      update: (id, input) => updateMeasurement(supabase, id, input),
      remove: (id) => deleteMeasurement(supabase, id),
      logCritical: (input) => logCriticalAlert(supabase, input).then(() => undefined)
    };
  }, [apiOverride]);

  const [measurements, setMeasurements] = useState(() => sortRecent(initialMeasurements));
  const [alert, setAlert] = useState<CriticalMessage | null>(null);
  const { toastElement, showToast } = useToast();

  // El aviso se muestra aunque no se pueda dejar registrado.
  const warnIfCritical = async (id: string, metric: LipidMetric, value: number, status: string) => {
    if (status !== "CRITICAL") return;
    const info = buildCriticalMessage(metric, value);
    setAlert(info);
    try {
      await api.logCritical({ title: info.title, body: `${info.message} ${URGENT_CARE_TEXT}`, relatedId: id });
    } catch (error) {
      console.error("No se pudo registrar la alerta crítica:", error);
    }
  };

  const create = async (input: { metric: LipidMetric; value: number; measured_at: string }) => {
    const row = await api.create(input);
    const value = Number(row.value);
    const saved: MeasurementWithStatus = { ...row, status: getLipidStatus(row.metric, value, sex) };
    setMeasurements((current) => sortRecent([saved, ...current]));
    void warnIfCritical(row.id, row.metric, value, saved.status);
    return saved;
  };

  const update = async (id: string, input: { value: number; measured_at: string }) => {
    const saved = await api.update(id, input);
    setMeasurements((current) => sortRecent(current.map((row) => (row.id === id ? saved : row))));
    void warnIfCritical(saved.id, saved.metric, Number(saved.value), saved.status);
  };

  const remove = async (id: string) => {
    await api.remove(id);
    setMeasurements((current) => current.filter((row) => row.id !== id));
  };

  return (
    <>
      <SectionTabs
        tabs={MEASUREMENT_TABS}
        initialTab={initialTab}
        panels={{
          registrar: (
            <WhenTabActive tab="registrar">
              <MeasurementEntry measurements={measurements} today={today} sex={sex} onCreate={create} notify={showToast} />
            </WhenTabActive>
          ),
          evolucion: (
            <WhenTabActive tab="evolucion">
              <MeasurementEvolution measurements={measurements} today={today} sex={sex} />
            </WhenTabActive>
          ),
          historial: (
            <WhenTabActive tab="historial">
              <MeasurementHistory measurements={measurements} today={today} onUpdate={update} onDelete={remove} notify={showToast} />
            </WhenTabActive>
          )
        }}
      />
      {alert ? <CriticalDialog alert={alert} contacts={contacts} onClose={() => setAlert(null)} /> : null}
      {toastElement}
    </>
  );
}
