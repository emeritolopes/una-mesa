-- 034_menu_videos.sql
--
-- Servicio nuevo, de pago aparte: menú en video por categorías, visible
-- desde la ficha del restaurante. Solo los restaurantes con acceso
-- pagado pueden mostrarlo — el resto ve el botón deshabilitado.

alter table public.venues
  add column if not exists menu_video_access boolean not null default false;

create table if not exists public.menu_videos (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  category text not null,
  dish_name text not null,
  video_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists menu_videos_venue_id_idx on public.menu_videos(venue_id);

alter table public.menu_videos enable row level security;

-- Lectura pública SOLO si el restaurante tiene el acceso pagado activo
-- — evita que alguien vea los videos de un restaurante que dejó de
-- pagar, o que nunca pagó.
drop policy if exists "menu_videos_public_read_if_paid" on public.menu_videos;
create policy "menu_videos_public_read_if_paid" on public.menu_videos
  for select using (
    exists (select 1 from venues where venues.id = menu_videos.venue_id and venues.menu_video_access = true)
  );

-- Solo el admin puede escribir — no hay panel de restaurante para esto
-- todavía, se carga a mano por ahora.
drop policy if exists "menu_videos_admin_write" on public.menu_videos;
create policy "menu_videos_admin_write" on public.menu_videos
  for all using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

-- Verifica después de aplicar:
--   select * from menu_videos;
