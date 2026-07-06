-- 006_venue_currency.sql
-- La moneda del cobro es una propiedad del RESTAURANTE, no del mercado del
-- comensal que navega (.co vs .co.uk). Hasta ahora 'eur' estaba hardcodeado
-- en el cliente y el servidor lo aceptaba sin validar — funcionaba por
-- coincidencia porque todos los restaurantes actuales son españoles, no
-- porque el sistema supiera de verdad la moneda de cada uno.

alter table public.venues
  add column if not exists currency text not null default 'eur';

comment on column public.venues.currency is
  'Moneda ISO 4217 en minúsculas (eur, gbp, ...) en la que este restaurante cobra el depósito vía Stripe. Se asigna al onboardear el restaurante, no se infiere del mercado del comensal.';

-- Verifica después de aplicar:
--   select name, currency, deposit_amount from public.venues;
-- Todos los restaurantes existentes deben mostrar 'eur' — si alguno no,
-- revisa antes de seguir.
