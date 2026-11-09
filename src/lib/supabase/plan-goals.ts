import { SupabaseClient } from "@supabase/supabase-js";
import type { MarkKind, PlanApi, PlanGoalCheck, PlanGoalInput, PlanGoalRow, PlanMark } from "@/lib/plan-goals";
import { addActivity } from "@/lib/supabase/habits";

async function currentUserId(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("No authenticated user");
  return data.user.id;
}

export async function loadPlanGoals(supabase: SupabaseClient, userId: string, checksFrom: string) {
  const [goals, checks, marks] = await Promise.all([
    supabase.from("plan_goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.from("plan_goal_checks").select("goal_id, check_date").eq("user_id", userId).gte("check_date", checksFrom).limit(3000),
    supabase.from("plan_marks").select("kind, item_key").eq("user_id", userId).limit(1000)
  ]);

  if (goals.error) throw goals.error;
  if (checks.error) throw checks.error;
  if (marks.error) throw marks.error;

  return {
    goals: goals.data as PlanGoalRow[],
    checks: checks.data as PlanGoalCheck[],
    marks: marks.data as PlanMark[]
  };
}

export function createPlanApi(supabase: SupabaseClient): PlanApi {
  return {
    saveGoal: async (input: PlanGoalInput, id?: string) => {
      const userId = await currentUserId(supabase);
      const query = id
        ? supabase.from("plan_goals").update(input).eq("id", id).eq("user_id", userId)
        : supabase.from("plan_goals").insert({ ...input, user_id: userId });
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data as PlanGoalRow;
    },
    deleteGoal: async (id: string) => {
      const userId = await currentUserId(supabase);
      const { error } = await supabase.from("plan_goals").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    setCheck: async (goalId: string, date: string, on: boolean) => {
      const userId = await currentUserId(supabase);
      const { error } = on
        ? await supabase.from("plan_goal_checks").upsert({ goal_id: goalId, user_id: userId, check_date: date })
        : await supabase.from("plan_goal_checks").delete().eq("goal_id", goalId).eq("check_date", date).eq("user_id", userId);
      if (error) throw error;
    },
    setMark: async (kind: MarkKind, key: string, on: boolean) => {
      const userId = await currentUserId(supabase);
      const { error } = on
        ? await supabase.from("plan_marks").upsert({ user_id: userId, kind, item_key: key })
        : await supabase.from("plan_marks").delete().eq("user_id", userId).eq("kind", kind).eq("item_key", key);
      if (error) throw error;
    },
    addActivity: (input) => addActivity(supabase, { ...input, notes: input.notes ?? "" })
  };
}
