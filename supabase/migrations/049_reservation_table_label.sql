-- 049_reservation_table_label.sql
-- reservations solo tenía table_id (sin tabla de mesas en el repo); backofhouse trabaja con
-- etiquetas de mesa ("T3"). Antes la asignación de mesa se perdía al recargar porque el
-- panel escribía en una columna que no existe. table_label la guarda.
alter table public.reservations add column if not exists table_label text;
