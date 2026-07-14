-- 018_menu_stock_tables.sql
--
-- carta.jsx y stock.jsx solo guardaban en localStorage (window.Store) —
-- sin ningún respaldo real. Si el navegador borraba su caché, o el
-- restaurante cambiaba de dispositivo, perdían toda su carta y su
-- inventario sin aviso. Estas tablas son el respaldo real.
--
-- RLS: mismo patrón que reservations — cada restaurante solo ve y edita
-- lo suyo, vía current_venue_id() (ya existe desde 004_restaurant_auth.sql).

create table if not exists public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues(id) on delete cascade,
  category_id   uuid references public.menu_categories(id) on delete set null,
  name          text not null,
  description   text,
  price         numeric(10,2) not null default 0,
  vat_rate      integer not null default 10,
  tag           text,
  available     boolean not null default true,
  sold          integer not null default 0,
  allergens     text[] not null default '{}',
  subcategory   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.stock_items (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references public.venues(id) on delete cascade,
  name        text not null,
  category    text not null default 'Despensa',
  unit        text not null default 'ud',
  qty         numeric(10,2) not null default 0,
  par         numeric(10,2) not null default 0,
  cost        numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_menu_categories_venue on public.menu_categories(venue_id);
create index if not exists idx_menu_items_venue on public.menu_items(venue_id);
create index if not exists idx_menu_items_category on public.menu_items(category_id);
create index if not exists idx_stock_items_venue on public.stock_items(venue_id);

alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.stock_items enable row level security;

-- Cada restaurante ve y edita solo lo suyo — igual que reservations.
drop policy if exists "menu_categories_own_venue" on public.menu_categories;
create policy "menu_categories_own_venue" on public.menu_categories
  for all using (venue_id = current_venue_id()) with check (venue_id = current_venue_id());

drop policy if exists "menu_items_own_venue" on public.menu_items;
create policy "menu_items_own_venue" on public.menu_items
  for all using (venue_id = current_venue_id()) with check (venue_id = current_venue_id());

drop policy if exists "stock_items_own_venue" on public.stock_items;
create policy "stock_items_own_venue" on public.stock_items
  for all using (venue_id = current_venue_id()) with check (venue_id = current_venue_id());

-- La app de comensales necesita LEER el menú público (para mostrar la carta
-- en la pantalla de detalle del restaurante) — solo lectura, sin importar
-- la cuenta, y solo de platos disponibles.
drop policy if exists "menu_public_read" on public.menu_items;
create policy "menu_public_read" on public.menu_items
  for select using (available = true);

drop policy if exists "menu_categories_public_read" on public.menu_categories;
create policy "menu_categories_public_read" on public.menu_categories
  for select using (true);

-- Verifica después de aplicar:
--   select policyname, cmd, roles from pg_policies
--   where tablename in ('menu_categories', 'menu_items', 'stock_items');
