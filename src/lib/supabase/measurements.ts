import { SupabaseClient } from "@supabase/supabase-js";
import { LipidMetric, getLipidStatus } from "@/lib/ranges";

export interface MeasurementRow {
  id: string;
  user_id: string;
  metric: LipidMetric;
  value: number;
  unit: string;
  measured_at: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementWithStatus extends MeasurementRow {
  status: string;
}

export async function createMeasurement(
  supabase: SupabaseClient,
  {
    metric,
    value,
    measured_at
  }: {
    metric: LipidMetric;
    value: number;
    measured_at: string;
  }
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("lab_measurements")
    .insert({
      user_id: user.user.id,
      metric,
      value,
      unit: "mg/dL",
      measured_at
    })
    .select()
    .single();

  if (error) throw error;
  return data as MeasurementRow;
}

export async function getMeasurements(
  supabase: SupabaseClient,
  { metric, limit = 100 }: { metric?: LipidMetric; limit?: number } = {}
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  let query = supabase
    .from("lab_measurements")
    .select("*")
    .eq("user_id", user.user.id)
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (metric) {
    query = query.eq("metric", metric);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data as MeasurementRow[]).map((row) => ({
    ...row,
    status: getLipidStatus(row.metric, row.value)
  })) as MeasurementWithStatus[];
}

export async function getMeasurementById(
  supabase: SupabaseClient,
  id: string
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("lab_measurements")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.user.id)
    .single();

  if (error) throw error;

  return {
    ...(data as MeasurementRow),
    status: getLipidStatus(data!.metric, data!.value)
  } as MeasurementWithStatus;
}

export async function updateMeasurement(
  supabase: SupabaseClient,
  id: string,
  {
    metric,
    value,
    measured_at
  }: {
    metric?: LipidMetric;
    value?: number;
    measured_at?: string;
  }
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { data, error } = await supabase
    .from("lab_measurements")
    .update({
      ...(metric && { metric }),
      ...(value && { value }),
      ...(measured_at && { measured_at })
    })
    .eq("id", id)
    .eq("user_id", user.user.id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...(data as MeasurementRow),
    status: getLipidStatus(data!.metric, data!.value)
  } as MeasurementWithStatus;
}

export async function deleteMeasurement(
  supabase: SupabaseClient,
  id: string
) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("No authenticated user");

  const { error } = await supabase
    .from("lab_measurements")
    .delete()
    .eq("id", id)
    .eq("user_id", user.user.id);

  if (error) throw error;
}
