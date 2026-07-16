-- 026_due_capture_stripe_mode.sql
--
-- reservations_due_capture necesita saber el modo (test/live) de cada
-- restaurante, para que auto-capture use la clave de Stripe correcta por
-- fila — un mismo lote puede mezclar restaurantes de prueba y reales.

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
  v.stripe_connect_account_id,
  v.stripe_mode
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
--   where table_name = 'reservations_due_capture' and column_name = 'stripe_mode';
