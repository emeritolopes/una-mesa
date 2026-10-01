-- 050 · Recordatorio al comensal antes de la reserva
--
-- Reducir no-shows es la razón de ser del producto; hasta ahora el comensal no
-- recibía nada entre la confirmación y la hora de la reserva.
--
-- Función send-reservation-reminders (cron cada 30 min). Envía UN email por reserva,
-- con el enlace de cancelar, cuando se cumple todo esto:
--   · reserva 'confirmed' con email del comensal y sin recordatorio enviado
--   · falta 24 h o menos para la hora de la reserva (hora del local)
--   · faltan al menos 2 h (no tiene sentido recordar a última hora; además el enlace
--     de cancelar caduca a la hora de la reserva)
--   · la reserva se hizo hace 6 h o más (si no, el recordatorio llegaría pegado
--     al email de confirmación y sería ruido)
-- Las reservas hechas con menos de 8 h de antelación no reciben recordatorio.

alter table public.reservations
  add column if not exists reminder_sent_at timestamptz;

create index if not exists reservations_reminder_pending_idx
  on public.reservations (date)
  where status = 'confirmed' and reminder_sent_at is null;

-- Zona horaria de los locales de Londres. generate_cancel_token y la ventana de 24 h
-- de cancelación leen venues.timezone con 'Europe/Madrid' por defecto: si un local de
-- Londres no la tiene bien puesta, el enlace de cancelar caduca 1 h antes de la reserva.
update public.venues
   set timezone = 'Europe/London'
 where city = 'London'
   and (timezone is null or timezone = 'Europe/Madrid');

create or replace function call_send_reservation_reminders()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_key is null then
    raise warning '[send-reservation-reminders] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/send-reservation-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

select cron.schedule(
  'send-reservation-reminders-every-30-min',
  '*/30 * * * *',
  $$select call_send_reservation_reminders();$$
);

-- Verifica después de aplicar:
--   select jobname, schedule from cron.job where jobname like 'send-reservation-reminders%';
--   select name, city, timezone from venues where city = 'London';
