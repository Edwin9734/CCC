"use client";

import { useEffect, useMemo, useState } from "react";
import "@/components/antecedentes/antecedentes.css";
import "@/components/habits/habits.css";
import "@/components/plan/plan.css";
import { SAVE_ERROR, useToast } from "@/components/antecedentes/antecedentes-ui";
import { MedicationCabinet } from "@/components/medications/medication-cabinet";
import { MedicationCalendar } from "@/components/medications/medication-calendar";
import { MedicationToday } from "@/components/medications/medication-today";
import type { MedicationApi, MedicationSaveInput } from "@/components/medications/medication-ui";
import { SectionTabs, WhenTabActive, useSectionTabs } from "@/components/shell/section-tabs";
import { minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildDoses, type Dose } from "@/lib/habits-config";
import { MEDICATION_TABS } from "@/lib/section-tabs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearIntake, setIntake, type IntakeRow, type IntakeStatus } from "@/lib/supabase/habits";
import { createMedication, deleteMedication, getMedications, updateMedication, type MedicationWithSchedules } from "@/lib/supabase/medications";

function TodayTab(props: Omit<React.ComponentProps<typeof MedicationToday>, "goToCabinet">) {
  const tabs = useSectionTabs();
  return <MedicationToday {...props} goToCabinet={() => tabs?.setActive("botiquin")} />;
}

export function MedicationManager({
  initialMedications,
  initialIntakes,
  initialToday,
  initialMinutes,
  initialTab,
  api: apiOverride
}: {
  initialMedications: MedicationWithSchedules[];
  initialIntakes: IntakeRow[];
  initialToday: string;
  initialMinutes: number;
  initialTab: string;
  api?: MedicationApi;
}) {
  const api = useMemo<MedicationApi>(() => {
    if (apiOverride) return apiOverride;
    const supabase = createSupabaseBrowserClient();
    return {
      list: () => getMedications(supabase),
      save: async (input, id) => {
        if (id) await updateMedication(supabase, id, input);
        else await createMedication(supabase, input);
      },
      remove: (id) => deleteMedication(supabase, id),
      setIntake: (dose, date, status) => setIntake(supabase, { medication_id: dose.medicationId, schedule_id: dose.scheduleId, intake_date: date, status }),
      clearIntake: (dose, date) => clearIntake(supabase, dose.scheduleId, date)
    };
  }, [apiOverride]);

  const [medications, setMedications] = useState(initialMedications);
  const [intakes, setIntakes] = useState(initialIntakes);
  const [clock, setClock] = useState({ today: initialToday, minutes: initialMinutes });
  const { toastElement, showToast } = useToast();

  // La cuenta de la próxima toma y las tomas pendientes se actualizan solas.
  useEffect(() => {
    const tick = () => setClock({ today: todayInAppTimeZone(), minutes: minutesNowInAppTimeZone() });
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);

  const dosesFor = (date: string) => buildDoses(medications, intakes, date, clock.today, clock.minutes);

  const markDose = async (dose: Dose, date: string, status: IntakeStatus | null) => {
    const matches = (row: IntakeRow) => row.schedule_id === dose.scheduleId && row.intake_date === date;
    const previous = intakes.find(matches);
    const without = (list: IntakeRow[]) => list.filter((row) => !matches(row));

    // Se ve al instante y se revierte si no se pudo guardar.
    if (status) {
      const draft = { id: previous?.id ?? `tmp-${dose.scheduleId}`, user_id: "", medication_id: dose.medicationId, schedule_id: dose.scheduleId, intake_date: date, status, created_at: "", updated_at: "" } as IntakeRow;
      setIntakes((current) => [...without(current), draft]);
    } else {
      setIntakes(without);
    }

    try {
      if (status) {
        const saved = await api.setIntake(dose, date, status);
        setIntakes((current) => [...without(current), saved]);
        if (status === "taken") showToast("¡Muy bien!");
      } else {
        await api.clearIntake(dose, date);
      }
    } catch {
      setIntakes((current) => (previous ? [...without(current), previous] : without(current)));
      showToast(SAVE_ERROR, true);
    }
  };

  const save = async (input: MedicationSaveInput, id?: string) => {
    await api.save(input, id);
    setMedications(await api.list());
  };

  const remove = async (id: string) => {
    await api.remove(id);
    setMedications((current) => current.filter((med) => med.id !== id));
  };

  return (
    <>
      <SectionTabs
        tabs={MEDICATION_TABS}
        initialTab={initialTab}
        panels={{
          hoy: (
            <WhenTabActive tab="hoy">
              <TodayTab medications={medications} doses={dosesFor(clock.today)} nowMinutes={clock.minutes} onMark={(dose, status) => markDose(dose, clock.today, status)} />
            </WhenTabActive>
          ),
          botiquin: (
            <WhenTabActive tab="botiquin">
              <MedicationCabinet medications={medications} today={clock.today} dosesFor={dosesFor} onSave={save} onDelete={remove} notify={showToast} />
            </WhenTabActive>
          ),
          calendario: (
            <WhenTabActive tab="calendario">
              <MedicationCalendar medications={medications} today={clock.today} dosesFor={dosesFor} onMark={markDose} />
            </WhenTabActive>
          )
        }}
      />
      {toastElement}
    </>
  );
}
