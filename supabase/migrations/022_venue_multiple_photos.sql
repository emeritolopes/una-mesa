-- 022_venue_multiple_photos.sql
--
-- Antes solo se podía guardar una foto (photo_url). Ahora se guardan hasta
-- 10, en photo_urls (array ordenado) — photo_url se mantiene como la
-- "portada" (la primera del array), para que todo lo que ya lee photo_url
-- directamente (tarjetas, listados) siga funcionando sin cambios.

alter table public.venues
  add column if not exists photo_urls text[] not null default '{}';

-- Migra los datos existentes: si ya había una photo_url suelta, que quede
-- como la primera del array nuevo, en vez de perderse.
update public.venues
set photo_urls = array[photo_url]
where photo_url is not null and photo_url <> '' and photo_urls = '{}';

-- Verifica después de aplicar:
--   select id, name, photo_url, photo_urls from venues where photo_url is not null;
