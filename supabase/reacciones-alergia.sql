-- HISTORIAL DE REACCIONES ALÉRGICAS (Dietas > Alergias y Reportes)
-- Ejecuta este archivo una sola vez en el editor SQL de Supabase, después de schema.sql.
-- Para deshacerlo, usa reacciones-alergia-deshacer.sql.

-- occurred_at guarda la fecha y hora tal como las ve la persona (sin zona horaria),
-- para que el reporte muestre siempre la misma hora que se registró.
create table if not exists public.allergy_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamp not null,
  symptoms text[] not null check (cardinality(symptoms) between 1 and 20),
  severity text not null check (severity in ('severe', 'mild')),
  causes text[] not null default '{}' check (cardinality(causes) <= 30),
  details text check (details is null or char_length(details) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists idx_allergy_reactions_user_date
on public.allergy_reactions (user_id, occurred_at desc);

alter table public.allergy_reactions enable row level security;

drop policy if exists "allergy_reactions_select_own" on public.allergy_reactions;
create policy "allergy_reactions_select_own"
on public.allergy_reactions for select
using (user_id = auth.uid());

drop policy if exists "allergy_reactions_insert_own" on public.allergy_reactions;
create policy "allergy_reactions_insert_own"
on public.allergy_reactions for insert
with check (user_id = auth.uid());

drop policy if exists "allergy_reactions_delete_own" on public.allergy_reactions;
create policy "allergy_reactions_delete_own"
on public.allergy_reactions for delete
using (user_id = auth.uid());
