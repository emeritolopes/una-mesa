-- 046 · Recordatorio y caducidad de reservas 'pending' (confirmación manual)
--
-- Sin esto, una reserva pendiente que el restaurante nunca responde se queda
-- pendiente para siempre y el comensal nunca sabe nada.
--
-- Política (función expire-pending-reservations, cada 15 min):
--   plazo  = max(creación + 1 h, min(creación + 12 h, hora de la reserva − 1 h))
--   a mitad de plazo → recordatorio al restaurante (mismo enlace de un solo uso)
--   al vencer el plazo → la reserva pasa a 'cancelled' y se avisa al comensal
-- Solo afecta a reservas que tienen un token de respuesta sin usar, es decir, las
-- creadas con manual_confirmation (migración 044). Esas reservas no llevan depósito,
-- así que cancelar no implica ningún reembolso.

alter table public.reservation_response_tokens
  add column if not exists reminder_sent_at timestamptz;

create or replace function call_expire_pending_reservations()
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
    raise warning '[expire-pending-reservations] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/expire-pending-reservations',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

select cron.schedule(
  'expire-pending-reservations-every-15-min',
  '*/15 * * * *',
  $$select call_expire_pending_reservations();$$
);

-- Verifica después de aplicar:
--   select jobname, schedule from cron.job where jobname like 'expire-pending%';
