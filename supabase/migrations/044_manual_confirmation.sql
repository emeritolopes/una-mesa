-- 044 · Confirmación manual por el restaurante + límite de cubiertos por servicio
--
-- Ambas opciones son OPT-IN por restaurante y están apagadas por defecto:
-- ningún restaurante existente cambia de comportamiento al aplicar esta migración.
--
--   venues.manual_confirmation     true → las reservas SIN depósito nacen 'pending' y
--                                  el restaurante recibe un email con botones de
--                                  confirmar / rechazar (función respond-reservation).
--   venues.max_covers_per_service  tope de cubiertos que Una Mesa acepta por servicio
--                                  (comida < 17:00, cena >= 17:00) y día. NULL = sin tope.
--                                  Solo cuenta reservas hechas en Una Mesa: no ve las de
--                                  otros sistemas (p. ej. ResDiary).
--
-- reservation_response_tokens: enlaces de un solo uso para confirmar/rechazar, mismo
-- patrón que noshow_tokens. RLS activado y SIN políticas: solo la service role
-- (las Edge Functions) puede leer o escribir.

alter table public.venues
  add column if not exists manual_confirmation boolean not null default false,
  add column if not exists max_covers_per_service integer
    check (max_covers_per_service is null or max_covers_per_service > 0);

create table if not exists public.reservation_response_tokens (
  id             uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  token          uuid not null default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  used_at        timestamptz
);

create unique index if not exists reservation_response_tokens_token_idx
  on public.reservation_response_tokens(token);
create index if not exists reservation_response_tokens_reservation_idx
  on public.reservation_response_tokens(reservation_id);

alter table public.reservation_response_tokens enable row level security;
