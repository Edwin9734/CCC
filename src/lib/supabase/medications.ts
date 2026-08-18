import { SupabaseClient } from "@supabase/supabase-js";

export interface MedicationScheduleRow {
  id: string;
  medication_id: string;
  user_id: string;
  time_of_day: string; // formato "HH:MM:SS"
  repeat_days: number[]; // 1 = lunes ... 7 = domingo
  created_at: string;
}

export interface MedicationRow {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationWithSchedules extends MedicationRow {
  medication_schedules: MedicationScheduleRow[];
}

export interface ScheduleInput {
  time_of_day: string; // "HH:MM"
  repeat_days: number[];
}

export async function createMedication(
  supabase: SupabaseClient,
  {
    name,
    dosage,
    instructions,
    schedules
  }: {
    name: string;
    dosage: string;
    instructions?: string;
    schedules: ScheduleInput[];
  }
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data: medication, error: medError } = await supabase
    .from("medications")
    .insert({
      user_id: user.user.id,
      name,
      dosage,
      instructions: instructions || null
    })
    .select()
    .single();

  if (medError) throw medError;

  if (schedules.length > 0) {
    const schedulesToInsert = schedules.map((s) => ({
      medication_id: medication.id,
      user_id: user.user!.id,
      time_of_day: s.time_of_day,
      repeat_days: s.repeat_days
    }));

    const { error: schedError } = await supabase
      .from("medication_schedules")
      .insert(schedulesToInsert);

    if (schedError) throw schedError;
  }

  return medication as MedicationRow;
}

export async function getMedications(supabase: SupabaseClient) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("medications")
    .select("*, medication_schedules(*)")
    .eq("user_id", user.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as MedicationWithSchedules[];
}

export async function deleteMedication(supabase: SupabaseClient, id: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  // Los horarios (medication_schedules) se borran solos por el ON DELETE CASCADE
  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user.id);

  if (error) throw error;
}