-- 033_lead_rate_limit.sql
--
-- El formulario de restaurantes es público, sin login — cualquiera (o un
-- bot) podría mandar cientos de envíos falsos, cada uno disparando un
-- email real vía Resend. Guardamos la IP de cada envío para poder
-- limitar la frecuencia desde la función.

alter table public.restaurant_leads
  add column if not exists ip_address text;

create index if not exists restaurant_leads_ip_created_idx
  on public.restaurant_leads (ip_address, created_at);

-- Verifica después de aplicar:
--   select ip_address, count(*) from restaurant_leads group by ip_address order by count(*) desc;
