import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { addDays, minutesNowInAppTimeZone, todayInAppTimeZone } from "@/lib/date-utils";
import { buildPayload, findDueReminders, groupReminders, type ScheduleForPush } from "@/lib/push-reminders";
import { createAdminClient, pushConfigured, sendPush, type SubscriptionRow } from "@/lib/push-server";

export const dynamic = "force-dynamic";

function isAuthorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const hash = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(hash(header), hash(`Bearer ${secret}`));
}

// El reloj de Supabase llama aquí cada minuto.
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Faltan las claves de notificaciones" }, { status: 503 });
  }

  try {
    const admin = createAdminClient();
    const today = todayInAppTimeZone();
    const yesterday = addDays(today, -1);

    const { data: subscriptionData, error: subscriptionError } = await admin.from("push_subscriptions").select("*");
    if (subscriptionError) throw subscriptionError;
    const subscriptions = subscriptionData as SubscriptionRow[];
    if (subscriptions.length === 0) return NextResponse.json({ reminders: 0, sent: 0 });

    const userIds = Array.from(new Set(subscriptions.map((item) => item.user_id)));

    const [schedules, intakes, deliveries] = await Promise.all([
      admin.from("medication_schedules").select("id, user_id, medication_id, time_of_day, repeat_days, created_at, medications(name, dosage)").in("user_id", userIds),
      admin.from("medication_intakes").select("schedule_id, intake_date").in("user_id", userIds).gte("intake_date", yesterday),
      admin.from("push_deliveries").select("schedule_id, intake_date, kind").in("user_id", userIds).gte("intake_date", yesterday)
    ]);
    if (schedules.error) throw schedules.error;
    if (intakes.error) throw intakes.error;
    if (deliveries.error) throw deliveries.error;

    const due = findDueReminders({
      schedules: schedules.data as unknown as ScheduleForPush[],
      answered: new Set(intakes.data.map((row) => `${row.schedule_id}|${row.intake_date}`)),
      delivered: new Set(deliveries.data.map((row) => `${row.schedule_id}|${row.intake_date}|${row.kind}`)),
      today,
      nowMinutes: minutesNowInAppTimeZone()
    });
    if (due.length === 0) return NextResponse.json({ reminders: 0, sent: 0 });

    // Primero se aparta cada aviso: así, si el reloj se cruza consigo mismo, no sale repetido.
    const { data: claimedData, error: claimError } = await admin
      .from("push_deliveries")
      .upsert(
        due.map((item) => ({ schedule_id: item.scheduleId, intake_date: item.date, kind: item.kind, user_id: item.userId })),
        { onConflict: "schedule_id,intake_date,kind", ignoreDuplicates: true }
      )
      .select("schedule_id, intake_date, kind");
    if (claimError) throw claimError;

    const claimed = new Set(claimedData.map((row) => `${row.schedule_id}|${row.intake_date}|${row.kind}`));
    const groups = groupReminders(due.filter((item) => claimed.has(`${item.scheduleId}|${item.date}|${item.kind}`)));

    const jobs = groups.flatMap((group) =>
      subscriptions
        .filter((item) => item.user_id === group[0].userId && (group[0].kind === "first" || item.second_reminder))
        .map(async (subscription) => ({ subscription, result: await sendPush(subscription, buildPayload(group, subscription.hide_names)) }))
    );
    const results = await Promise.all(jobs);

    const gone = results.filter((item) => item.result === "gone").map((item) => item.subscription.id);
    if (gone.length > 0) await admin.from("push_subscriptions").delete().in("id", gone);

    return NextResponse.json({ reminders: groups.length, sent: results.filter((item) => item.result === "sent").length });
  } catch (error) {
    console.error("Error al revisar los recordatorios:", error);
    return NextResponse.json({ error: "Error al revisar los recordatorios" }, { status: 500 });
  }
}
