-- 041_venue_funnel.sql
--
-- Embudo por restaurante: vistas de ficha → vídeos vistos → reservas
-- empezadas → reservas → comensales → comensales que vinieron.
--
-- Las vistas de ficha ya existen (venue_page_views, 027) y las reservas ya
-- guardan pax, source y el estado final (completed / no_show / cancelled).
-- Faltaban dos pasos intermedios, que se registran en venue_events:
--   video_view    — el comensal empezó a ver un plato en el menú en vídeo
--   booking_start — el comensal abrió la pantalla de reserva
--
-- venue_funnel() junta todo para un rango de fechas. Solo cuenta reservas
-- hechas a través de Una Mesa (web/app), no las del agente telefónico del
-- propio restaurante, porque esas no las genera la plataforma.

create table if not exists public.venue_events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  event text not null check (event in ('video_view', 'booking_start')),
  session_id text check (session_id is null or length(session_id) <= 64),
  dish_id uuid references public.menu_videos(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists venue_events_venue_created_idx on public.venue_events(venue_id, created_at);

alter table public.venue_events enable row level security;

-- Igual que venue_page_views: cualquiera puede registrar un evento (sin datos
-- personales, solo un id de sesión aleatorio del navegador), nadie puede
-- editarlos ni borrarlos, y solo el admin o el propio restaurante los leen.
drop policy if exists "venue_events_public_insert" on public.venue_events;
create policy "venue_events_public_insert" on public.venue_events
  for insert with check (true);

drop policy if exists "venue_events_owner_read" on public.venue_events;
create policy "venue_events_owner_read" on public.venue_events
  for select using (
    exists (select 1 from admins where user_id = auth.uid())
    or exists (select 1 from restaurant_users ru where ru.user_id = auth.uid() and ru.venue_id = venue_events.venue_id)
  );

-- Embudo de un restaurante entre dos fechas (ambas incluidas).
-- Vistas y eventos se cuentan por fecha en que ocurrieron; las reservas por
-- la fecha de la reserva (el día que el comensal va a comer).
create or replace function public.venue_funnel(p_venue_id uuid, p_from date, p_to date)
returns table (
  restaurant_views bigint,
  video_views bigint,
  video_viewers bigint,
  booking_starts bigint,
  bookings bigint,
  covers_booked bigint,
  bookings_attended bigint,
  covers_attended bigint,
  no_shows bigint,
  cancellations bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    exists (select 1 from admins where user_id = auth.uid())
    or exists (select 1 from restaurant_users ru where ru.user_id = auth.uid() and ru.venue_id = p_venue_id)
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with r as (
    select status, coalesce(pax, 0) as pax
    from reservations
    where venue_id = p_venue_id
      and date between p_from and p_to
      and coalesce(source, 'web') <> 'phone_agent'
      and status <> 'pending'
  )
  select
    (select count(*) from venue_page_views v
       where v.venue_id = p_venue_id and v.viewed_at >= p_from and v.viewed_at < p_to + 1),
    (select count(*) from venue_events e
       where e.venue_id = p_venue_id and e.event = 'video_view' and e.created_at >= p_from and e.created_at < p_to + 1),
    (select count(distinct e.session_id) from venue_events e
       where e.venue_id = p_venue_id and e.event = 'video_view' and e.created_at >= p_from and e.created_at < p_to + 1),
    (select count(distinct coalesce(e.session_id, e.id::text)) from venue_events e
       where e.venue_id = p_venue_id and e.event = 'booking_start' and e.created_at >= p_from and e.created_at < p_to + 1),
    (select count(*) from r where status in ('confirmed', 'completed', 'no_show')),
    (select coalesce(sum(pax), 0) from r where status in ('confirmed', 'completed', 'no_show')),
    (select count(*) from r where status = 'completed'),
    (select coalesce(sum(pax), 0) from r where status = 'completed'),
    (select count(*) from r where status = 'no_show'),
    (select count(*) from r where status = 'cancelled');
end;
$$;

revoke all on function public.venue_funnel(uuid, date, date) from public, anon;
grant execute on function public.venue_funnel(uuid, date, date) to authenticated;

-- Verifica después de aplicar (como admin, desde la app o el SQL editor con
-- un usuario autenticado):
--   select * from venue_funnel('<venue uuid>', date_trunc('month', now())::date, now()::date);
