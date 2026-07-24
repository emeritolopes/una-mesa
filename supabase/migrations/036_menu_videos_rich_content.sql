-- 036_menu_videos_rich_content.sql
--
-- La página de menú en video se rediseñó con un formato mucho más rico
-- (historia del plato, macros, insignia de "elección del chef", imagen
-- de portada para el carrusel) — se necesitan campos nuevos para todo
-- eso. Todos opcionales, para no romper los videos ya cargados.

alter table public.menu_videos
  add column if not exists subtitle text,
  add column if not exists story_quote text,
  add column if not exists story_body text,
  add column if not exists carbs_g int,
  add column if not exists fats_g int,
  add column if not exists is_chefs_choice boolean not null default false,
  add column if not exists thumbnail_url text;

-- Verifica después de aplicar:
--   select dish_name, subtitle, is_chefs_choice from menu_videos;
