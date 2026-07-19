-- 032_restaurant_page_conversion.sql
--
-- Hasta ahora no había forma de saber si el problema de captación era
-- "poca gente ve la página de restaurantes" o "la ve pero no convence" —
-- son soluciones distintas. Esto registra las visitas, y las cruza con
-- los leads ya guardados en restaurant_leads para calcular la conversión.

create table if not exists public.restaurant_page_views (
  id uuid primary key default gen_random_uuid(),
  viewed_at timestamptz not null default now(),
  lang text
);

alter table public.restaurant_page_views enable row level security;

drop policy if exists "restaurant_page_views_public_insert" on public.restaurant_page_views;
create policy "restaurant_page_views_public_insert" on public.restaurant_page_views
  for insert with check (true);

drop policy if exists "restaurant_page_views_admin_read" on public.restaurant_page_views;
create policy "restaurant_page_views_admin_read" on public.restaurant_page_views
  for select using (exists (select 1 from admins where user_id = auth.uid()));

-- Vista con la conversión ya calculada — visitas, leads, y el % entre
-- los dos, en dos ventanas de tiempo distintas.
create or replace view restaurant_page_conversion as
select
  (select count(*) from restaurant_page_views) as views_total,
  (select count(*) from restaurant_leads) as leads_total,
  case when (select count(*) from restaurant_page_views) > 0
    then round((select count(*) from restaurant_leads)::numeric / (select count(*) from restaurant_page_views) * 100, 1)
    else null
  end as conversion_pct_total,

  (select count(*) from restaurant_page_views where viewed_at > now() - interval '7 days') as views_last_7d,
  (select count(*) from restaurant_leads where created_at > now() - interval '7 days') as leads_last_7d,
  case when (select count(*) from restaurant_page_views where viewed_at > now() - interval '7 days') > 0
    then round((select count(*) from restaurant_leads where created_at > now() - interval '7 days')::numeric
      / (select count(*) from restaurant_page_views where viewed_at > now() - interval '7 days') * 100, 1)
    else null
  end as conversion_pct_last_7d;

-- Verifica después de aplicar, y cada vez que quieras ver el número:
--   select * from restaurant_page_conversion;
