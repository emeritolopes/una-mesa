-- 038_venue_category_order.sql
--
-- Permite que cada restaurante controle el orden en que aparecen sus
-- categorías en el menú de video (ej. mover "Rice" junto a "Mains" en
-- vez de que siempre caiga al final). Se guarda como texto separado
-- por comas (ej. "Starters,Mains,Rice,Sides,Cocktails,Desserts") —
-- si está vacío, se usa el orden estándar de siempre.

alter table public.venues
  add column if not exists category_order text;

-- Verifica después de aplicar:
--   select id, name, category_order from venues limit 5;
