-- 043_backofhouse_modules.sql
--
-- 1. Per-venue list of backofhouse modules to hide from the restaurant's
--    sidebar, managed from the admin panel (Restaurantes → Editar →
--    Backofhouse). Values are backofhouse view ids:
--    panel, reservas, tpv, cocina, carta, stock, personal, informes,
--    analytics, ajustes. Empty = everything visible.
--    This only declutters the UI — it is not a permission boundary (the
--    restaurant can still read its own data through RLS as before).
--
-- 2. Admins can read restaurant_users, so the admin panel can show which
--    venues have a backofhouse login. Previously only
--    restaurant_users_select_self existed, so admins saw nothing.

alter table public.venues
  add column if not exists backofhouse_hidden_modules text[] not null default '{}';

comment on column public.venues.backofhouse_hidden_modules is
  'Backofhouse views hidden for this venue (panel, reservas, tpv, cocina, carta, stock, personal, informes, analytics, ajustes). Set from the admin panel.';

drop policy if exists "admin_read_restaurant_users" on public.restaurant_users;
create policy "admin_read_restaurant_users"
  on public.restaurant_users for select
  using (exists (select 1 from public.admins where user_id = auth.uid()));

-- Verify:
--   select name, backofhouse_hidden_modules from venues;
--   select policyname, cmd from pg_policies where tablename = 'restaurant_users';
