-- 039_venue_slug.sql
--
-- El video-menú usa hoy /menu-video/?venue=<uuid> — funciona, pero un QR
-- con un UUID de 36 caracteres no es nada legible ni memorizable. Esto
-- añade un slug humano (ej. 'mykopitiam') como alternativa de búsqueda,
-- sin quitar ni renombrar la columna id — el resto del sistema (reservas,
-- Stripe, menu_videos.venue_id, etc.) sigue usando el uuid real tal cual.
--
-- venues en sí no está en el historial de migraciones (se creó a mano en
-- el dashboard antes de que existiera esta carpeta) — igual que el resto
-- de columnas añadidas en migraciones anteriores, esta solo hace ALTER
-- TABLE sobre esa base ya existente.

create extension if not exists unaccent;

alter table public.venues
  add column if not exists slug text;

-- 1 · Backfill de los venues que ya existen. Sin colisiones conocidas hoy
--    (8 nombres, todos distintos) — si alguna vez dos coincidieran, esta
--    UPDATE fallaría al llegar al UNIQUE constraint del paso 3, visible
--    de inmediato en vez de guardar un duplicado silencioso.
update public.venues
set slug = trim(both '-' from lower(regexp_replace(unaccent(name), '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null;

-- 2 · A partir de aquí, todo venue debe tener slug — lo garantiza el
--    trigger de abajo para los nuevos, y el backfill de arriba para los
--    que ya existían.
alter table public.venues
  alter column slug set not null;

alter table public.venues
  add constraint venues_slug_unique unique (slug);

-- 3 · Autogenerar el slug en cada alta nueva — cubre los dos caminos que
--    insertan en venues hoy (create-venue edge function y el alta directa
--    de apps/admin/index.html) sin tener que duplicar esta lógica en
--    Deno y en JS vanilla por separado. security definer: igual que
--    current_venue_id() en 004_restaurant_auth.sql, necesita ver TODOS
--    los slugs existentes para no chocar con ninguno, sin importar qué
--    política de SELECT tenga el rol que hace el INSERT.
create or replace function generate_venue_slug()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base_slug text;
  candidate text;
  suffix int := 1;
begin
  -- Si ya viene con un slug explícito (ej. uno elegido a mano para un
  -- cliente importante), se respeta tal cual — esto solo rellena cuando
  -- falta.
  if new.slug is not null then
    return new;
  end if;

  base_slug := trim(both '-' from lower(regexp_replace(unaccent(new.name), '[^a-zA-Z0-9]+', '-', 'g')));
  candidate := base_slug;

  -- Colisión (dos venues con el mismo nombre, o que reducen al mismo
  -- slug) se resuelve con sufijo numérico — nunca deja que el INSERT
  -- falle por esto, ya que ni create-venue ni apps/admin/index.html
  -- saben hoy nada de slugs y no podrían mostrar un error útil.
  while exists (select 1 from public.venues where slug = candidate) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists venues_generate_slug on public.venues;
create trigger venues_generate_slug
  before insert on public.venues
  for each row
  execute function generate_venue_slug();

-- NOTA: a propósito BEFORE INSERT, no BEFORE INSERT OR UPDATE — el slug
-- se fija una sola vez al crear el restaurante y no se toca si cambia de
-- nombre después, para que un QR ya impreso nunca deje de funcionar.
-- Sigue siendo editable a mano vía UPDATE si hace falta corregirlo antes
-- de imprimir el QR (sin guarda adicional — decisión explícita).

-- Verifica después de aplicar:
--   select name, slug from public.venues order by name;
-- Los 8 venues actuales deben tener slug no nulo y único, ej. MyKopitiam -> mykopitiam.
--   select tgname, tgrelid::regclass from pg_trigger where tgrelid = 'public.venues'::regclass;
-- Debe aparecer venues_generate_slug.
