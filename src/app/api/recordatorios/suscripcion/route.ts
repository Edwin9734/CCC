import { NextResponse } from "next/server";
import { isPushEndpoint } from "@/lib/push-reminders";
import { createAdminClient, pushConfigured } from "@/lib/push-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function currentUserId() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

const notReady = () => NextResponse.json({ error: "Faltan las claves de notificaciones" }, { status: 503 });
const unauthorized = () => NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
const invalid = () => NextResponse.json({ error: "Datos no válidos" }, { status: 400 });

// Preferencias de este celular.
export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  if (!pushConfigured()) return notReady();

  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (!isPushEndpoint(endpoint)) return invalid();

  const { data, error } = await createAdminClient()
    .from("push_subscriptions")
    .select("hide_names, second_reminder")
    .eq("endpoint", endpoint)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "No se pudo leer" }, { status: 500 });
  return NextResponse.json({ subscription: data });
}

// Registra este celular o cambia sus preferencias. Si antes era de otra cuenta, pasa a la actual.
export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  if (!pushConfigured()) return notReady();

  const body = (await request.json().catch(() => null)) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
    hide_names?: unknown;
    second_reminder?: unknown;
  } | null;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!body || !isPushEndpoint(body.endpoint) || typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) {
    return invalid();
  }

  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint: body.endpoint,
        p256dh,
        auth,
        hide_names: body.hide_names === true,
        second_reminder: body.second_reminder !== false,
        updated_at: new Date().toISOString()
      },
      { onConflict: "endpoint" }
    );
  if (error) {
    console.error("No se pudo guardar la suscripción:", error.message);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  if (!pushConfigured()) return notReady();

  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (!isPushEndpoint(body?.endpoint)) return invalid();

  const { error } = await createAdminClient().from("push_subscriptions").delete().eq("endpoint", body.endpoint).eq("user_id", userId);
  if (error) return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
