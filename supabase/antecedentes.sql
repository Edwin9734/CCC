-- MÓDULO ANTECEDENTES (medicinas, enfermedades y exámenes)
-- Ejecuta este archivo una sola vez en el editor SQL de Supabase, después de schema.sql.
-- Para deshacerlo, usa antecedentes-deshacer.sql.

-- ---------- Medicinas, medicinas naturales y remedios caseros ----------
create table if not exists public.history_medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('medicine', 'natural', 'remedy')),
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'past' check (status in ('current', 'past')),
  purpose text check (purpose is null or char_length(purpose) <= 200),
  help_level smallint check (help_level is null or help_level between 1 and 3),
  is_best boolean not null default false,
  has_side_effects boolean,
  side_effects text[] not null default '{}' check (cardinality(side_effects) <= 40),
  side_effect_notes text check (side_effect_notes is null or char_length(side_effect_notes) <= 500),
  ingredients text[] not null default '{}' check (cardinality(ingredients) <= 40),
  preparation text check (preparation is null or char_length(preparation) <= 1500),
  application text check (application is null or char_length(application) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_history_medicines_user
on public.history_medicines (user_id, created_at desc);

-- ---------- Enfermedades actuales y anteriores ----------
-- duration_as_of guarda el día en que se anotó el tiempo, para que en las enfermedades
-- actuales la app pueda seguir sumando sin que haya que corregirlo cada año.
create table if not exists public.history_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('current', 'past')),
  name text not null check (char_length(name) between 1 and 120),
  symptoms text[] not null default '{}' check (cardinality(symptoms) <= 40),
  affected_areas text[] not null default '{}' check (cardinality(affected_areas) <= 40),
  affected_notes text check (affected_notes is null or char_length(affected_notes) <= 500),
  duration_value integer check (duration_value is null or duration_value between 1 and 5000),
  duration_unit text check (duration_unit is null or duration_unit in ('days', 'weeks', 'months', 'years')),
  duration_as_of date,
  trend text check (trend is null or trend in ('better', 'same', 'worse')),
  how_cured text check (how_cured is null or char_length(how_cured) <= 1000),
  causes text[] not null default '{}' check (cardinality(causes) <= 40),
  cause_notes text check (cause_notes is null or char_length(cause_notes) <= 500),
  ended_year integer check (ended_year is null or ended_year between 1900 and 2100),
  created_at timestamptz not null default now(),
  check ((duration_value is null) = (duration_unit is null))
);

create index if not exists idx_history_conditions_user
on public.history_conditions (user_id, created_at desc);

-- ---------- Exámenes clínicos ----------
create table if not exists public.history_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_type text not null check (char_length(exam_type) between 1 and 120),
  exam_date date,
  place text check (place is null or char_length(place) <= 160),
  reason text check (reason is null or char_length(reason) <= 500),
  result_text text check (result_text is null or char_length(result_text) <= 2000),
  result_status text check (result_status is null or result_status in ('normal', 'attention', 'unknown')),
  created_at timestamptz not null default now()
);

create index if not exists idx_history_exams_user
on public.history_exams (user_id, exam_date desc);

-- ---------- Cada persona solo puede ver y cambiar lo suyo ----------
alter table public.history_medicines enable row level security;
alter table public.history_conditions enable row level security;
alter table public.history_exams enable row level security;

drop policy if exists "history_medicines_own" on public.history_medicines;
create policy "history_medicines_own"
on public.history_medicines for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "history_conditions_own" on public.history_conditions;
create policy "history_conditions_own"
on public.history_conditions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "history_exams_own" on public.history_exams;
create policy "history_exams_own"
on public.history_exams for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
