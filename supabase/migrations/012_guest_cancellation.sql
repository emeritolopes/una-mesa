-- 012_guest_cancellation.sql
--
-- Cancelación para reservas de invitado (sin cuenta, user_id null). Hasta
-- ahora no había forma de que un invitado demostrara que una reserva era
-- suya — cancel-reservation exige un JWT real. Mismo patrón que
-- noshow_tokens: un token de un solo uso, incluido en el propio email de
-- confirmación desde el principio, sin necesidad de "pedir" un link aparte.

create table if not exists public.cancel_tokens (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  token          uuid not null default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  used_at        timestamptz
);

create unique index if not exists cancel_tokens_token_idx on public.cancel_tokens(token);
create index if not exists cancel_tokens_reservation_idx on public.cancel_tokens(reservation_id);

-- RLS on, sin políticas para nadie salvo service_role — igual que noshow_tokens,
-- solo se toca vía función SECURITY DEFINER o desde la función edge con service_role.
alter table public.cancel_tokens enable row level security;

-- generate_cancel_token — expira en el momento de la reserva (no tiene sentido
-- cancelar una mesa después de la hora a la que ya se debía ocupar).
create or replace function generate_cancel_token(p_reservation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token   uuid;
  v_date    date;
  v_time    text;
  v_tz      text;
  v_expires timestamptz;
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

  v_expires := (v_date + v_time::time) at time zone v_tz;

  insert into cancel_tokens (reservation_id, expires_at)
  values (p_reservation_id, v_expires)
  returning token into v_token;

  return v_token;
end;
$$;

grant execute on function generate_cancel_token(uuid) to anon, authenticated;

-- Verifica después de aplicar:
--   select proname from pg_proc where proname = 'generate_cancel_token';
--   select relrowsecurity from pg_class where relname = 'cancel_tokens'; -- debe ser true
