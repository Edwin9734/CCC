-- RECORDATORIOS DE MEDICINAS EN EL CELULAR (paso 1 de 2)
-- Ejecuta este archivo una sola vez en el editor SQL de Supabase, después de schema.sql.
-- Para deshacerlo, usa notificaciones-deshacer.sql.

-- Cada celular o navegador donde se activaron los recordatorios.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  hide_names boolean not null default false,
  second_reminder boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
on public.push_subscriptions (user_id);

-- Qué aviso ya se envió, para no repetirlo. kind: 'first' = a la hora; 'second' = 30 minutos después.
create table if not exists public.push_deliveries (
  schedule_id uuid not null references public.medication_schedules(id) on delete cascade,
  intake_date date not null,
  kind text not null check (kind in ('first', 'second')),
  user_id uuid not null references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (schedule_id, intake_date, kind)
);

-- Sin políticas a propósito: solo el servidor de la app, con su clave secreta, puede usar estas tablas.
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
