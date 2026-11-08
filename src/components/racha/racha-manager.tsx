"use client";

import type { ReactNode } from "react";
import { EstadisticaPanel } from "@/components/racha/estadistica-panel";
import { LogrosPanel } from "@/components/racha/logros-panel";
import { RachaPanel } from "@/components/racha/racha-panel";
import { SectionTabs, useSectionTabs } from "@/components/shell/section-tabs";
import { RACHA_TABS } from "@/lib/section-tabs";
import type { RachaView } from "@/lib/racha";
import type { MeasurementWithStatus } from "@/lib/supabase/measurements";
import type { Sex } from "@/lib/profile";
import "./racha.css";

// Cada pestaña se monta solo cuando está abierta, para que sus animaciones
// empiecen de nuevo cada vez que se abre (y las gráficas midan bien su ancho).
function WhenActive({ tab, children }: { tab: string; children: ReactNode }) {
  return useSectionTabs()?.active === tab ? <>{children}</> : null;
}

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
          <WhenActive tab="racha">
            <RachaPanel view={view} waterRestricted={waterRestricted} />
          </WhenActive>
        ),
        logros: (
          <WhenActive tab="logros">
            <LogrosPanel view={view} />
          </WhenActive>
        ),
        estadistica: (
          <WhenActive tab="estadistica">
            <EstadisticaPanel view={view} measurements={measurements} sex={sex} />
          </WhenActive>
        )
      }}
    />
  );
}
