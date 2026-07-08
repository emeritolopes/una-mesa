-- 010_cancellation_redesign.sql
--
-- Tres cosas en esta migración:
--
-- 1. FIX: generate_noshow_token y reservations_due_capture tenían
--    'Europe/Madrid' hardcodeado — mismo bug de fondo que el filtro de
--    ciudad que arreglamos en data.js. venues.timezone ya existe como
--    columna; solo nadie la estaba usando aquí. Sin este fix, el primer
--    restaurante de Londres tendría ventanas de gracia y expiración de
--    tokens calculadas con la hora de Madrid, no la suya.
--
-- 2. cancellations: es una tabla fantasma — existe en producción (el
--    cliente ya inserta ahí) pero nunca se versionó. La recreamos aquí
--    con "if not exists" para no romper nada si ya existe con esta forma,
--    y le agregamos RLS real (hoy no tiene ninguna política conocida).
--
-- 3. Nada de client-side insert ya: a partir de ahora solo la función
--    cancel-reservation (service_role) escribe aquí.

create or replace function generate_noshow_token(p_reservation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token    uuid;
  v_date     date;
  v_time     text;
  v_tz       text;
  v_expires  timestamptz;
begin
  select r.date, r."time", coalesce(v.timezone, 'Europe/Madrid')
    into v_date, v_time, v_tz
    from reservations r
    join venues v on v.id = r.venue_id
   where r.id = p_reservation_id
   limit 1;

  if not found then
    raise exception 'Reservation % not found', p_reservation_id;
  end if;

  v_expires := (v_date + v_time::time) at time zone v_tz
               + interval '24 hours';

  insert into noshow_tokens (reservation_id, expires_at)
  values (p_reservation_id, v_expires)
  returning token into v_token;

  return v_token;
end;
$$;

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
  and r.status not in ('cancelled')
  and (
    r.deposit_status is null
    or r.deposit_status not in ('capturing', 'captured', 'capture_failed', 'refunded')
  )
  and (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
    + (v.grace_period_minutes || ' minutes')::interval < now();

-- Tabla cancellations, real esta vez, versionada
create table if not exists public.cancellations (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  reason         text,
  refund_amount  integer,
  created_at     timestamptz not null default now()
);

create index if not exists idx_cancellations_reservation on public.cancellations(reservation_id);

alter table public.cancellations enable row level security;

-- Solo service_role escribe (vía cancel-reservation). El propio diner puede
-- leer sus cancelaciones; el restaurante puede leer las de su venue.
drop policy if exists "cancellations_service_role_all" on public.cancellations;
create policy "cancellations_service_role_all"
  on public.cancellations for all
  to service_role
  using (true) with check (true);

drop policy if exists "cancellations_customer_read_own" on public.cancellations;
create policy "cancellations_customer_read_own"
  on public.cancellations for select
  using (user_id = auth.uid());

drop policy if exists "cancellations_restaurant_read_own" on public.cancellations;
create policy "cancellations_restaurant_read_own"
  on public.cancellations for select
  using (
    reservation_id in (
      select id from public.reservations where venue_id = public.current_venue_id()
    )
  );

-- Verifica después de aplicar:
--   select policyname, cmd, roles from pg_policies where tablename = 'cancellations';
-- Debe mostrar exactamente 3 políticas: service_role (ALL), customer (SELECT), restaurant (SELECT).
-- Ninguna de INSERT/UPDATE/DELETE para 'public'/'authenticated' — solo service_role escribe.
