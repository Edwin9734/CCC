-- MI PLAN: metas personales, sus marcas de cada día y lo guardado en Dieta, Ajuste y Consejos.
-- Ejecuta este archivo una sola vez en el editor SQL de Supabase, después de schema.sql.
-- Para deshacerlo, usa mi-plan-deshacer.sql.

create table if not exists public.plan_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (category in ('food', 'activity', 'water', 'sleep', 'meds', 'mind', 'other')),
  days_per_week smallint not null default 5 check (days_per_week between 1 and 7),
  suggestion_key text check (suggestion_key is null or char_length(suggestion_key) <= 40),
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_plan_goals_user
on public.plan_goals (user_id, created_at desc);

create table if not exists public.plan_goal_checks (
  goal_id uuid not null references public.plan_goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  check_date date not null,
  primary key (goal_id, check_date)
);

create index if not exists idx_plan_goal_checks_user
on public.plan_goal_checks (user_id, check_date desc);

-- Lista de compras (shopping), consejos favoritos (tip_fav) y probados (tip_tried), y tareas de la semana (todo).
create table if not exists public.plan_marks (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('shopping', 'tip_fav', 'tip_tried', 'todo')),
  item_key text not null check (char_length(item_key) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, kind, item_key)
);

alter table public.plan_goals enable row level security;
alter table public.plan_goal_checks enable row level security;
alter table public.plan_marks enable row level security;

drop policy if exists "plan_goals_own" on public.plan_goals;
create policy "plan_goals_own"
on public.plan_goals for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "plan_goal_checks_own" on public.plan_goal_checks;
create policy "plan_goal_checks_own"
on public.plan_goal_checks for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "plan_marks_own" on public.plan_marks;
create policy "plan_marks_own"
on public.plan_marks for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
