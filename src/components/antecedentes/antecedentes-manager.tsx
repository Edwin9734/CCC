"use client";

import { useMemo, useState } from "react";
import { ConditionsPanel } from "@/components/antecedentes/conditions-panel";
import { ExamsPanel } from "@/components/antecedentes/exams-panel";
import { MedicinesPanel } from "@/components/antecedentes/medicines-panel";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import type { ConditionInput, ConditionRow, ExamInput, ExamRow, MedicineInput, MedicineRow, RowStore } from "@/lib/antecedentes";
import { deleteHistoryRow, saveHistoryRow, type HistoryTable } from "@/lib/supabase/antecedentes";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ANTECEDENTES_TABS } from "@/lib/section-tabs";
import "./antecedentes.css";

function useHistoryStore<Row extends { id: string }, Input>(table: HistoryTable, initial: Row[]): RowStore<Row, Input> {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [rows, setRows] = useState(initial);

  return {
    rows,
    save: async (input, id) => {
      const saved = await saveHistoryRow<Row>(supabase, table, input as object, id);
      setRows((current) => (id ? current.map((row) => (row.id === id ? saved : row)) : [saved, ...current]));
      return saved;
    },
    // Los toques rápidos (estrella, cómo me siento) se ven al instante y se revierten si fallan.
    patch: async (id, changes) => {
      const before = rows.find((row) => row.id === id);
      setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)));
      try {
        await saveHistoryRow<Row>(supabase, table, changes as object, id);
      } catch (error) {
        if (before) setRows((current) => current.map((row) => (row.id === id ? before : row)));
        throw error;
      }
    },
    remove: async (id) => {
      await deleteHistoryRow(supabase, table, id);
      setRows((current) => current.filter((row) => row.id !== id));
    }
  };
}

export function AntecedentesManager({
  initialTab,
  medicines,
  conditions,
  exams,
  knownMedications
}: {
  initialTab: string;
  medicines: MedicineRow[];
  conditions: ConditionRow[];
  exams: ExamRow[];
  knownMedications: string[];
}) {
  const medicineStore = useHistoryStore<MedicineRow, MedicineInput>("history_medicines", medicines);
  const conditionStore = useHistoryStore<ConditionRow, ConditionInput>("history_conditions", conditions);
  const examStore = useHistoryStore<ExamRow, ExamInput>("history_exams", exams);

  return (
    <SectionTabs
      tabs={ANTECEDENTES_TABS}
      initialTab={initialTab}
      panels={{
        medicinas: (
          <WhenTabActive tab="medicinas">
            <MedicinesPanel store={medicineStore} knownMedications={knownMedications} />
          </WhenTabActive>
        ),
        enfermedades: (
          <WhenTabActive tab="enfermedades">
            <ConditionsPanel store={conditionStore} />
          </WhenTabActive>
        ),
        examenes: (
          <WhenTabActive tab="examenes">
            <ExamsPanel store={examStore} />
          </WhenTabActive>
        )
      }}
    />
  );
}
