import { SupabaseClient } from "@supabase/supabase-js";

export interface AllergyRow {
  id: string;
  user_id: string;
  allergy_name: string;
  notes: string | null;
  created_at: string;
}

export async function createAllergy(
  supabase: SupabaseClient,
  { allergy_name, notes }: { allergy_name: string; notes?: string }
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("allergies")
    .insert({
      user_id: user.user.id,
      allergy_name,
      notes: notes || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as AllergyRow;
}

export async function getAllergies(supabase: SupabaseClient) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("allergies")
    .select("*")
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as AllergyRow[];
}

export async function deleteAllergy(supabase: SupabaseClient, id: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("allergies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user.id);

  if (error) throw error;
}