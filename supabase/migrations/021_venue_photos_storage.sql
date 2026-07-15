-- 021_venue_photos_storage.sql
--
-- Bucket de Storage para fotos de restaurantes — antes solo se podía pegar
-- una URL de una foto ya alojada en otro sitio. Ahora se puede subir un
-- archivo real desde el ordenador, vía la función upload-venue-photo
-- (admin-only, usa service_role — no necesita política de escritura
-- pública en el bucket).

insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;

-- Lectura pública — las fotos tienen que verse en la app de comensales
-- sin login. La escritura NO se abre aquí a propósito: solo la función
-- upload-venue-photo (con service_role, que evita RLS por completo) puede
-- subir archivos — así el bucket nunca queda abierto a subidas anónimas.
drop policy if exists "venue_photos_public_read" on storage.objects;
create policy "venue_photos_public_read" on storage.objects
  for select using (bucket_id = 'venue-photos');

-- Verifica después de aplicar:
--   select id, name, public from storage.buckets where id = 'venue-photos';
