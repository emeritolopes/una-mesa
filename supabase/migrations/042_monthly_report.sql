-- 042_monthly_report.sql
--
-- Informe mensual para cada restaurante ("Una Mesa te trajo X comensales").
-- La función monthly-report calcula el embudo del mes anterior con
-- venue_funnel() y se lo manda por email a cada restaurante.
--
-- 1. venue_funnel() también puede llamarse con la service role (la usa la
--    función monthly-report, que corre desde un cron, sin usuario).
-- 2. venue_monthly_reports registra qué informe se mandó a quién, para no
--    mandar nunca el mismo mes dos veces.
-- 3. call_monthly_report() la llama el cron. El cron NO se programa aquí:
--    se activa aparte cuando se haya revisado un envío de prueba:
--      select cron.schedule('monthly-report', '0 9 1 * *', $$select call_monthly_report();$$);

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
grant execute on function public.venue_funnel(uuid, date, date) to authenticated, service_role;

create table if not exists public.venue_monthly_reports (
  venue_id uuid not null references public.venues(id) on delete cascade,
  month date not null,               -- primer día del mes informado
  sent_to text not null,
  sent_at timestamptz not null default now(),
  stats jsonb not null,
  primary key (venue_id, month)
);

alter table public.venue_monthly_reports enable row level security;

drop policy if exists "venue_monthly_reports_admin_read" on public.venue_monthly_reports;
create policy "venue_monthly_reports_admin_read" on public.venue_monthly_reports
  for select using (exists (select 1 from admins where user_id = auth.uid()));

-- Llamada del cron — mismo patrón que call_onboarding_reminder (029).
create or replace function call_monthly_report()
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
    raise warning '[monthly-report] Vault secrets project_url/service_role_key no configurados — cron sin efecto';
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/monthly-report',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := '{}'::jsonb
  );
end;
$$;

-- Verifica después de aplicar:
--   select * from venue_monthly_reports order by sent_at desc;
