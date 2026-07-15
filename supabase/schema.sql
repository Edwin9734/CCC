create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  birth_date date,
  sex text check (sex in ('male', 'female', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create table if not exists public.reference_ranges (
  id uuid primary key default gen_random_uuid(),
  metric text not null check (metric in ('HDL', 'LDL', 'TRIGLYCERIDES')),
  sex text check (sex in ('male', 'female', 'other')),
  age_min int,
  age_max int,
  low_max numeric(10,2),
  normal_min numeric(10,2),
  normal_max numeric(10,2),
  high_min numeric(10,2),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lab_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (metric in ('HDL', 'LDL', 'TRIGLYCERIDES')),
  value numeric(10,2) not null check (value > 0),
  unit text not null default 'mg/dL',
  measured_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_lab_measurements_updated_at on public.lab_measurements;
create trigger trg_lab_measurements_updated_at
before update on public.lab_measurements
for each row execute function public.set_updated_at();

create index if not exists idx_lab_measurements_user_metric_date
on public.lab_measurements (user_id, metric, measured_at desc);

create table if not exists public.medical_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  condition_name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_medical_history_user
on public.medical_history (user_id);

create table if not exists public.allergies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  allergy_name text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_allergies_user
on public.allergies (user_id);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dosage text not null,
  instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_medications_updated_at on public.medications;
create trigger trg_medications_updated_at
before update on public.medications
for each row execute function public.set_updated_at();

create index if not exists idx_medications_user
on public.medications (user_id);

create table if not exists public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  time_of_day time not null,
  repeat_days int[] not null default '{1,2,3,4,5,6,7}',
  created_at timestamptz not null default now()
);

create index if not exists idx_medication_schedules_user
on public.medication_schedules (user_id);

create table if not exists public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('PUSH', 'EMAIL', 'OUT_OF_RANGE', 'MEDICATION_REMINDER')),
  title text not null,
  body text not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'SENT', 'FAILED')),
  related_table text,
  related_id uuid,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_notifications_user
on public.notifications_log (user_id);

create or replace view public.v_lab_measurements_with_status as
select
  lm.*,
  case
    when lm.metric = 'HDL' and lm.value < 40 then 'LOW'
    when lm.metric = 'HDL' and lm.value between 40 and 59 then 'NORMAL'
    when lm.metric = 'HDL' and lm.value >= 60 then 'HIGH'
    when lm.metric = 'LDL' and lm.value < 100 then 'NORMAL'
    when lm.metric = 'LDL' and lm.value between 100 and 129 then 'BORDERLINE'
    when lm.metric = 'LDL' and lm.value between 130 and 159 then 'HIGH'
    when lm.metric = 'LDL' and lm.value >= 160 then 'VERY_HIGH'
    when lm.metric = 'TRIGLYCERIDES' and lm.value < 150 then 'NORMAL'
    when lm.metric = 'TRIGLYCERIDES' and lm.value between 150 and 199 then 'BORDERLINE'
    when lm.metric = 'TRIGLYCERIDES' and lm.value between 200 and 499 then 'HIGH'
    when lm.metric = 'TRIGLYCERIDES' and lm.value >= 500 then 'VERY_HIGH'
    else 'UNKNOWN'
  end as status
from public.lab_measurements lm;

insert into public.reference_ranges
  (metric, sex, age_min, age_max, low_max, normal_min, normal_max, high_min, notes)
values
  ('HDL', null, null, null, 39, 40, 59, 60, 'Base general: HDL bajo <40, normal 40-59, alto protector >=60'),
  ('LDL', null, null, null, null, null, 99, 100, 'Base general: LDL óptimo <100, alto desde 100'),
  ('TRIGLYCERIDES', null, null, null, null, null, 149, 150, 'Base general: triglicéridos normales <150, altos desde 150')
on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.reference_ranges enable row level security;
alter table public.lab_measurements enable row level security;
alter table public.medical_history enable row level security;
alter table public.allergies enable row level security;
alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.notifications_log enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "reference_ranges_select_authenticated" on public.reference_ranges;
create policy "reference_ranges_select_authenticated"
on public.reference_ranges for select
using (auth.role() = 'authenticated');

drop policy if exists "lab_select_own" on public.lab_measurements;
create policy "lab_select_own"
on public.lab_measurements for select
using (user_id = auth.uid());

drop policy if exists "lab_insert_own" on public.lab_measurements;
create policy "lab_insert_own"
on public.lab_measurements for insert
with check (user_id = auth.uid());

drop policy if exists "lab_update_own" on public.lab_measurements;
create policy "lab_update_own"
on public.lab_measurements for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "lab_delete_own" on public.lab_measurements;
create policy "lab_delete_own"
on public.lab_measurements for delete
using (user_id = auth.uid());

drop policy if exists "history_select_own" on public.medical_history;
create policy "history_select_own"
on public.medical_history for select
using (user_id = auth.uid());

drop policy if exists "history_insert_own" on public.medical_history;
create policy "history_insert_own"
on public.medical_history for insert
with check (user_id = auth.uid());

drop policy if exists "history_update_own" on public.medical_history;
create policy "history_update_own"
on public.medical_history for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "history_delete_own" on public.medical_history;
create policy "history_delete_own"
on public.medical_history for delete
using (user_id = auth.uid());

drop policy if exists "allergies_select_own" on public.allergies;
create policy "allergies_select_own"
on public.allergies for select
using (user_id = auth.uid());

drop policy if exists "allergies_insert_own" on public.allergies;
create policy "allergies_insert_own"
on public.allergies for insert
with check (user_id = auth.uid());

drop policy if exists "allergies_update_own" on public.allergies;
create policy "allergies_update_own"
on public.allergies for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "allergies_delete_own" on public.allergies;
create policy "allergies_delete_own"
on public.allergies for delete
using (user_id = auth.uid());

drop policy if exists "medications_select_own" on public.medications;
create policy "medications_select_own"
on public.medications for select
using (user_id = auth.uid());

drop policy if exists "medications_insert_own" on public.medications;
create policy "medications_insert_own"
on public.medications for insert
with check (user_id = auth.uid());

drop policy if exists "medications_update_own" on public.medications;
create policy "medications_update_own"
on public.medications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "medications_delete_own" on public.medications;
create policy "medications_delete_own"
on public.medications for delete
using (user_id = auth.uid());

drop policy if exists "schedules_select_own" on public.medication_schedules;
create policy "schedules_select_own"
on public.medication_schedules for select
using (user_id = auth.uid());

drop policy if exists "schedules_insert_own" on public.medication_schedules;
create policy "schedules_insert_own"
on public.medication_schedules for insert
with check (user_id = auth.uid());

drop policy if exists "schedules_update_own" on public.medication_schedules;
create policy "schedules_update_own"
on public.medication_schedules for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "schedules_delete_own" on public.medication_schedules;
create policy "schedules_delete_own"
on public.medication_schedules for delete
using (user_id = auth.uid());

drop policy if exists "notifications_select_own" on public.notifications_log;
create policy "notifications_select_own"
on public.notifications_log for select
using (user_id = auth.uid());

drop policy if exists "notifications_insert_own" on public.notifications_log;
create policy "notifications_insert_own"
on public.notifications_log for insert
with check (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications_log;
create policy "notifications_update_own"
on public.notifications_log for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications_log;
create policy "notifications_delete_own"
on public.notifications_log for delete
using (user_id = auth.uid());