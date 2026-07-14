-- 019_close_menu_categories_items_leak.sql
--
-- menu_categories y menu_items ya existían antes de la migración 018 (por
-- eso dijo "already exists, skipping") — con una política heredada,
-- "Allow all for authenticated", que deja que CUALQUIER cuenta autenticada
-- (de cualquier restaurante, o un comensal normal) lea, escriba o borre el
-- menú de cualquier restaurante, no solo el propio. Mismo patrón que ya
-- cerramos hoy en reservations y cancellations — una tabla fantasma con un
-- permiso abierto que ninguna migración nueva toca porque asume que la
-- tabla no existía.

drop policy if exists "Allow all for authenticated" on public.menu_categories;
drop policy if exists "Allow all for authenticated" on public.menu_items;

-- Verifica después de aplicar — deben quedar exactamente estas políticas:
--   select tablename, policyname, cmd from pg_policies
--   where tablename in ('menu_categories', 'menu_items', 'stock_items');
-- menu_categories: menu_categories_own_venue (ALL), menu_categories_public_read (SELECT)
-- menu_items: menu_items_own_venue (ALL), menu_public_read (SELECT)
-- stock_items: stock_items_own_venue (ALL)
