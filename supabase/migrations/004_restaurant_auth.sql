-- ============================================================================
-- 004_restaurant_auth.sql
-- ============================================================================

-- 1. Vínculo usuario <-> venue. Un usuario, un venue (ajustar si algún día
--    un mismo dueño gestiona varios restaurantes con la misma cuenta).
create table if not exists public.restaurant_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  venue_id   uuid not null references public.venues(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_restaurant_users_venue on public.restaurant_users(venue_id);

alter table public.restaurant_users enable row level security;
create policy "restaurant_users_select_self"
  on public.restaurant_users for select
  using (auth.uid() = user_id);

-- 2. Helper: venue_id del usuario autenticado actual (null si no es restaurante)
create or replace function public.current_venue_id()
returns uuid
language sql
security definer
stable
as $$
  select venue_id from public.restaurant_users where user_id = auth.uid();
$$;

-- 3. RLS en reservations: cada restaurante ve solo lo suyo; admin ve todo
--    (la policy de admin ya existe desde 001_admin_rls.sql — esta se suma,
--    no la sustituye. Postgres RLS es OR entre policies del mismo comando).
create policy "restaurant_own_reservations"
  on public.reservations for select
  using (venue_id = public.current_venue_id());

create policy "restaurant_update_own_reservations"
  on public.reservations for update
  using (venue_id = public.current_venue_id())
  with check (venue_id = public.current_venue_id());

-- 4. RLS en venues: cada restaurante ve/edita solo su propia fila; admin ve todo
create policy "restaurant_own_venue"
  on public.venues for select
  using (id = public.current_venue_id());

create policy "restaurant_update_own_venue"
  on public.venues for update
  using (id = public.current_venue_id())
  with check (id = public.current_venue_id());

-- ============================================================================
-- NOTA: si reservations o venues tienen columnas que un restaurante NO debe
-- poder editar via UPDATE (ej. deposit_status, payment_intent_id — eso lo
-- controla solo el sistema de pagos, no el restaurante a mano), esta policy
-- de UPDATE no lo impide por sí sola. Postgres RLS controla FILAS, no
-- COLUMNAS. Si hace falta restringir columnas específicas, se necesita un
-- trigger BEFORE UPDATE que rechace cambios a esos campos si quien escribe
-- no es admin/service_role. No incluido aquí — evalúa si aplica antes de
-- dar por cerrado el aislamiento contra ediciones indebidas.
-- ============================================================================
