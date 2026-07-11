-- 016_due_capture_column_order_fix.sql
--
-- 015 falló al aplicar: CREATE OR REPLACE VIEW no permite reordenar
-- columnas existentes, solo agregar nuevas al final. Puse
-- stripe_connect_account_id ANTES de capture_after (la última columna
-- original), y Postgres lo interpretó como un intento de renombrar
-- capture_after en vez de agregar una columna — y lo rechazó.
--
-- Esta vez, stripe_connect_account_id va al final, después de
-- capture_after, preservando el orden original.

create or replace view reservations_due_capture as
select
  r.id,
  r.payment_intent_id,
  r.date,
  r."time",
  r.deposit_status,
  r.status,
  r.venue_id,
  v.grace_period_minutes,
  (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
    + (v.grace_period_minutes || ' minutes')::interval as capture_after,
  v.stripe_connect_account_id
from reservations r
join venues v on v.id = r.venue_id
where
  r.payment_intent_id is not null
  and r.status not in ('cancelled', 'completed', 'no_show')
  and (
    r.deposit_status is null
    or r.deposit_status not in ('capturing', 'captured', 'capture_failed', 'refunded')
  )
  and (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
    + (v.grace_period_minutes || ' minutes')::interval < now();

-- Verifica después de aplicar:
--   select column_name, ordinal_position from information_schema.columns
--   where table_name = 'reservations_due_capture' order by ordinal_position;
-- stripe_connect_account_id debe aparecer, en la última posición.
