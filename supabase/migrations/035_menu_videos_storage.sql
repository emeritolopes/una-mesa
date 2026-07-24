-- 035_menu_videos_storage.sql
--
-- Espacio de almacenamiento público para los videos reales de cada
-- plato — mismo patrón que venue-photos, pero para video.

insert into storage.buckets (id, name, public)
values ('menu-videos', 'menu-videos', true)
on conflict (id) do nothing;

-- Lectura pública (cualquiera puede ver un video ya subido)
drop policy if exists "menu_videos_bucket_public_read" on storage.objects;
create policy "menu_videos_bucket_public_read" on storage.objects
  for select using (bucket_id = 'menu-videos');

-- Solo admin puede subir/borrar — se hace desde el dashboard de Supabase
-- directamente por ahora, no hay panel propio todavía.
drop policy if exists "menu_videos_bucket_admin_write" on storage.objects;
create policy "menu_videos_bucket_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'menu-videos' and exists (select 1 from admins where user_id = auth.uid())
  );

drop policy if exists "menu_videos_bucket_admin_delete" on storage.objects;
create policy "menu_videos_bucket_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'menu-videos' and exists (select 1 from admins where user_id = auth.uid())
  );
