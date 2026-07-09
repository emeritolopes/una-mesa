-- 013_auto_capture_cron.sql
--
-- auto-capture existía como función desde hace tiempo, pero nunca se
-- ejecutaba sola — ni pg_cron ni pg_net estaban habilitados en este
-- proyecto. Esto significa que, hasta ahora, cualquier depósito retenido
-- cuya reserva pasara su hora + el período de gracia se quedaba sin cobrar
-- para siempre, salvo que alguien lo capturara a mano — y Stripe libera
-- las autorizaciones sin capturar a los 7 días, sin avisar a nadie.
--
-- PRE-REQUISITO, hecho fuera de esta migración (no se puede versionar un
-- secreto en un archivo que se sube a git): dos secretos ya creados en
-- Supabase Vault (Project Settings → Vault) antes de aplicar esto:
--   project_url      = https://rkaytcmyaaighozxatod.supabase.co
--   service_role_key = tu clave real de service_role

-- 1. Habilitar las extensiones necesarias para llamar una función HTTP desde Postgres
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 2. reservations_due_capture: excluir también las ya marcadas 'completed'
--    (defensa adicional — el chequeo de deposit_status ya debería evitar un
--    doble cobro, pero no quiero depender solo de eso).
create or replace view reservations_due_capture as
select
  r.id,
  r.payment_intent_id,
  r.date,
  r."time",
  r.deposit_status,
  r.status,
  r.venue_id,
  v.grace_period_minutes,
  (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
    + (v.grace_period_minutes || ' minutes')::interval as capture_after
from reservations r
join venues v on v.id = r.venue_id
where
  r.payment_intent_id is not null
  and r.status not in ('cancelled', 'completed', 'no_show')
  and (
    r.deposit_status is null
    or r.deposit_status not in ('capturing', 'captured', 'capture_failed', 'refunded')
  )
  and (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
    + (v.grace_period_minutes || ' minutes')::interval < now();

-- 3. Función que llama a la Edge Function, leyendo el secreto desde Vault —
--    nunca escrito en texto plano aquí.
create or replace function call_auto_capture()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url   text;
  v_key   text;
begin
  select decrypted_secret into v_url  from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key  from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_key is null then
    raise warning '[auto-capture] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/auto-capture',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

-- 4. Programar cada 15 minutos. cron.schedule con el mismo nombre de job
--    reemplaza el anterior si ya existía — seguro de re-correr.
select cron.schedule(
  'auto-capture-every-15-min',
  '*/15 * * * *',
  $$select call_auto_capture();$$
);

-- Verifica después de aplicar:
--   select jobid, jobname, schedule, active from cron.job;
-- Debe aparecer 'auto-capture-every-15-min', active = true.
--
-- Espera ~15-20 minutos y revisa que corrió:
--   select * from cron.job_run_details order by start_time desc limit 5;
-- Debe mostrar status 'succeeded', no 'failed'.
