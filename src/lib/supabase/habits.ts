import { SupabaseClient } from "@supabase/supabase-js";

export type IntakeStatus = "taken" | "skipped";

export interface DailyHabitValues {
  water_glasses: number;
  sleep_hours: number | null;
}

export interface DailyHabitRow extends DailyHabitValues {
  id: string;
  user_id: string;
  habit_date: string; // "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  user_id: string;
  activity_date: string; // "YYYY-MM-DD"
  activity_type: string;
  minutes: number;
  notes: string | null;
  created_at: string;
}

export interface IntakeRow {
  id: string;
  user_id: string;
  medication_id: string;
  schedule_id: string;
  intake_date: string; // "YYYY-MM-DD"
  status: IntakeStatus;
  created_at: string;
  updated_at: string;
}

// Lee el usuario de la sesión local (sin una llamada extra a internet en cada toque).
// La seguridad real la da el RLS de la base de datos.
async function requireUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("No authenticated user");
  return id;
}

function normalizeHabit(row: DailyHabitRow): DailyHabitRow {
  return {
    ...row,
    water_glasses: Number(row.water_glasses),
    sleep_hours: row.sleep_hours === null || row.sleep_hours === undefined ? null : Number(row.sleep_hours)
  };
}

export async function getHabitsData(supabase: SupabaseClient, from: string, to: string) {
  const userId = await requireUserId(supabase);
  return getHabitsDataForUser(supabase, userId, from, to);
}

// Igual que getHabitsData, pero con el id del usuario ya verificado (para usar en el servidor).
export async function getHabitsDataForUser(supabase: SupabaseClient, userId: string, from: string, to: string) {

  const [habitsResult, activitiesResult, intakesResult] = await Promise.all([
    supabase
      .from("daily_habits")
      .select("*")
      .eq("user_id", userId)
      .gte("habit_date", from)
      .lte("habit_date", to),
    supabase
      .from("physical_activities")
      .select("*")
      .eq("user_id", userId)
      .gte("activity_date", from)
      .lte("activity_date", to)
      .order("created_at", { ascending: true }),
    supabase
      .from("medication_intakes")
      .select("*")
      .eq("user_id", userId)
      .gte("intake_date", from)
      .lte("intake_date", to)
  ]);

  if (habitsResult.error) throw habitsResult.error;
  if (activitiesResult.error) throw activitiesResult.error;
  if (intakesResult.error) throw intakesResult.error;

  return {
    habits: ((habitsResult.data ?? []) as DailyHabitRow[]).map(normalizeHabit),
    activities: ((activitiesResult.data ?? []) as ActivityRow[]).map((row) => ({
      ...row,
      minutes: Number(row.minutes)
    })),
    intakes: (intakesResult.data ?? []) as IntakeRow[]
  };
}

// Guarda agua y sueño del día (crea la fila si no existe, o la actualiza).
export async function saveDailyHabit(
  supabase: SupabaseClient,
  {
    habit_date,
    water_glasses,
    sleep_hours
  }: { habit_date: string; water_glasses: number; sleep_hours: number | null }
) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("daily_habits")
    .upsert(
      { user_id: userId, habit_date, water_glasses, sleep_hours },
      { onConflict: "user_id,habit_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return normalizeHabit(data as DailyHabitRow);
}

export async function addActivity(
  supabase: SupabaseClient,
  {
    activity_date,
    activity_type,
    minutes,
    notes
  }: { activity_date: string; activity_type: string; minutes: number; notes: string }
) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("physical_activities")
    .insert({
      user_id: userId,
      activity_date,
      activity_type,
      minutes,
      notes: notes.trim() ? notes.trim() : null
    })
    .select()
    .single();

  if (error) throw error;
  const row = data as ActivityRow;
  return { ...row, minutes: Number(row.minutes) };
}

export async function deleteActivity(supabase: SupabaseClient, id: string) {
  const userId = await requireUserId(supabase);

  const { error } = await supabase.from("physical_activities").delete().eq("id", id).eq("user_id", userId);

  if (error) throw error;
}

// Marca una toma como tomada u omitida (crea o actualiza).
export async function setIntake(
  supabase: SupabaseClient,
  {
    medication_id,
    schedule_id,
    intake_date,
    status
  }: { medication_id: string; schedule_id: string; intake_date: string; status: IntakeStatus }
) {
  const userId = await requireUserId(supabase);

  const { data, error } = await supabase
    .from("medication_intakes")
    .upsert(
      { user_id: userId, medication_id, schedule_id, intake_date, status },
      { onConflict: "schedule_id,intake_date" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as IntakeRow;
}

// Quita la marca de una toma.
export async function clearIntake(supabase: SupabaseClient, scheduleId: string, intakeDate: string) {
  const userId = await requireUserId(supabase);

  const { error } = await supabase
    .from("medication_intakes")
    .delete()
    .eq("schedule_id", scheduleId)
    .eq("intake_date", intakeDate)
    .eq("user_id", userId);

  if (error) throw error;
}