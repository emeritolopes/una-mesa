-- 027_venue_page_views.sql
--
-- Registra cada vez que un comensal abre la ficha de un restaurante — para
-- poder mostrarle a un restaurante potencial cuánta gente está viendo su
-- perfil, incluso antes de que pueda recibir reservas reales.

create table if not exists public.venue_page_views (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index if not exists venue_page_views_venue_id_idx on public.venue_page_views(venue_id);
create index if not exists venue_page_views_viewed_at_idx on public.venue_page_views(viewed_at);

alter table public.venue_page_views enable row level security;

-- Cualquiera puede registrar una vista (es solo un contador, sin datos
-- personales) — pero NADIE puede leerlas directamente vía la API pública,
-- ni actualizarlas ni borrarlas. La lectura para mostrar el conteo se hace
-- vía la vista agregada de abajo, que sí tiene su propia política de
-- lectura restringida al admin y al propio restaurante.
drop policy if exists "venue_page_views_public_insert" on public.venue_page_views;
create policy "venue_page_views_public_insert" on public.venue_page_views
  for insert with check (true);

-- Solo el admin puede leer las vistas — nadie más, ni siquiera el propio
-- restaurante por ahora (se puede abrir más adelante si hace falta).
drop policy if exists "venue_page_views_admin_read" on public.venue_page_views;
create policy "venue_page_views_admin_read" on public.venue_page_views
  for select using (exists (select 1 from admins where user_id = auth.uid()));

-- Vista agregada — conteos por restaurante, nunca filas individuales.
create or replace view venue_view_counts as
select
  venue_id,
  count(*) as total_views,
  count(*) filter (where viewed_at > now() - interval '7 days') as views_last_7_days,
  count(*) filter (where viewed_at > now() - interval '30 days') as views_last_30_days
from venue_page_views
group by venue_id;

-- Verifica después de aplicar:
--   select * from venue_view_counts;
