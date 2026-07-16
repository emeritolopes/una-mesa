import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · stripe-connect-onboard ════
   Solo admin. Crea (si no existe) una cuenta Stripe Express para el
   restaurante, y devuelve un link de onboarding alojado por Stripe — el
   restaurante completa su verificación ahí, sin necesitar login en
   backofhouse ni en ningún panel de Una Mesa. Independiente del plan de
   negocio (funciona igual para un restaurante "solo web de reservas" que
   para uno con el paquete completo).

   POST { venue_id }
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    // 1 · Solo admin — mismo patrón que invite-restaurant
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

    const { venue_id } = await req.json()
    if (!venue_id) return new Response(JSON.stringify({ error: 'venue_id required' }), { status: 400, headers: corsHeaders })

    // 2 · Traer el restaurante
    const vRes = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}&select=id,name,email,city,stripe_connect_account_id,stripe_connect_invite_token,stripe_charges_enabled,stripe_mode`, { headers: h })
    const venue = (await vRes.json())?.[0]
    if (!venue) return new Response(JSON.stringify({ error: 'venue not found' }), { status: 404, headers: corsHeaders })

    const isLive = venue.stripe_mode === 'live'
    const stripe = new Stripe((isLive ? Deno.env.get('STRIPE_SECRET_KEY_LIVE') : Deno.env.get('STRIPE_SECRET_KEY_TEST')) ?? '', { apiVersion: '2024-06-20' })

    // 2b · Token de invitación persistente — el restaurante lo usa las veces
    //    que necesite hasta terminar, sin que el admin tenga que volver a
    //    generar nada. 30 días de validez; se corta solo si ya está activo
    //    (ver stripe-connect-self-onboard).
    let inviteToken = venue.stripe_connect_invite_token
    if (!inviteToken) {
      inviteToken = crypto.randomUUID()
      await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({
          stripe_connect_invite_token: inviteToken,
          stripe_connect_invite_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      })
    }
    const selfServiceUrl = `https://app.unamesa.co/?connect_token=${inviteToken}`

    // 3 · Crear la cuenta Express si no existe todavía
    //    NOTA: país derivado de la ciudad de forma simple (Madrid→ES,
    //    London→GB) — revisar esta heurística cuando haya más mercados.
    let accountId = venue.stripe_connect_account_id
    if (!accountId) {
      const country = venue.city === 'London' ? 'GB' : 'ES'
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email: venue.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
      })
      accountId = account.id

      await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ stripe_connect_account_id: accountId }),
      })
    }

    // 4 · Link de onboarding alojado por Stripe — de un solo uso, expira en unos minutos
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `https://unamesa.co/?connect=refresh&venue_id=${venue_id}`,
      return_url: `https://unamesa.co/?connect=done&venue_id=${venue_id}`,
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ success: true, onboarding_url: accountLink.url, account_id: accountId, self_service_url: selfServiceUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
