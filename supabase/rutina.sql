-- MÓDULO RUTINA (pestaña Rutina de Hábitos)
-- Ejecuta este archivo una sola vez en el editor SQL de Supabase, después de schema.sql.
-- Para deshacerlo, usa rutina-deshacer.sql.

-- Lo que la persona registra cada día (una fila por actividad o vicio y por día)
create table if not exists public.routine_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  item_key text not null check (char_length(item_key) between 1 and 40),
  amount int not null check (amount between 1 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date, item_key)
);

drop trigger if exists trg_routine_entries_updated_at on public.routine_entries;
create trigger trg_routine_entries_updated_at
before update on public.routine_entries
for each row execute function public.set_updated_at();

create index if not exists idx_routine_entries_user_item_date
on public.routine_entries (user_id, item_key, entry_date desc);

alter table public.routine_entries enable row level security;

drop policy if exists "routine_entries_select_own" on public.routine_entries;
create policy "routine_entries_select_own"
on public.routine_entries for select
using (user_id = auth.uid());

drop policy if exists "routine_entries_insert_own" on public.routine_entries;
create policy "routine_entries_insert_own"
on public.routine_entries for insert
with check (user_id = auth.uid());

drop policy if exists "routine_entries_update_own" on public.routine_entries;
create policy "routine_entries_update_own"
on public.routine_entries for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "routine_entries_delete_own" on public.routine_entries;
create policy "routine_entries_delete_own"
on public.routine_entries for delete
using (user_id = auth.uid());

-- Los planes para dejar o reducir un vicio (uno por vicio)
create table if not exists public.routine_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null check (char_length(item_key) between 1 and 40),
  mode text not null check (mode in ('quit', 'reduce')),
  daily_limit int check (daily_limit is null or daily_limit between 1 and 1440),
  replacement_key text check (replacement_key is null or char_length(replacement_key) between 1 and 40),
  started_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_key)
);

create index if not exists idx_routine_goals_user
on public.routine_goals (user_id);

alter table public.routine_goals enable row level security;

drop policy if exists "routine_goals_select_own" on public.routine_goals;
create policy "routine_goals_select_own"
on public.routine_goals for select
using (user_id = auth.uid());

drop policy if exists "routine_goals_insert_own" on public.routine_goals;
create policy "routine_goals_insert_own"
on public.routine_goals for insert
with check (user_id = auth.uid());

drop policy if exists "routine_goals_update_own" on public.routine_goals;
create policy "routine_goals_update_own"
on public.routine_goals for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "routine_goals_delete_own" on public.routine_goals;
create policy "routine_goals_delete_own"
on public.routine_goals for delete
using (user_id = auth.uid());
