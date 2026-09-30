-- 047_security_hardening.sql
-- Cierra 4 agujeros detectados revisando pg_policies (30-sep-2026):
--  1. customers: cualquier usuario autenticado (incluido un comensal) podía leer y
--     modificar los clientes de TODOS los restaurantes.
--  2. venues: un restaurante podía editar desde el navegador sus campos de Stripe,
--     platform_fee_cents, plan, etc.
--  3. reservations: un restaurante podía editar deposit_status / payment_intent_id / venue_id.
--  4. generate_noshow_token / generate_cancel_token ejecutables por anon.
-- Las edge functions usan service_role (auth.uid() is null) y no se ven afectadas.
-- Idempotente: se puede ejecutar más de una vez.

-- 1. customers ---------------------------------------------------------------
drop policy if exists "Authenticated can read customers"   on public.customers;
drop policy if exists "Authenticated can update customers" on public.customers;
drop policy if exists "restaurant_read_own_customers"   on public.customers;
drop policy if exists "restaurant_update_own_customers" on public.customers;
drop policy if exists "admin_all_customers"             on public.customers;

create policy "restaurant_read_own_customers" on public.customers
  for select to authenticated
  using (venue_id = public.current_venue_id());

create policy "restaurant_update_own_customers" on public.customers
  for update to authenticated
  using (venue_id = public.current_venue_id())
  with check (venue_id = public.current_venue_id());

create policy "admin_all_customers" on public.customers
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- 2 y 3. columnas protegidas -------------------------------------------------
create or replace function public.protect_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  cols text[] := tg_argv;
begin
  -- service_role / cron / postgres: auth.uid() es null -> sin restricción
  if auth.uid() is null then return new; end if;
  -- admins de Una Mesa: sin restricción
  if exists (select 1 from public.admins a where a.user_id = auth.uid()) then return new; end if;

  foreach k in array cols loop
    if (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k) then
      raise exception 'Column % on % cannot be modified from the client', k, tg_table_name
        using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists venues_protect_columns on public.venues;
create trigger venues_protect_columns
  before update on public.venues
  for each row execute function public.protect_columns(
    'stripe_connect_account_id', 'stripe_charges_enabled', 'stripe_mode',
    'platform_fee_cents', 'plan', 'backofhouse_hidden_modules', 'archived', 'slug'
  );

drop trigger if exists reservations_protect_columns on public.reservations;
create trigger reservations_protect_columns
  before update on public.reservations
  for each row execute function public.protect_columns(
    'deposit_status', 'payment_intent_id', 'deposit_amount', 'venue_id', 'user_id',
    'acquisition_source', 'acquisition_medium', 'acquisition_campaign'
  );

-- 4. generadores de token: solo service_role -------------------------------
revoke execute on function public.generate_noshow_token(uuid) from public, anon, authenticated;
revoke execute on function public.generate_cancel_token(uuid) from public, anon, authenticated;
grant  execute on function public.generate_noshow_token(uuid) to service_role;
grant  execute on function public.generate_cancel_token(uuid) to service_role;
