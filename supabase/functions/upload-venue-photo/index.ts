/* ════ UNA MESA · upload-venue-photo ════
   Solo admin. Sube una foto de restaurante real (desde el ordenador) al
   bucket de Storage, en vez de exigir pegar una URL de una foto ya
   alojada en otro sitio. Devuelve la URL pública para guardarla en
   venues.photo_url (vía create-venue / update-venue).

   POST { file_base64, content_type, filename }
   file_base64: el archivo entero codificado en base64 (sin el prefijo
     "data:image/...;base64," — solo los bytes).
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
}
const MAX_BYTES = 8 * 1024 * 1024 // 8MB

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    // 1 · Solo admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

    const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: authHeader } })
    const caller = await callerRes.json()
    if (!caller?.id) return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers: corsHeaders })

    const adminCheck = await fetch(`${supabaseUrl}/rest/v1/admins?user_id=eq.${caller.id}&select=user_id`, { headers: h })
    const adminRows = await adminCheck.json()
    if (!Array.isArray(adminRows) || adminRows.length === 0) {
      return new Response(JSON.stringify({ error: 'forbidden — admin only' }), { status: 403, headers: corsHeaders })
    }

    const { file_base64, content_type } = await req.json()
    if (!file_base64 || !content_type) {
      return new Response(JSON.stringify({ error: 'file_base64 and content_type required' }), { status: 400, headers: corsHeaders })
    }

    const ext = ALLOWED_TYPES[content_type]
    if (!ext) {
      return new Response(JSON.stringify({ error: 'unsupported file type — use JPEG, PNG, or WEBP' }), { status: 400, headers: corsHeaders })
    }

    // Decodificar base64 a bytes reales
    const bytes = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0))
    if (bytes.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: 'file too large — max 8MB' }), { status: 413, headers: corsHeaders })
    }

    const path = `${crypto.randomUUID()}.${ext}`
    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/venue-photos/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': content_type,
        'x-upsert': 'false',
      },
      body: bytes,
    })

    if (!uploadRes.ok) {
      const details = await uploadRes.text()
      return new Response(JSON.stringify({ error: 'upload failed', details }), { status: 500, headers: corsHeaders })
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/venue-photos/${path}`
    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
