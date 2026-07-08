-- 007_close_reservations_rls_leak.sql
--
-- CRÍTICO: la tabla `reservations` tenía tres políticas RLS permisivas con
-- condición `true` (o sin condición real pese al nombre) que anulaban a las
-- dos políticas correctamente restringidas ya existentes. Resultado: con solo
-- la clave anon pública, sin ningún login, se podía leer la tabla completa de
-- reservas de todos los restaurantes (nombres, teléfonos, emails, IDs de pago).
--
-- En Postgres, las políticas RLS son permisivas por defecto: si CUALQUIER
-- política aplicable evalúa a true, la fila es visible/editable. No basta con
-- tener políticas correctas — hay que asegurarse de que no exista ninguna
-- política abierta compitiendo con ellas.

-- 1. "Anyone can read reservations" — public, qual: true. Fuga de lectura total.
drop policy if exists "Anyone can read reservations" on public.reservations;

-- 2. "Authenticated can read own venue reservations" — el nombre sugiere estar
--    filtrada por venue, pero su condición real es `true`. Es un duplicado sin
--    terminar de `restaurant_own_reservations` (que sí filtra correctamente).
drop policy if exists "Authenticated can read own venue reservations" on public.reservations;

-- 3. "Allow all for authenticated" — cmd ALL (incluye UPDATE/DELETE), qual: true.
--    Cualquier usuario autenticado podía modificar o borrar cualquier reserva
--    de cualquier restaurante o cliente, no solo leerla.
drop policy if exists "Allow all for authenticated" on public.reservations;

-- Verifica después de aplicar que solo queden políticas con condiciones reales:
--   select policyname, cmd, roles, qual from pg_policies where tablename = 'reservations';
-- Ninguna fila debe mostrar qual = 'true' salvo las de INSERT (que usan
-- with_check, no qual, y se revisan aparte).
--
-- Verifica también, sin ningún token de autenticación, que la fuga se cerró:
--   curl -s "https://<project>.supabase.co/rest/v1/reservations?select=*" \
--     -H "apikey: <anon key>" -H "Authorization: Bearer <anon key>"
-- Debe devolver [] o un error de permisos — nunca filas.
