-- 014_stripe_connect.sql
--
-- Primera pieza del cambio a Stripe Connect: el dinero del depósito pasará
-- directo a la cuenta del restaurante (destination charge), Una Mesa se
-- queda solo con una comisión fija por reserva vía application_fee_amount.
-- Esto reduce la exposición regulatoria (nunca se retienen fondos de
-- terceros) y es independiente de si el restaurante usa backofhouse o solo
-- la web de reservas.

alter table public.venues
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists platform_fee_cents integer not null default 100; -- 1€ por defecto

-- Verifica después de aplicar:
--   select column_name from information_schema.columns where table_name = 'venues'
--   and column_name like 'stripe%' or column_name = 'platform_fee_cents';
