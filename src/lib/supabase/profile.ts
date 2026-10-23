import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanName, normalizeName } from "@/lib/health-conditions";
import type { ProfileData, Sex } from "@/lib/profile";

function textOf(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberOf(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

function sexOf(value: unknown): Sex | null {
  return value === "female" || value === "male" || value === "other" ? value : null;
}

export function rowToProfile(row: Record<string, unknown> | null): ProfileData | null {
  if (!row) return null;

  return {
    first_name: textOf(row.first_name),
    last_name: textOf(row.last_name),
    birth_date: textOf(row.birth_date),
    sex: sexOf(row.sex),
    weight_lb: numberOf(row.weight_lb),
    height_cm: numberOf(row.height_cm),
    doctor_name: textOf(row.doctor_name),
    doctor_phone: textOf(row.doctor_phone),
    emergency_contact_name: textOf(row.emergency_contact_name),
    emergency_contact_relationship: textOf(row.emergency_contact_relationship),
    emergency_contact_phone: textOf(row.emergency_contact_phone)
  };
}

// Para el servidor: carga el perfil y las enfermedades de la persona con sesión.
// La seguridad la da el RLS de la base de datos (cada persona solo ve sus filas).
// Si algo falla (por ejemplo, si aún no se ejecutó el SQL), la app sigue funcionando sin perfil.
export async function loadProfileForShell(
  supabase: SupabaseClient
): Promise<{ profile: ProfileData | null; conditions: string[] }> {
  try {
    const [profileResult, historyResult] = await Promise.all([
      supabase.from("profiles").select("*").maybeSingle(),
      supabase.from("medical_history").select("condition_name").order("created_at", { ascending: true })
    ]);

    if (profileResult.error) console.error("Error loading profile:", profileResult.error);
    if (historyResult.error) console.error("Error loading medical history:", historyResult.error);

    const profile = rowToProfile((profileResult.data as Record<string, unknown> | null) ?? null);
    const conditions = ((historyResult.data ?? []) as { condition_name: string }[]).map(
      (row) => row.condition_name
    );

    return { profile, conditions };
  } catch (err) {
    console.error("Error loading profile data:", err);
    return { profile: null, conditions: [] };
  }
}

async function requireUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("No authenticated user");
  return id;
}

// Deja en medical_history exactamente las enfermedades indicadas:
// agrega las que faltan y quita las que ya no están.
async function syncConditions(supabase: SupabaseClient, userId: string, names: string[]) {
  const desired = new Map<string, string>();
  for (const raw of names) {
    const name = cleanName(raw);
    if (!name) continue;
    const key = normalizeName(name);
    if (!desired.has(key)) desired.set(key, name);
  }

  const { data, error } = await supabase
    .from("medical_history")
    .select("id, condition_name")
    .eq("user_id", userId);
  if (error) throw error;

  const toDelete: string[] = [];
  const kept = new Set<string>();
  for (const row of (data ?? []) as { id: string; condition_name: string }[]) {
    const key = normalizeName(row.condition_name);
    if (!desired.has(key) || kept.has(key)) toDelete.push(row.id);
    else kept.add(key);
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("medical_history")
      .delete()
      .in("id", toDelete)
      .eq("user_id", userId);
    if (deleteError) throw deleteError;
  }

  const rows = Array.from(desired.entries())
    .filter(([key]) => !kept.has(key))
    .map(([, name]) => ({ user_id: userId, condition_name: name }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("medical_history").insert(rows);
    if (insertError) throw insertError;
  }
}

// Guarda los datos personales y luego las enfermedades.
// Si falla lo primero, lanza el error. Si solo fallan las enfermedades, lo avisa en conditionsError.
export async function saveProfileAndConditions(
  supabase: SupabaseClient,
  profile: ProfileData,
  conditionNames: string[]
): Promise<{ conditionsError: string | null }> {
  const userId = await requireUserId(supabase);

  const { error } = await supabase.from("profiles").upsert({ id: userId, ...profile }, { onConflict: "id" });
  if (error) throw error;

  try {
    await syncConditions(supabase, userId, conditionNames);
    return { conditionsError: null };
  } catch (err) {
    console.error("Error al guardar las enfermedades:", err);
    return { conditionsError: "Se guardaron tus datos personales, pero no las enfermedades. Inténtalo de nuevo." };
  }
}