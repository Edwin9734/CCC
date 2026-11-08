import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RachaActivityRow,
  RachaHabitRow,
  RachaMealRow,
  RachaMeasurementRow,
  RachaRawData
} from "@/lib/racha";

const PAGE_SIZE = 1000;

// Supabase devuelve como máximo 1000 filas por consulta. La racha y las medallas
// necesitan todo el historial, así que se pide por páginas hasta terminar.
async function fetchAllRows<T>(
  supabase: SupabaseClient,
  { table, columns, userId, orderBy }: { table: string; columns: string; userId: string; orderBy: string }
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .eq("user_id", userId)
      .order(orderBy, { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function loadRachaData(supabase: SupabaseClient, userId: string): Promise<RachaRawData> {
  const [habits, meals, activities, measurements] = await Promise.all([
    fetchAllRows<RachaHabitRow>(supabase, {
      table: "daily_habits",
      columns: "habit_date, water_glasses, sleep_hours",
      userId,
      orderBy: "habit_date"
    }),
    fetchAllRows<RachaMealRow>(supabase, {
      table: "food_diary_entries",
      columns: "eaten_on, meal_type, food_ids",
      userId,
      orderBy: "eaten_on"
    }),
    fetchAllRows<RachaActivityRow>(supabase, {
      table: "physical_activities",
      columns: "activity_date, minutes",
      userId,
      orderBy: "activity_date"
    }),
    fetchAllRows<RachaMeasurementRow>(supabase, {
      table: "lab_measurements",
      columns: "measured_at",
      userId,
      orderBy: "measured_at"
    })
  ]);

  return {
    habits: habits.map((row) => ({
      ...row,
      water_glasses: Number(row.water_glasses),
      sleep_hours: row.sleep_hours === null || row.sleep_hours === undefined ? null : Number(row.sleep_hours)
    })),
    meals,
    activities: activities.map((row) => ({ ...row, minutes: Number(row.minutes) })),
    measurements
  };
}
