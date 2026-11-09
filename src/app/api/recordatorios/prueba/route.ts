import { NextResponse } from "next/server";
import { isPushEndpoint } from "@/lib/push-reminders";
import { createAdminClient, pushConfigured, sendPush, type SubscriptionRow } from "@/lib/push-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Envía un aviso de prueba solo a este celular.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  if (!pushConfigured()) return NextResponse.json({ error: "Faltan las claves de notificaciones" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (!isPushEndpoint(body?.endpoint)) return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });

  const { data, error } = await createAdminClient()
    .from("push_subscriptions")
    .select("*")
    .eq("endpoint", body.endpoint)
    .eq("user_id", user.user.id)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Este celular no está registrado" }, { status: 404 });

  const result = await sendPush(data as SubscriptionRow, {
    title: "¡Recordatorios activados!",
    body: "Así te avisaremos cuando sea hora de tu medicina.",
    tag: "prueba",
    url: "/medicamentos?tab=hoy",
    doses: []
  });
  return NextResponse.json({ result }, { status: result === "sent" ? 200 : 502 });
}
