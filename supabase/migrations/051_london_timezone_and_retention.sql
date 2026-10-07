-- 051 · Londres primero: zona horaria por defecto + retención automática de datos
--
-- 1) Zona horaria. Varias funciones SQL antiguas (002, 003, 010, 012, 013, 015, 023,
--    026) hacen coalesce(v.timezone, 'Europe/Madrid'). Esas funciones no se tocan:
--    se arregla el dato de origen para que venues.timezone nunca sea null.
-- 2) Retención. Hasta ahora no se borraba nada nunca. run_data_retention() cubre
--    lo que es solo base de datos; la anonimización de reservas antiguas (que
--    también limpia la copia de Stripe) la hace la edge function data-retention.
--
-- PLAZOS = valores por defecto elegidos por producto, PENDIENTES DE CONFIRMAR con
-- el solicitor (ver D4/D6 del Data Map). Se cambian aquí sin tocar nada más:
--   notas libres de la reserva ........ 90 días tras la fecha de la reserva
--   perfil de cliente (customers) ..... 24 meses tras last_visit
--   IP de leads de restaurante ........ 30 días
--   leads de restaurante .............. 12 meses
--   venue_events / venue_page_views ... 13 meses
--   (datos personales de reservations . 24 meses → edge function data-retention)

-- ── 1. Zona horaria ────────────────────────────────────────────────────────
alter table public.venues alter column timezone set default 'Europe/London';

update public.venues
   set timezone = case when city ilike 'madrid' then 'Europe/Madrid' else 'Europe/London' end
 where timezone is null;

-- ── 2. Retención ───────────────────────────────────────────────────────────
create or replace function public.run_data_retention()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_notes int; n_customers int; n_ip int; n_leads int; n_events int; n_views int;
begin
  -- Notas libres: pueden contener alergias u otros datos de salud.
  update reservations set notes = null
   where notes is not null
     and date::date < current_date - 90;
  get diagnostics n_notes = row_count;

  delete from customers
   where last_visit is not null
     and last_visit::date < current_date - interval '24 months';
  get diagnostics n_customers = row_count;

  update restaurant_leads set ip_address = null
   where ip_address is not null
     and created_at < now() - interval '30 days';
  get diagnostics n_ip = row_count;

  delete from restaurant_leads where created_at < now() - interval '12 months';
  get diagnostics n_leads = row_count;

  delete from venue_events where created_at < now() - interval '13 months';
  get diagnostics n_events = row_count;

  delete from venue_page_views where viewed_at < now() - interval '13 months';
  get diagnostics n_views = row_count;

  return jsonb_build_object(
    'reservation_notes_cleared', n_notes,
    'customers_deleted', n_customers,
    'lead_ips_cleared', n_ip,
    'leads_deleted', n_leads,
    'venue_events_deleted', n_events,
    'page_views_deleted', n_views
  );
end;
$$;

revoke all on function public.run_data_retention() from public, anon, authenticated;
grant execute on function public.run_data_retention() to service_role;

-- Llamada diaria a la edge function data-retention (mismo patrón Vault que 050).
create or replace function call_data_retention()
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
    raise warning '[data-retention] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/data-retention',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

revoke all on function call_data_retention() from public, anon, authenticated;

-- 03:15 UTC cada día
select cron.schedule(
  'data-retention-daily',
  '15 3 * * *',
  $$select call_data_retention();$$
);

-- Verifica después de aplicar:
--   select jobname, schedule from cron.job where jobname = 'data-retention-daily';
--   select count(*) from venues where timezone is null;            -- debe ser 0
--   select run_data_retention();                                    -- como service_role; ¡borra de verdad!
