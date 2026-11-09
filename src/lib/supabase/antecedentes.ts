import { SupabaseClient } from "@supabase/supabase-js";

export type HistoryTable = "history_medicines" | "history_conditions" | "history_exams";

async function currentUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("No authenticated user");
  return data.user.id;
}

export async function listHistoryRows<Row>(supabase: SupabaseClient, table: HistoryTable) {
  const userId = await currentUserId(supabase);
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return data as Row[];
}

// Sin id crea un registro nuevo; con id cambia solo los campos que se envían.
export async function saveHistoryRow<Row>(
  supabase: SupabaseClient,
  table: HistoryTable,
  input: object,
  id?: string
) {
  const userId = await currentUserId(supabase);
  const query = id
    ? supabase.from(table).update(input).eq("id", id).eq("user_id", userId)
    : supabase.from(table).insert({ ...input, user_id: userId });

  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as Row;
}

export async function deleteHistoryRow(supabase: SupabaseClient, table: HistoryTable, id: string) {
  const userId = await currentUserId(supabase);
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
