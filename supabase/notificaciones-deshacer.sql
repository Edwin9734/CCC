-- DESHACE notificaciones.sql
-- Primero ejecuta notificaciones-reloj-deshacer.sql si ya activaste el reloj.
-- Atención: borra los celulares registrados y el registro de avisos enviados.
drop table if exists public.push_deliveries;
drop table if exists public.push_subscriptions;
