-- 052 · Visitas a la web de Una Mesa (landing, app, About, restaurantes…)
--
-- Hasta ahora solo se contaban las fichas de restaurante (venue_page_views, 027)
-- y la página «Para restaurantes» (restaurant_page_views, 032). No había forma de
-- saber cuánta gente entra en la web en general ni de dónde viene.
--
-- Una fila por página cargada. Sin cookies, sin nada guardado en el navegador,
-- sin IP, sin identificador de visitante: solo el dominio, la ruta y el dominio
-- de procedencia (p. ej. "instagram.com"). Por eso cuenta VISITAS (páginas
-- vistas), no personas únicas.
--
-- Igual que 027/032: cualquiera puede insertar, nadie puede editar ni borrar,
-- solo el admin puede leer. Las vistas agregadas usan security_invoker para que
-- respeten esa política (una vista normal se ejecuta con los permisos de su
-- dueño y se saltaría el RLS).

create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  viewed_at timestamptz not null default now(),
  site text not null check (site in ('unamesa.co.uk', 'unamesa.co', 'app.unamesa.co.uk', 'app.unamesa.co')),
  page text not null check (length(page) between 1 and 80),
  source text check (source is null or length(source) <= 100)
);

create index if not exists site_page_views_viewed_at_idx on public.site_page_views(viewed_at);

alter table public.site_page_views enable row level security;

drop policy if exists "site_page_views_public_insert" on public.site_page_views;
create policy "site_page_views_public_insert" on public.site_page_views
  for insert with check (true);

drop policy if exists "site_page_views_admin_read" on public.site_page_views;
create policy "site_page_views_admin_read" on public.site_page_views
  for select using (exists (select 1 from admins where user_id = auth.uid()));

-- Visitas por día (hora de Londres) y dominio, últimos 30 días.
create or replace view public.site_views_daily with (security_invoker = true) as
select (viewed_at at time zone 'Europe/London')::date as day, site, count(*) as views
  from public.site_page_views
 where viewed_at > now() - interval '31 days'
 group by 1, 2;

-- De dónde llegan (dominio de procedencia), últimos 30 días. null = directo o interno.
create or replace view public.site_sources_30d with (security_invoker = true) as
select coalesce(source, 'directo') as source, count(*) as views
  from public.site_page_views
 where viewed_at > now() - interval '30 days'
 group by 1
 order by 2 desc;

-- Páginas más vistas, últimos 30 días.
create or replace view public.site_pages_30d with (security_invoker = true) as
select site, page, count(*) as views
  from public.site_page_views
 where viewed_at > now() - interval '30 days'
 group by 1, 2
 order by 3 desc;

-- ── Retención: 13 meses, como venue_page_views ──────────────────────────────
-- Se vuelve a crear run_data_retention() de 051 con una línea más al final.
create or replace function public.run_data_retention()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n_notes int; n_customers int; n_ip int; n_leads int; n_events int; n_views int; n_site int;
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

  delete from site_page_views where viewed_at < now() - interval '13 months';
  get diagnostics n_site = row_count;

  return jsonb_build_object(
    'reservation_notes_cleared', n_notes,
    'customers_deleted', n_customers,
    'lead_ips_cleared', n_ip,
    'leads_deleted', n_leads,
    'venue_events_deleted', n_events,
    'page_views_deleted', n_views,
    'site_page_views_deleted', n_site
  );
end;
$$;

revoke all on function public.run_data_retention() from public, anon, authenticated;
grant execute on function public.run_data_retention() to service_role;

-- Verifica después de aplicar (como admin, o en el SQL Editor):
--   select * from site_views_daily order by day desc, site;
--   select * from site_sources_30d;
--   select * from site_pages_30d limit 20;
