-- 003_noshow_corrections.sql
-- Corrective migration: align with reference schema after inspecting real DB.
-- Actual DB uses: venues (not restaurants), venue_id FK, separate date+time columns.

-- 1. Drop and recreate noshow_tokens with token as primary key (reference schema)
drop table if exists public.noshow_tokens;

create table public.noshow_tokens (
  token          uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  used_at        timestamptz,
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_noshow_tokens_reservation
  on public.noshow_tokens(reservation_id);

alter table public.noshow_tokens enable row level security;
-- No policies: accessible only via service role or SECURITY DEFINER functions

-- 2. try_lock_deposit_capture — match reference: locks only when deposit_status = 'pending'
create or replace function public.try_lock_deposit_capture(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  update reservations
     set deposit_status = 'capturing'
   where id = p_reservation_id
     and deposit_status = 'pending'
     and status = 'confirmed';
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- 3. generate_noshow_token — adapted for new token-as-pk structure
--    Callable by anon via .rpc() (SECURITY DEFINER bypasses RLS on noshow_tokens)
create or replace function public.generate_noshow_token(p_reservation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token   uuid;
  v_date    text;
  v_time    text;
  v_expires timestamptz;
begin
  select date, "time"
    into v_date, v_time
    from reservations
   where id = p_reservation_id
   limit 1;

  if not found then
    raise exception 'Reservation % not found', p_reservation_id;
  end if;

  -- expires_at = reservation datetime in Madrid + 24h
  v_expires := (v_date::date + v_time::time) at time zone 'Europe/Madrid'
               + interval '24 hours';

  insert into noshow_tokens (reservation_id, expires_at)
  values (p_reservation_id, v_expires)
  returning token into v_token;

  return v_token;
end;
$$;

grant execute on function public.generate_noshow_token(uuid) to anon, authenticated;

-- 4. reservations_due_capture — adapted for actual schema:
--    - venues (not restaurants), venue_id (not restaurant_id)
--    - date (text YYYY-MM-DD) + time (text HH:MM) instead of reservation_time
--    - deposit_status = 'pending' (matches reference logic)
create or replace view public.reservations_due_capture as
select
  r.id,
  r.payment_intent_id,
  r.date,
  r."time",
  r.deposit_status,
  r.status,
  r.venue_id,
  v.grace_period_minutes,
  (r.date::date + r."time"::time) at time zone 'Europe/Madrid'
    + (v.grace_period_minutes || ' minutes')::interval as capture_after
from public.reservations r
join public.venues v on v.id = r.venue_id
where r.status = 'confirmed'
  and r.deposit_status = 'pending'
  and r.payment_intent_id is not null
  and (r.date::date + r."time"::time) at time zone 'Europe/Madrid'
    + (v.grace_period_minutes || ' minutes')::interval < now();
