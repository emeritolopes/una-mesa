-- 024_test_helper_force_stuck.sql
--
-- Función exclusiva para las pruebas automatizadas — el trigger
-- reservations_set_updated_at (023) sobreescribe updated_at a "ahora" en
-- cualquier UPDATE normal, a propósito, para que nadie pueda falsificarlo
-- en producción. Pero eso mismo impide que una prueba simule "hace 15
-- minutos" sin esperar 15 minutos de verdad. Esta función desactiva el
-- trigger solo para esta escritura puntual, y lo vuelve a activar de
-- inmediato — nunca deja el trigger apagado más que una transacción.

create or replace function test_force_stuck_reservation(p_reservation_id uuid, p_minutes_ago integer)
returns void
language plpgsql
security definer
as $$
begin
  alter table reservations disable trigger reservations_set_updated_at;
  update reservations
  set deposit_status = 'capturing',
      updated_at = now() - (p_minutes_ago || ' minutes')::interval
  where id = p_reservation_id;
  alter table reservations enable trigger reservations_set_updated_at;
end;
$$;

-- Verifica después de aplicar:
--   select test_force_stuck_reservation('<algún id de prueba>', 15);
--   select * from find_stuck_reservations(); -- debe aparecer
