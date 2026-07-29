-- 037_admin_venues_write.sql
--
-- La migración 020 cerró correctamente el acceso público sin control a
-- "venues" (una escritura previa dejaba que cualquiera, sin sesión,
-- cambiara a qué Stripe le llegaba el dinero). Pero nunca se agregó el
-- reemplazo correcto para los admins — el nuevo panel de administración
-- edita venues directo desde el navegador con la clave anónima, y sin
-- esta política, esas actualizaciones fallan en silencio (0 filas
-- afectadas, sin error visible) por falta de permiso, no por un bug de
-- código.

drop policy if exists "admin_can_update_venues" on public.venues;
create policy "admin_can_update_venues" on public.venues
  for update using (
    exists (select 1 from admins where user_id = auth.uid())
  )
  with check (
    exists (select 1 from admins where user_id = auth.uid())
  );

drop policy if exists "admin_can_insert_venues" on public.venues;
create policy "admin_can_insert_venues" on public.venues
  for insert with check (
    exists (select 1 from admins where user_id = auth.uid())
  );

-- Verifica después de aplicar:
--   select policyname, cmd, roles from pg_policies where tablename = 'venues';
-- Debe aparecer admin_can_update_venues (UPDATE) y admin_can_insert_venues (INSERT)
-- junto a las que ya existían.
