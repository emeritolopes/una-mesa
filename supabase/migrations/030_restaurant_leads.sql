-- 030_restaurant_leads.sql
--
-- Formulario de interés en la nueva página de restaurantes — captura el
-- lead, tú lo sigues manualmente después (no crea un restaurante real
-- directo, evita perder control de calidad sobre quién aparece listado).

create table if not exists public.restaurant_leads (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  contact_name text,
  email text not null,
  phone text,
  city text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.restaurant_leads enable row level security;

-- Cualquiera puede mandar el formulario — pero solo el admin puede leer
-- los leads después.
drop policy if exists "restaurant_leads_public_insert" on public.restaurant_leads;
create policy "restaurant_leads_public_insert" on public.restaurant_leads
  for insert with check (true);

drop policy if exists "restaurant_leads_admin_read" on public.restaurant_leads;
create policy "restaurant_leads_admin_read" on public.restaurant_leads
  for select using (exists (select 1 from admins where user_id = auth.uid()));

-- Verifica después de aplicar:
--   select * from restaurant_leads order by created_at desc;
