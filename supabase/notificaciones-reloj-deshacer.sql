-- DETIENE el reloj de notificaciones-reloj.sql y borra su contraseña de la bóveda.
select cron.unschedule('recordatorios-medicinas');
delete from vault.secrets where name = 'recordatorios_cron_secret';
