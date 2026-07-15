-- 020_close_venues_public_write.sql
--
-- "Public can update venues" (roles: public, qual: true, with_check: true)
-- dejaba que CUALQUIERA, sin login de ningún tipo, editara cualquier campo
-- de cualquier restaurante — incluido a qué cuenta de Stripe le llega el
-- dinero de los depósitos (stripe_connect_account_id) y el monto del
-- depósito mismo. Confirmado con una escritura real usando solo la clave
-- anónima antes de este fix.
--
-- No hace falta agregar ninguna política nueva para que los admins
-- puedan editar: las funciones de Edge (create-venue, la futura
-- update-venue) usan el service_role, que ya evita RLS por completo. Y
-- "restaurant_update_own_venue" (id = current_venue_id()) ya deja que
-- cada restaurante edite lo suyo desde su propia sesión — eso se queda,
-- solo se cierra el acceso público sin restricción.

drop policy if exists "Public can update venues" on public.venues;

-- Verifica después de aplicar:
--   select policyname, cmd, roles from pg_policies where tablename = 'venues';
-- Debe quedar: Public can read venues (SELECT), restaurant_own_venue (SELECT),
-- restaurant_update_own_venue (UPDATE) — sin ningún "Public can update".
