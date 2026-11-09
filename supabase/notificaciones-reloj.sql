-- RECORDATORIOS DE MEDICINAS EN EL CELULAR (paso 2 de 2: el reloj)
-- Ejecútalo solo cuando la app ya esté publicada con las claves en Vercel.
-- Antes de ejecutarlo, cambia PEGA_AQUI_TU_CRON_SECRET por el mismo valor de CRON_SECRET en Vercel.
-- Para detenerlo, usa notificaciones-reloj-deshacer.sql.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- La contraseña queda cifrada en la bóveda de Supabase.
select vault.create_secret('PEGA_AQUI_TU_CRON_SECRET', 'recordatorios_cron_secret');

-- Cada minuto le pide a la app que revise qué tomas tocan.
select cron.schedule(
  'recordatorios-medicinas',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://ccc-zeta-six.vercel.app/api/recordatorios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'recordatorios_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $$
);
