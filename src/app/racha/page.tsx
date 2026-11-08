import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { RachaManager } from "@/components/racha/racha-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMeasurements, type MeasurementWithStatus } from "@/lib/supabase/measurements";
import { loadProfileForShell } from "@/lib/supabase/profile";
import { loadRachaData } from "@/lib/supabase/racha";
import { todayInAppTimeZone } from "@/lib/date-utils";
import { buildProfileExtras } from "@/lib/plan-profile";
import { buildRachaView, type RachaView } from "@/lib/racha";
import { RACHA_TABS, normalizeTab } from "@/lib/section-tabs";
import type { Sex } from "@/lib/profile";

export default async function RachaPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab } = await searchParams;
  const initialTab = normalizeTab(tab, RACHA_TABS, "racha");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  let view: RachaView | null = null;
  let measurements: MeasurementWithStatus[] = [];
  let waterRestricted = false;
  let sex: Sex | null = null;
  let failed = false;

  if (data.user) {
    try {
      const [raw, latestMeasurements, shell] = await Promise.all([
        loadRachaData(supabase, data.user.id),
        getMeasurements(supabase, { limit: 50 }),
        loadProfileForShell(supabase)
      ]);

      view = buildRachaView(raw, todayInAppTimeZone());
      measurements = latestMeasurements;
      waterRestricted = buildProfileExtras(shell.profile, shell.conditions).waterRestricted;
      sex = shell.profile?.sex ?? null;
    } catch (err) {
      // Sin todos los datos la racha saldría más corta de lo real, así que mejor avisar.
      console.error("Error loading streak data:", err);
      failed = true;
    }
  }

  return (
    <AppShell
      title="Racha"
      description="Mira tus días seguidos con registros, tus logros y cómo va tu semana."
      userEmail={data.user?.email ?? null}
    >
      {!data.user ? (
        <SectionCard title="Inicia sesión" description="Necesitas una sesión activa para ver tu racha.">
          <Link
            href="/login"
            className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft"
          >
            Ir a iniciar sesión
          </Link>
        </SectionCard>
      ) : view && !failed ? (
        <RachaManager
          view={view}
          measurements={measurements}
          waterRestricted={waterRestricted}
          sex={sex}
          initialTab={initialTab}
        />
      ) : (
        <SectionCard title="No se pudo cargar tu racha" description="Revisa tu conexión e inténtalo de nuevo.">
          <Link
            href="/racha"
            className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft"
          >
            Volver a intentar
          </Link>
        </SectionCard>
      )}
    </AppShell>
  );
}
