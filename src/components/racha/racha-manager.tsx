"use client";

import { EstadisticaPanel } from "@/components/racha/estadistica-panel";
import { LogrosPanel } from "@/components/racha/logros-panel";
import { RachaPanel } from "@/components/racha/racha-panel";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import { RACHA_TABS } from "@/lib/section-tabs";
import type { RachaView } from "@/lib/racha";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import type { Sex } from "@/lib/profile";
import "./racha.css";

export function RachaManager({
  view,
  measurements,
  waterRestricted,
  sex,
  initialTab
}: {
  view: RachaView;
  measurements: MeasurementWithStatus[];
  waterRestricted: boolean;
  sex: Sex | null;
  initialTab: string;
}) {
  return (
    <SectionTabs
      tabs={RACHA_TABS}
      initialTab={initialTab}
      panels={{
        racha: (
          <WhenTabActive tab="racha">
            <RachaPanel view={view} waterRestricted={waterRestricted} />
          </WhenTabActive>
        ),
        logros: (
          <WhenTabActive tab="logros">
            <LogrosPanel view={view} />
          </WhenTabActive>
        ),
        estadistica: (
          <WhenTabActive tab="estadistica">
            <EstadisticaPanel view={view} measurements={measurements} sex={sex} waterRestricted={waterRestricted} />
          </WhenTabActive>
        )
      }}
    />
  );
}
