-- 023_health_check_function.sql
--
-- reservations no tenía updated_at — necesario para detectar "cuánto
-- tiempo lleva atascado en este estado", no solo cuándo se creó. Se
-- agrega con un trigger que lo actualiza solo en cada cambio.
--
-- Luego, la función que detecta las dos anomalías del dinero que hoy
-- solo podíamos notar revisando SQL a mano.

alter table public.reservations
  add column if not exists updated_at timestamptz not null default now();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
  before update on public.reservations
  for each row
  execute function set_updated_at();

create or replace function find_stuck_reservations()
returns table (
  issue text,
  reservation_id uuid,
  venue_name text,
  detail text
)
language sql
security definer
as $$
  -- 1. Depósito atascado en 'capturing' por más de 10 minutos — el lock
  --    se tomó pero la llamada a Stripe nunca terminó de resolverse.
  select
    'stuck_capturing' as issue,
    r.id as reservation_id,
    v.name as venue_name,
    'deposit_status = capturing desde hace más de 10 min' as detail
  from reservations r
  join venues v on v.id = r.venue_id
  where r.deposit_status = 'capturing'
    and r.updated_at < now() - interval '10 minutes'

  union all

  -- 2. Ya pasó la hora de captura (con margen) y sigue pendiente —
  --    auto-capture debería haberla resuelto hace rato.
  select
    'overdue_capture' as issue,
    r.id as reservation_id,
    v.name as venue_name,
    'debió capturarse hace más de 30 min y sigue pending' as detail
  from reservations r
  join venues v on v.id = r.venue_id
  where r.status = 'confirmed'
    and r.deposit_status = 'pending'
    and r.payment_intent_id is not null
    and (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
      + (v.grace_period_minutes || ' minutes')::interval < now() - interval '30 minutes';
$$;

-- Verifica después de aplicar:
--   select * from find_stuck_reservations();
-- Debe devolver vacío en un sistema sano.

-- Cron — mismo patrón que auto-capture: lee los secretos desde Vault,
-- nunca en texto plano aquí. Cada 30 minutos.
create or replace function call_health_check()
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
    raise warning '[health-check] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/health-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
end;
$$;

select cron.schedule(
  'health-check-every-30-min',
  '*/30 * * * *',
  $$select call_health_check();$$
);
