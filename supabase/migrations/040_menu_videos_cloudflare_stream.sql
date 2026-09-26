-- 040_menu_videos_cloudflare_stream.sql
--
-- Migración del hosting de video de Supabase Storage (bucket menu-videos,
-- .mp4 crudo servido directo) a Cloudflare Stream (HLS). El script
-- scripts/migrate-videos-to-stream.mjs sube cada video a Stream vía la
-- API "copy" (upload-via-URL), espera a que termine de procesarse y
-- reescribe la fila:
--
--   video_url          -> URL de reproducción HLS de Cloudflare (.m3u8)
--   stream_uid         -> UID del video en Cloudflare Stream
--   legacy_storage_url -> URL original de Supabase Storage (para rollback,
--                         y para poder borrar el objeto del bucket una vez
--                         verificada la migración)
--
-- Todas las columnas nuevas son nullable: una fila sin migrar todavía
-- tiene stream_uid = null y video_url apuntando aún a Supabase Storage.

alter table public.menu_videos
  add column if not exists stream_uid text,
  add column if not exists legacy_storage_url text;

comment on column public.menu_videos.stream_uid is
  'Cloudflare Stream video UID. Si no es null, video_url es una URL HLS (.m3u8) de Cloudflare Stream.';
comment on column public.menu_videos.legacy_storage_url is
  'URL original del objeto en el bucket menu-videos de Supabase Storage, previa a la migración a Cloudflare Stream.';

-- Verifica después de correr el script:
--   select dish_name, stream_uid, video_url, legacy_storage_url from menu_videos;
