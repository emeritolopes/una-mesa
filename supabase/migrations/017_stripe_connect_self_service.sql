-- 017_stripe_connect_self_service.sql
--
-- Permite que el propio restaurante complete su onboarding de Stripe Connect
-- con un link que Emerito genera una vez y envía por email — sin que Emerito
-- tenga que correr curl a mano cada vez, y sin que el restaurante necesite
-- ninguna cuenta ni login en Una Mesa.
--
-- Seguridad: el token es un UUID no adivinable, no el venue_id — y la
-- función que lo consume se niega a generar un nuevo link de Stripe si el
-- restaurante YA completó la verificación (stripe_charges_enabled = true),
-- para que nadie pueda reabrir el formulario de una cuenta activa y
-- cambiarle la cuenta bancaria de destino.

alter table public.venues
  add column if not exists stripe_connect_invite_token uuid,
  add column if not exists stripe_connect_invite_expires_at timestamptz;

create unique index if not exists venues_stripe_connect_invite_token_idx
  on public.venues(stripe_connect_invite_token)
  where stripe_connect_invite_token is not null;

-- Verifica después de aplicar:
--   select column_name from information_schema.columns where table_name = 'venues'
--   and column_name like 'stripe_connect_invite%';
