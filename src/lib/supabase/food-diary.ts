import { SupabaseClient } from "@supabase/supabase-js";

export type DiaryMealType = "desayuno" | "colacion" | "almuerzo" | "cena";

export interface FoodDiaryRow {
  id: string;
  user_id: string;
  eaten_on: string; // "YYYY-MM-DD"
  meal_type: DiaryMealType;
  food_ids: string[];
  notes: string | null;
  created_at: string;
}

export async function createDiaryEntry(
  supabase: SupabaseClient,
  {
    eaten_on,
    meal_type,
    food_ids,
    notes
  }: {
    eaten_on: string;
    meal_type: DiaryMealType;
    food_ids: string[];
    notes?: string;
  }
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("food_diary_entries")
    .insert({
      user_id: user.user.id,
      eaten_on,
      meal_type,
      food_ids,
      notes: notes?.trim() ? notes.trim() : null
    })
    .select()
    .single();

  if (error) throw error;
  return data as FoodDiaryRow;
}

export async function getDiaryEntries(supabase: SupabaseClient, limit = 200) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("food_diary_entries")
    .select("*")
    .eq("user_id", user.user.id)
    .order("eaten_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as FoodDiaryRow[];
}

export async function deleteDiaryEntry(supabase: SupabaseClient, id: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("food_diary_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user.id);

  if (error) throw error;
}