-- 005_admin_table.sql
-- La tabla `admins` nunca existió en el repo — 004_restaurant_auth.sql la referencia
-- como si viniera de "001_admin_rls.sql", archivo que no existe en el historial de
-- migraciones. invite-restaurant/index.ts consulta esta tabla usando la
-- SERVICE ROLE KEY (bypassa RLS), así que la política de abajo es defensa en
-- profundidad para cualquier consulta futura desde el cliente — no es lo que
-- hace funcionar invite-restaurant en sí.

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Un admin puede leer su propia fila (para chequeos client-side tipo "¿soy admin?").
-- Nadie puede insertar/actualizar/borrar vía cliente — eso queda solo para
-- service role, para que nadie pueda auto-promoverse a admin desde el frontend.
create policy "admins_select_self"
  on public.admins for select
  using (auth.uid() = user_id);

-- ============================================================================
-- ⚠️  REEMPLAZA el email de abajo por el tuyo real antes de correr esto.
-- No adiviné tu UUID — este INSERT lo resuelve por email contra auth.users,
-- que es más seguro que pegar un UUID a mano y equivocarse de dígito.
-- ============================================================================
insert into public.admins (user_id, email)
select id, email
from auth.users
where email = 'unamesagroup@gmail.com'
on conflict (user_id) do nothing;

-- Verifica después de correr la migración:
--   select * from public.admins;
-- Debe devolver exactamente 1 fila con tu email. Si devuelve 0 filas, el
-- email no coincidía con ningún auth.users.email — revisa el email exacto
-- con el que hiciste login por Google OAuth (puede no ser el que esperas
-- si Google normaliza mayúsculas/alias).
