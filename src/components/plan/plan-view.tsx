"use client";

import { useMemo, useState } from "react";
import "@/components/antecedentes/antecedentes.css";
import "@/components/habits/habits.css";
import "@/components/racha/racha.css";
import "./plan.css";
import { SAVE_ERROR, useToast } from "@/components/antecedentes/antecedentes-ui";
import { PlanAjuste } from "@/components/plan/plan-ajuste";
import { PlanConsejos } from "@/components/plan/plan-consejos";
import { PlanDieta } from "@/components/plan/plan-dieta";
import { PlanEjercicio } from "@/components/plan/plan-ejercicio";
import { PlanMetas } from "@/components/plan/plan-metas";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import { getLatestByMetric, type PlanData } from "@/lib/plan";
import type { PlanAdjustment } from "@/lib/plan-adjustment";
import type { MarkKind, NewActivity, PlanApi, PlanGoalCheck, PlanGoalInput, PlanGoalRow, PlanMark } from "@/lib/plan-goals";
import type { ProfileExtras } from "@/lib/plan-profile";
import type { LipidMetric } from "@/lib/ranges";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ActivityRow } from "@/lib/supabase/habits";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import { createPlanApi } from "@/lib/supabase/plan-goals";
import { PLAN_TABS } from "@/lib/section-tabs";

export function PlanView({
  plan,
  adjustment,
  extras,
  allergyMatches,
  initialTab,
  today,
  measurements,
  initialActivities,
  initialGoals,
  initialChecks,
  initialMarks,
  api: apiOverride
}: {
  plan: PlanData;
  adjustment: PlanAdjustment;
  extras: ProfileExtras;
  allergyMatches: Record<string, string[]>;
  initialTab: string;
  today: string;
  measurements: MeasurementWithStatus[];
  initialActivities: ActivityRow[];
  initialGoals: PlanGoalRow[];
  initialChecks: PlanGoalCheck[];
  initialMarks: PlanMark[];
  api?: PlanApi;
}) {
  const api = useMemo(() => apiOverride ?? createPlanApi(createSupabaseBrowserClient()), [apiOverride]);
  const [goals, setGoals] = useState(initialGoals);
  const [checks, setChecks] = useState(initialChecks);
  const [marks, setMarks] = useState(initialMarks);
  const [activities, setActivities] = useState(initialActivities);
  const { toastElement, showToast } = useToast();

  const latestValues = useMemo(() => {
    const latest = getLatestByMetric(measurements);
    const values: Partial<Record<LipidMetric, number>> = {};
    (Object.keys(latest) as LipidMetric[]).forEach((metric) => {
      values[metric] = Number(latest[metric]?.value);
    });
    return values;
  }, [measurements]);

  const hasMark = (kind: MarkKind, key: string) => marks.some((mark) => mark.kind === kind && mark.item_key === key);

  // Se ve al instante y se revierte si no se pudo guardar.
  const toggleMark = async (kind: MarkKind, key: string) => {
    const on = !hasMark(kind, key);
    const without = (list: PlanMark[]) => list.filter((mark) => !(mark.kind === kind && mark.item_key === key));
    setMarks((current) => (on ? [...without(current), { kind, item_key: key }] : without(current)));
    try {
      await api.setMark(kind, key, on);
    } catch {
      setMarks((current) => (on ? without(current) : [...without(current), { kind, item_key: key }]));
      showToast(SAVE_ERROR, true);
    }
  };

  const toggleCheck = async (goalId: string, date: string, on: boolean) => {
    const without = (list: PlanGoalCheck[]) => list.filter((check) => !(check.goal_id === goalId && check.check_date === date));
    setChecks((current) => (on ? [...without(current), { goal_id: goalId, check_date: date }] : without(current)));
    try {
      await api.setCheck(goalId, date, on);
    } catch (error) {
      setChecks((current) => (on ? without(current) : [...without(current), { goal_id: goalId, check_date: date }]));
      throw error;
    }
  };

  const saveGoal = async (input: PlanGoalInput, id?: string) => {
    const saved = await api.saveGoal(input, id);
    setGoals((current) => (id ? current.map((goal) => (goal.id === id ? saved : goal)) : [saved, ...current]));
  };

  const deleteGoal = async (id: string) => {
    await api.deleteGoal(id);
    setGoals((current) => current.filter((goal) => goal.id !== id));
  };

  const addActivity = async (input: NewActivity) => {
    const saved = await api.addActivity(input);
    setActivities((current) => [saved, ...current]);
  };

  return (
    <>
      <SectionTabs
        tabs={PLAN_TABS}
        initialTab={initialTab}
        panels={{
          metas: (
            <WhenTabActive tab="metas">
              <PlanMetas
                plan={plan}
                adjustment={adjustment}
                extras={extras}
                today={today}
                latestValues={latestValues}
                goals={goals}
                checks={checks}
                onSaveGoal={saveGoal}
                onDeleteGoal={deleteGoal}
                onToggleCheck={toggleCheck}
                notify={showToast}
              />
            </WhenTabActive>
          ),
          ajuste: (
            <WhenTabActive tab="ajuste">
              <PlanAjuste adjustment={adjustment} measurements={measurements} hdlMinimum={extras.hdlMinimum} today={today} hasMark={hasMark} onToggleMark={toggleMark} />
            </WhenTabActive>
          ),
          dieta: (
            <WhenTabActive tab="dieta">
              <PlanDieta
                plan={plan}
                adjustment={adjustment}
                allergyMatches={allergyMatches}
                hasMark={hasMark}
                onToggleMark={toggleMark}
                shoppingIds={marks.filter((mark) => mark.kind === "shopping").map((mark) => mark.item_key)}
                notify={showToast}
              />
            </WhenTabActive>
          ),
          ejercicio: (
            <WhenTabActive tab="ejercicio">
              <PlanEjercicio plan={plan} adjustment={adjustment} extras={extras} today={today} activities={activities} onAddActivity={addActivity} notify={showToast} />
            </WhenTabActive>
          ),
          consejos: (
            <WhenTabActive tab="consejos">
              <PlanConsejos plan={plan} areas={adjustment.compliance.areas} extras={extras} today={today} hasMark={hasMark} onToggleMark={toggleMark} />
            </WhenTabActive>
          )
        }}
      />
      {toastElement}
    </>
  );
}
