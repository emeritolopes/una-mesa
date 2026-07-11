-- 015_due_capture_connect_account.sql
--
-- reservations_due_capture ya hace join con venues para timezone/grace
-- period — le agregamos stripe_connect_account_id a lo que expone, así
-- auto-capture sabe en qué cuenta conectada capturar cada depósito sin
-- tener que hacer una consulta aparte por cada fila del lote.

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
  v.stripe_connect_account_id,
  (r.date::date + r."time"::time) at time zone coalesce(v.timezone, 'Europe/Madrid')
    + (v.grace_period_minutes || ' minutes')::interval as capture_after
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
--   select column_name from information_schema.columns
--   where table_name = 'reservations_due_capture' and column_name = 'stripe_connect_account_id';
