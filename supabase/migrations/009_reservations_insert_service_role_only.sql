-- 009_reservations_insert_service_role_only.sql
--
-- Ahora que stripe-webhook crea las reservas server-side, verificado por la
-- firma criptográfica de Stripe, ya no existe ningún motivo legítimo para que
-- el cliente (autenticado o no) inserte una fila en `reservations` directo.
-- El único caller que alguna vez lo hizo (booking.jsx → saveReservation) se
-- eliminó en este mismo ciclo de trabajo.
--
-- Sin estas dos políticas, un usuario ya no puede fabricar una reserva
-- 'confirmed' con un payment_intent_id inventado, aunque conozca un venue_id
-- real — el único camino que queda es el webhook, con service_role.

drop policy if exists "Anyone can insert reservations" on public.reservations;
drop policy if exists "Authenticated users can insert reservations" on public.reservations;

-- Verifica después de aplicar que solo quede la política de service_role:
--   select policyname, cmd, roles, with_check from pg_policies
--   where tablename = 'reservations' and cmd = 'INSERT';
-- Debe devolver una sola fila: "Service role can insert reservations".
--
-- Prueba negativa — con cualquier JWT autenticado real, este insert debe
-- rechazarse ahora incluso con un venue_id real y válido:
--   curl -s -X POST ".../rest/v1/reservations" \
--     -H "apikey: <anon key>" -H "Authorization: Bearer <JWT real>" \
--     -H "Content-Type: application/json" \
--     -d '{"venue_id":"<uuid real de venues>","customer_name":"RLS Test 3","pax":1,"date":"2026-08-01","time":"20:00","status":"confirmed"}'
-- Debe devolver 42501 (row-level security violation), no crear la fila.
