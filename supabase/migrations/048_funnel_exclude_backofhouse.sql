-- 048_funnel_exclude_backofhouse.sql
-- Las reservas que el propio restaurante apunta en backofhouse (source = 'backofhouse')
-- no son reservas generadas por Una Mesa: se excluyen de venue_funnel igual que phone_agent.
-- Misma función que 042 con el filtro de source ampliado.
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
    coalesce(auth.role(), '') = 'service_role'
    or exists (select 1 from admins where user_id = auth.uid())
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
      and coalesce(source, 'web') not in ('phone_agent', 'backofhouse')
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
grant execute on function public.venue_funnel(uuid, date, date) to authenticated, service_role;
