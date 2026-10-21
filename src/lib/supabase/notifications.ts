import { SupabaseClient } from "@supabase/supabase-js";

// Deja registrada la alerta crítica en notifications_log (queda como PENDING,
// lista para enviarse cuando se activen las notificaciones push).
export async function logCriticalAlert(
  supabase: SupabaseClient,
  { title, body, relatedId }: { title: string; body: string; relatedId: string }
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { error } = await supabase.from("notifications_log").insert({
    user_id: user.user.id,
    type: "OUT_OF_RANGE",
    title,
    body,
    status: "PENDING",
    related_table: "lab_measurements",
    related_id: relatedId
  });

  if (error) throw error;
}