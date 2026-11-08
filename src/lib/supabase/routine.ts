import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoalMode, RoutineGoal } from "@/lib/routine-config";

export interface RoutineEntryRow {
  entry_date: string;
  item_key: string;
  amount: number;
}

async function requireUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("No authenticated user");
  return id;
}

// Si aún no se ejecutó supabase/rutina.sql, la tabla no existe.
export function isRoutineTableMissing(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "42P01" || code === "PGRST205";
}

export async function getRoutineEntries(supabase: SupabaseClient, from: string, to: string) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("routine_entries")
    .select("entry_date, item_key, amount")
    .eq("user_id", userId)
    .gte("entry_date", from)
    .lte("entry_date", to);

  if (error) throw error;
  return ((data ?? []) as RoutineEntryRow[]).map((row) => ({ ...row, amount: Number(row.amount) }));
}

// Guarda la cantidad del día. Con 0 se quita el registro.
export async function saveRoutineAmount(
  supabase: SupabaseClient,
  { entry_date, item_key, amount }: RoutineEntryRow
) {
  const userId = await requireUserId(supabase);

  if (amount <= 0) {
    const { error } = await supabase
      .from("routine_entries")
      .delete()
      .eq("user_id", userId)
      .eq("entry_date", entry_date)
      .eq("item_key", item_key);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("routine_entries")
    .upsert({ user_id: userId, entry_date, item_key, amount }, { onConflict: "user_id,entry_date,item_key" });
  if (error) throw error;
}

export async function getRoutineGoals(supabase: SupabaseClient) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("routine_goals")
    .select("id, item_key, mode, daily_limit, replacement_key, started_on")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as RoutineGoal[];
}

// Última vez que se registró un vicio antes de cierta fecha.
export async function getLastUseBefore(supabase: SupabaseClient, itemKey: string, before: string) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("routine_entries")
    .select("entry_date")
    .eq("user_id", userId)
    .eq("item_key", itemKey)
    .lt("entry_date", before)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as { entry_date: string } | null)?.entry_date ?? null;
}

export async function createRoutineGoal(
  supabase: SupabaseClient,
  goal: { item_key: string; mode: GoalMode; daily_limit: number | null; replacement_key: string | null; started_on: string }
) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("routine_goals")
    .insert({ user_id: userId, ...goal })
    .select("id, item_key, mode, daily_limit, replacement_key, started_on")
    .single();

  if (error) throw error;
  return data as RoutineGoal;
}

export async function deleteRoutineGoal(supabase: SupabaseClient, id: string) {
  const userId = await requireUserId(supabase);

  const { error } = await supabase.from("routine_goals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
