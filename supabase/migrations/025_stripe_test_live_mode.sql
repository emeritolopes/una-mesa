-- 025_stripe_test_live_mode.sql
--
-- Cada restaurante queda marcado como modo 'test' o 'live' — los tres que
-- ya existen (usados por las 27 pruebas automatizadas de ayer) se quedan
-- en 'test' para siempre; cualquier restaurante nuevo entra en 'live' por
-- defecto. Esto es lo que decide, para cada reserva, qué par de claves de
-- Stripe usar.

alter table public.venues
  add column if not exists stripe_mode text not null default 'live'
  check (stripe_mode in ('test', 'live'));

-- Los tres restaurantes de prueba existentes se quedan en modo test,
-- para siempre, para que las pruebas automatizadas nunca toquen dinero real.
update public.venues
set stripe_mode = 'test'
where id in (
  '00000000-0000-0000-0000-000000000001', -- El Bodegón Central
  '11111111-0000-0000-0000-000000000001', -- DiverXO
  '62c7255f-9042-4e97-a764-4e949e19fdfc'  -- Thames Table
);

-- Verifica después de aplicar:
--   select name, stripe_mode from venues order by created_at;
