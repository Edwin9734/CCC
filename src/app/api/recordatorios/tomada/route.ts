import { NextResponse } from "next/server";
import { setIntake } from "@/lib/supabase/habits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface DoseInput {
  scheduleId?: unknown;
  medicationId?: unknown;
  date?: unknown;
}

const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// El botón «Ya la tomé» del aviso. Usa la sesión de la persona, con sus mismos permisos.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { doses?: DoseInput[] } | null;
  const doses = Array.isArray(body?.doses) ? body.doses.slice(0, 20) : [];
  const valid = doses.filter(
    (dose): dose is { scheduleId: string; medicationId: string; date: string } =>
      typeof dose.scheduleId === "string" && UUID.test(dose.scheduleId) && typeof dose.medicationId === "string" && UUID.test(dose.medicationId) && typeof dose.date === "string" && DATE.test(dose.date)
  );
  if (valid.length === 0) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });

  try {
    await Promise.all(valid.map((dose) => setIntake(supabase, { medication_id: dose.medicationId, schedule_id: dose.scheduleId, intake_date: dose.date, status: "taken" })));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("No se pudo marcar la toma:", error);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
}
