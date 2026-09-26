/* ════ UNA MESA · menu-video-upload ════
   Solo admin. Da soporte a la subida de videos de plato a Cloudflare
   Stream desde el panel de admin, sin que el token de Cloudflare llegue
   nunca al navegador:

     POST { action: 'create', dish_name?, category?, venue_id? }
       -> { uploadURL, uid }
       Crea una "direct creator upload" de Stream. El navegador del admin
       sube el archivo directo a `uploadURL` (URL de un solo uso) — los
       bytes del video no pasan por esta función.

     POST { action: 'status', uid }
       -> { readyToStream, state, errorReason, hls, thumbnail }
       Consulta el procesamiento del video. El navegador hace polling
       hasta readyToStream === true y entonces guarda hls + uid en la
       fila de menu_videos (con su propia sesión de admin, RLS admin-write).

   Env (supabase secrets set):
     CLOUDFLARE_ACCOUNT_ID
     CLOUDFLARE_API_TOKEN
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Cloudflare exige un tope de duración para las subidas directas. Es el
// máximo que se le permite al archivo del admin.
const MAX_DURATION_SECONDS = 600

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cfAccount = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')
  const cfToken = Deno.env.get('CLOUDFLARE_API_TOKEN')

  try {
    if (!cfAccount || !cfToken) {
      return json({ error: 'Cloudflare Stream no está configurado en este entorno' }, 500)
    }

    // 1 · Solo admin — mismo patrón que upload-venue-photo
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'unauthorized' }, 401)

    const sbHeaders = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    }
    const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: authHeader },
    })
    const caller = await callerRes.json()
    if (!caller?.id) return json({ error: 'invalid session' }, 401)

    const adminCheck = await fetch(
      `${supabaseUrl}/rest/v1/admins?user_id=eq.${caller.id}&select=user_id`,
      { headers: sbHeaders },
    )
    const adminRows = await adminCheck.json()
    if (!Array.isArray(adminRows) || adminRows.length === 0) {
      return json({ error: 'forbidden — admin only' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const cfBase = `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/stream`
    const cfHeaders = {
      Authorization: `Bearer ${cfToken}`,
      'Content-Type': 'application/json',
    }

    // 2a · Crear la URL de subida directa
    if (body.action === 'create') {
      const cfRes = await fetch(`${cfBase}/direct_upload`, {
        method: 'POST',
        headers: cfHeaders,
        body: JSON.stringify({
          maxDurationSeconds: MAX_DURATION_SECONDS,
          // Ventana para *empezar* la subida — no limita cuánto puede
          // tardar el archivo en subir una vez arrancó.
          expiry: new Date(Date.now() + 30 * 60_000).toISOString(),
          requireSignedURLs: false,
          thumbnailTimestampPct: 0.5,
          meta: {
            name:
              [body.dish_name, body.category].filter(Boolean).join(' — ') ||
              'Una Mesa dish video',
            una_mesa_venue_id: body.venue_id ?? '',
            uploaded_by: caller.email ?? caller.id,
          },
        }),
      })
      const cf = await cfRes.json()
      if (!cfRes.ok || cf.success === false || !cf.result?.uploadURL) {
        return json({ error: 'cloudflare direct_upload failed', details: cf.errors ?? cf }, 502)
      }
      return json({ uploadURL: cf.result.uploadURL, uid: cf.result.uid })
    }

    // 2b · Estado de procesamiento
    if (body.action === 'status') {
      if (!body.uid) return json({ error: 'uid required' }, 400)
      const cfRes = await fetch(`${cfBase}/${body.uid}`, { headers: cfHeaders })
      const cf = await cfRes.json()
      if (!cfRes.ok || cf.success === false) {
        return json({ error: 'cloudflare status failed', details: cf.errors ?? cf }, 502)
      }
      const v = cf.result
      return json({
        readyToStream: v.readyToStream === true,
        state: v.status?.state ?? null,
        errorReason: v.status?.errorReasonText ?? v.status?.errorReasonCode ?? null,
        hls: v.playback?.hls ?? null,
        thumbnail: v.thumbnail ?? null,
      })
    }

    return json({ error: "action must be 'create' or 'status'" }, 400)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Internal server error' }, 500)
  }
})
