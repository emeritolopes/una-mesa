-- 011_close_cancellations_insert_leak.sql
--
-- La migración anterior (010) asumió que `cancellations` no existía todavía
-- (create table if not exists) — pero sí existía, con sus propias políticas
-- sin versionar. Mis políticas nuevas se sumaron al lado de las viejas en
-- vez de reemplazarlas. Una de las viejas, "Anyone can insert cancellations"
-- (public, with_check: true), deja que cualquiera sin login inserte
-- registros de cancelación falsos — el mismo patrón que ya cerramos dos
-- veces hoy en `reservations`.
--
-- "Users see own cancellations" es funcionalmente idéntica a
-- cancellations_customer_read_own (misma condición, distinto nombre) —
-- redundante, no peligrosa, pero la quito para no dejar dos políticas
-- que hacen lo mismo con nombres distintos.

drop policy if exists "Anyone can insert cancellations" on public.cancellations;
drop policy if exists "Users see own cancellations" on public.cancellations;

-- Verifica después de aplicar — deben quedar exactamente 3 políticas:
--   select policyname, cmd, roles from pg_policies where tablename = 'cancellations';
-- cancellations_service_role_all (ALL, service_role)
-- cancellations_customer_read_own (SELECT, public, user_id = auth.uid())
-- cancellations_restaurant_read_own (SELECT, public, venue-scoped)
--
-- Prueba negativa — sin ningún login, con solo la anon key, esto debe
-- rechazarse ahora:
--   curl -s -X POST ".../rest/v1/cancellations" \
--     -H "apikey: <anon key>" -H "Content-Type: application/json" \
--     -d '{"reservation_id":"<cualquier uuid>","reason":"fake","refund_amount":999999}'
-- Debe dar 42501, no crear la fila.
