import { SupabaseClient } from "@supabase/supabase-js";

export interface MedicationScheduleRow {
  id: string;
  medication_id: string;
  user_id: string;
  time_of_day: string;
  repeat_days: number[];
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
  time_of_day: string;
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

  const { error } = await supabase
    .from("medications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user.id);

  if (error) throw error;
}

export interface NextReminder {
  time: string; // "HH:MM"
  medicationName: string;
  dayOffset: number; // 0 = hoy, 1 = mañana, 2+ = en X días
}

export async function getNextReminder(supabase: SupabaseClient): Promise<NextReminder | null> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from("medication_schedules")
    .select("time_of_day, repeat_days, medications(name)")
    .eq("user_id", user.user.id);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1 = lunes ... 7 = domingo
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let best: { totalMinutes: number; time: string; medicationName: string; dayOffset: number } | null = null;

  for (const schedule of data as any[]) {
    const [h, m] = schedule.time_of_day.split(":").map(Number);
    const scheduleMinutes = h * 60 + m;
    const medicationName = schedule.medications?.name ?? "Medicamento";

    for (const day of schedule.repeat_days as number[]) {
      let dayOffset = (day - currentDay + 7) % 7;
      if (dayOffset === 0 && scheduleMinutes <= currentMinutes) {
        dayOffset = 7; // ya pasó hoy, la próxima es en una semana
      }
      const totalMinutes = dayOffset * 24 * 60 + scheduleMinutes;

      if (!best || totalMinutes < best.totalMinutes) {
        best = { totalMinutes, time: schedule.time_of_day.slice(0, 5), medicationName, dayOffset };
      }
    }
  }

  return best;
}