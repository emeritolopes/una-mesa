/* ════ UNA MESA · submit-restaurant-lead ════
   Pública, sin login — recibe el formulario de "interés" de la página de
   restaurantes. Guarda el lead y avisa por email al admin, para que
   siga el proceso manual de siempre (no crea un restaurante real solo).
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ADMIN_NOTIFY_EMAIL = 'unamesagroup@gmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    const body = await req.json()
    const { restaurant_name, contact_name, email, phone, city, message } = body

    if (!restaurant_name || !email) {
      return new Response(JSON.stringify({ error: 'restaurant_name and email are required' }), { status: 400, headers: corsHeaders })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    // Límite de frecuencia — máximo 3 envíos por hora desde la misma IP.
    // Es un formulario público sin login; sin esto, un bot podría mandar
    // cientos de envíos falsos, cada uno disparando un email real.
    if (ip !== 'unknown') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const recentRes = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_leads?ip_address=eq.${encodeURIComponent(ip)}&created_at=gt.${oneHourAgo}&select=id`,
        { headers: h },
      )
      const recent = await recentRes.json()
      if (Array.isArray(recent) && recent.length >= 3) {
        return new Response(JSON.stringify({ error: 'too many submissions — please try again later' }), { status: 429, headers: corsHeaders })
      }
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/restaurant_leads`, {
      method: 'POST', headers: { ...h, Prefer: 'return=representation' },
      body: JSON.stringify({ restaurant_name, contact_name, email, phone, city, message, ip_address: ip }),
    })
    const inserted = await insertRes.json()
    if (!insertRes.ok) {
      return new Response(JSON.stringify({ error: 'could not save lead', details: inserted }), { status: 500, headers: corsHeaders })
    }

    // Aviso al admin — best-effort, un fallo aquí no debe impedir confirmar
    // al restaurante que su interés quedó registrado.
    try {
      const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Una Mesa <no-reply@unamesa.co>',
          to: [ADMIN_NOTIFY_EMAIL],
          subject: `Nuevo interés: ${restaurant_name}`,
          text: `Restaurante: ${restaurant_name}\nContacto: ${contact_name || '—'}\nEmail: ${email}\nTeléfono: ${phone || '—'}\nCiudad: ${city || '—'}\nMensaje: ${message || '—'}`,
        }),
      })
    } catch (e) { console.warn('[submit-restaurant-lead] notify:', e instanceof Error ? e.message : e) }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
