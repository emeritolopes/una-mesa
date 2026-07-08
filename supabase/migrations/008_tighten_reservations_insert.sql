-- 008_tighten_reservations_insert.sql
--
-- La política "Authenticated users can insert reservations" tenía
-- with_check: true — sin ninguna restricción — sentada junto a
-- "Anyone can insert reservations" (public), que sí exige que el venue_id
-- sea real. Como las políticas RLS se combinan con OR, la abierta anulaba
-- a la restringida: cualquier usuario autenticado podía insertar una
-- reserva con cualquier venue_id (incluso uno inexistente), status
-- 'confirmed', y un payment_intent_id inventado.
--
-- Esto NO resuelve la verificación de que payment_intent_id corresponda a
-- un cobro real de Stripe — eso requiere confirmación por webhook del lado
-- del servidor, no algo que RLS pueda expresar. Lo que sí cierra: alinea a
-- los usuarios autenticados con la misma restricción mínima que ya existía
-- para invitados (venue_id debe existir en `venues`).

drop policy if exists "Authenticated users can insert reservations" on public.reservations;

create policy "Authenticated users can insert reservations"
  on public.reservations
  for insert
  to authenticated
  with check (venue_id in (select id from public.venues));

-- Verifica después de aplicar:
--   select policyname, cmd, roles, with_check from pg_policies
--   where tablename = 'reservations' and cmd = 'INSERT';
-- Las políticas de "authenticated" y "public" deben mostrar la misma
-- condición de venue_id — ninguna debe decir with_check: true a secas.
--
-- PENDIENTE, fuera del alcance de esta migración: nada aquí impide que
-- alguien inserte status:'confirmed' con un payment_intent_id fabricado
-- que nunca pasó por Stripe. Cerrar eso requiere verificar el pago vía
-- webhook de Stripe antes de aceptar el insert, no una regla de RLS.
