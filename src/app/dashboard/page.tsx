import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AvisosPanel } from "@/components/home/avisos-panel";
import { HistorialPanel } from "@/components/home/historial-panel";
import { InicioPanel } from "@/components/home/inicio-panel";
import { SectionTabs, WhenTabActive } from "@/components/shell/section-tabs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { getNextReminder, type NextReminder } from "@/lib/supabase/medications";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { loadRachaData } from "@/lib/supabase/racha";
import { buildContacts } from "@/lib/contacts";
import { todayInAppTimeZone } from "@/lib/date-utils";
import { buildRachaView, type StreakSummary } from "@/lib/racha";
import { isAlertStatus } from "@/lib/ranges";
import { HOME_TABS, normalizeTab } from "@/lib/section-tabs";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, HOME_TABS, "inicio");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  let measurements: MeasurementWithStatus[] = [];
  let nextReminder: NextReminder | null = null;
  let streak: StreakSummary | null = null;

  try {
    measurements = await getMeasurements(supabase, { limit: 50 });
  } catch (err) {
    console.error("Error loading measurements:", err);
  }

  try {
    nextReminder = await getNextReminder(supabase);
  } catch (err) {
    console.error("Error loading next reminder:", err);
  }

  try {
    const raw = await loadRachaData(supabase, data.user.id);
    streak = buildRachaView(raw, todayInAppTimeZone()).streak;
  } catch (err) {
    // Si falla, el inicio sigue funcionando sin la fila de la racha.
    console.error("Error loading streak data:", err);
  }

  const { profile } = await loadProfileForShell(supabase);
  const contacts = buildContacts(profile);

  const latestByMetric = (metric: string) => measurements.find((m) => m.metric === metric);
  const latest = [
    { label: "HDL", data: latestByMetric("HDL") },
    { label: "LDL", data: latestByMetric("LDL") },
    { label: "Triglicéridos", data: latestByMetric("TRIGLYCERIDES") }
  ];
  const latestRecorded = latest
    .map((item) => item.data)
    .filter((item): item is MeasurementWithStatus => item !== undefined);

  // Mientras la última medición de un indicador siga siendo crítica, se muestra el aviso.
  const critical = latestRecorded.filter((item) => item.status === "CRITICAL");
  const notices = latestRecorded.filter(
    (item) => item.status !== "CRITICAL" && (item.status === "LOW" || isAlertStatus(item.status))
  );

  return (
    <AppShell title="Inicio" description="¿Qué quieres hacer hoy?" userEmail={data.user.email ?? null}>
      <SectionTabs
        tabs={HOME_TABS}
        initialTab={initialTab}
        panels={{
          inicio: (
            <InicioPanel
              streak={streak}
              nextReminder={nextReminder}
              noticeCount={notices.length}
              critical={critical}
            />
          ),
          avisos: <AvisosPanel critical={critical} contacts={contacts} notices={notices} latest={latest} streak={streak} />,
          historial: (
            <WhenTabActive tab="historial">
              <HistorialPanel measurements={measurements} />
            </WhenTabActive>
          )
        }}
      />
    </AppShell>
  );
}
