-- 015_due_capture_connect_account.sql
--
-- reservations_due_capture ya hace join con venues para timezone/grace
-- period — le agregamos stripe_connect_account_id a lo que expone, así
-- auto-capture sabe en qué cuenta conectada capturar cada depósito sin
-- tener que hacer una consulta aparte por cada fila del lote.
--
-- NOTA: stripe_connect_account_id va al FINAL de la lista de columnas,
-- después de capture_after — CREATE OR REPLACE VIEW no permite reordenar
-- columnas existentes, solo agregar nuevas al final. Un primer intento de
-- esta migración la puso antes de capture_after y Postgres la rechazó
-- (interpretó eso como un intento de renombrar capture_after). Como esa
-- primera versión nunca llegó a aplicarse con éxito, se corrige aquí mismo
-- en vez de dejar un archivo de parche aparte.

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
