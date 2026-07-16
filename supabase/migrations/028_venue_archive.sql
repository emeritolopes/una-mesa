-- 028_venue_archive.sql
--
-- "Eliminar" un restaurante = ocultarlo de la web para los comensales,
-- nunca borrar la fila — así se conserva el historial de reservas, menú
-- e inventario, y se puede reactivar si fue un error.

alter table public.venues
  add column if not exists archived boolean not null default false;

-- Verifica después de aplicar:
--   select name, archived from venues;
