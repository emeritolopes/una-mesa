-- 045 · Origen de cada reserva (Google, Instagram, directo…)
-- Columnas nullable: las reservas antiguas quedan en NULL ("sin dato").
alter table public.reservations
  add column if not exists acquisition_source   text,
  add column if not exists acquisition_medium   text,
  add column if not exists acquisition_campaign text;

create index if not exists reservations_acq_source_idx
  on public.reservations (venue_id, acquisition_source);
