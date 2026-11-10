"use client";

import type { ReactNode } from "react";
import "@/components/antecedentes/antecedentes.css";
import "@/components/plan/plan.css";
import "./reports.css";
import { ReportBuilder } from "@/components/reports/report-builder";
import { WalletCard } from "@/components/reports/wallet-card";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import type { ReportData, TemplateKey } from "@/lib/report-builder";
import { REPORT_TABS } from "@/lib/section-tabs";

export function ReportsBoard({ data, initialTab, initialTemplate, guidePanel }: { data: ReportData; initialTab: string; initialTemplate: TemplateKey; guidePanel: ReactNode }) {
  return (
    <SectionTabs
      tabs={REPORT_TABS}
      initialTab={initialTab}
      panels={{
        reporte: (
          <WhenTabActive tab="reporte">
            <ReportBuilder data={data} initialTemplate={initialTemplate} />
          </WhenTabActive>
        ),
        tarjeta: (
          <WhenTabActive tab="tarjeta">
            <WalletCard data={data} />
          </WhenTabActive>
        ),
        guia: guidePanel
      }}
    />
  );
}
