// Solo para las rutas del servidor: usa claves secretas.
import { createClient } from "@supabase/supabase-js";
import { sendNotification } from "web-push";
import type { PushPayload } from "@/lib/push-reminders";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  hide_names: boolean;
  second_reminder: boolean;
}

export function pushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function sendPush(subscription: SubscriptionRow, payload: PushPayload): Promise<"sent" | "gone" | "failed"> {
  try {
    await sendNotification(
      { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
      JSON.stringify(payload),
      {
        TTL: 1800, // si el celular está sin internet, el aviso espera hasta 30 minutos
        urgency: "high",
        vapidDetails: {
          subject: "https://ccc-zeta-six.vercel.app",
          publicKey: process.env.VAPID_PUBLIC_KEY!,
          privateKey: process.env.VAPID_PRIVATE_KEY!
        }
      }
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone"; // ese celular ya no acepta avisos
    console.error("No se pudo enviar el recordatorio:", status);
    return "failed";
  }
}
