-- 0. Add missing columns to reservations
--    deposit_status: tracks payment capture state (null = not yet captured)
--    deposit_amount: denormalized cents from venues.deposit_amount at booking time
alter table reservations
  add column if not exists deposit_status text default null,
  add column if not exists deposit_amount integer default null;

-- 1. grace_period_minutes on venues (per-restaurant configurable window after reservation time)
alter table venues
  add column if not exists grace_period_minutes integer not null default 120;

-- 2. noshow_tokens — one-time magic link tokens for restaurant staff
create table if not exists noshow_tokens (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references reservations(id) on delete cascade,
  token          uuid not null default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  used_at        timestamptz
);

create unique index if not exists noshow_tokens_token_idx
  on noshow_tokens(token);
create index if not exists noshow_tokens_reservation_idx
  on noshow_tokens(reservation_id);

-- RLS on, no user policies — only service role + SECURITY DEFINER functions
alter table noshow_tokens enable row level security;

-- 3. try_lock_deposit_capture — atomic CAS: any non-terminal state → 'capturing'
--    Returns true if the lock was acquired (prevents double-capture race)
create or replace function try_lock_deposit_capture(p_reservation_id uuid)
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
     and (deposit_status is null
          or deposit_status not in ('capturing', 'captured', 'capture_failed', 'refunded'))
     and payment_intent_id is not null
     and status != 'cancelled';
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- 4. generate_noshow_token — callable by anon via .rpc() (SECURITY DEFINER bypasses RLS on noshow_tokens)
--    expires_at = reservation datetime in Madrid + 24h
create or replace function generate_noshow_token(p_reservation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token   uuid;
  v_date    date;
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

  v_expires := (v_date + v_time::time) at time zone 'Europe/Madrid'
               + interval '24 hours';

  insert into noshow_tokens (reservation_id, expires_at)
  values (p_reservation_id, v_expires)
  returning token into v_token;

  return v_token;
end;
$$;

grant execute on function generate_noshow_token(uuid) to anon, authenticated;

-- 5. reservations_due_capture — view for auto-capture cron
--    date: text YYYY-MM-DD, time: text HH:MM — both cast to construct Madrid timestamp
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
  (r.date::date + r."time"::time) at time zone 'Europe/Madrid'
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
  and (r.date::date + r."time"::time) at time zone 'Europe/Madrid'
    + (v.grace_period_minutes || ' minutes')::interval < now();
