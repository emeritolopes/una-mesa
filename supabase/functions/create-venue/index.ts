/* ════ UNA MESA · create-venue ════
   Solo admin. Reemplaza el INSERT manual de SQL que veníamos haciendo a
   mano por cada restaurante nuevo — cuello de botella real si el plan es
   acercarse a varios restaurantes a la vez.

   Crea el restaurante Y genera de una vez el token de invitación de
   Stripe Connect (mismo mecanismo que stripe-connect-onboard) — al
   terminar, ya tienes el link listo para mandarle al restaurante, sin un
   segundo paso aparte. La cuenta de Stripe en sí NO se crea todavía aquí
   — se crea sola, de forma perezosa, la primera vez que el restaurante
   abre ese link (ver stripe-connect-self-onboard).

   POST { name, address, city, phone, email, cuisine, neighborhood,
          price_range, description, deposit_amount, capacity, platform_fee_cents }
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function generateSlots(from: string, to: string) {
  const slots: [string, string][] = []
  let [h, m] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  while (h * 60 + m < th * 60 + tm) {
    slots.push([`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, ''])
    m += 30
    if (m >= 60) { h++; m -= 60 }
  }
  return slots
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    // 1 · Solo admin — mismo patrón que invite-restaurant / stripe-connect-onboard
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

    const body = await req.json()
    const { name, address, city, phone, email, cuisine, neighborhood, description } = body
    const price_range = body.price_range ?? 2
    const deposit_amount = body.deposit_amount ?? 1000
    const capacity = body.capacity ?? 50
    const platform_fee_cents = body.platform_fee_cents ?? 100

    if (!name || !city) {
      return new Response(JSON.stringify({ error: 'name and city are required' }), { status: 400, headers: corsHeaders })
    }

    // País/moneda/zona horaria derivados de la ciudad — misma heurística
    // simple que ya usa stripe-connect-onboard. Revisar cuando haya más mercados.
    const isLondon = city === 'London'
    const currency = isLondon ? 'gbp' : 'eur'
    const timezone = isLondon ? 'Europe/London' : 'Europe/Madrid'
    const times = {
      lunch: generateSlots('13:00', '16:00'),
      dinner: generateSlots('20:00', '23:00'),
    }

    // 2 · Crear el restaurante
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/venues`, {
      method: 'POST',
      headers: { ...h, Prefer: 'return=representation' },
      body: JSON.stringify({
        name, address, city, phone, email, cuisine, neighborhood, description,
        price_range, deposit_amount, capacity, platform_fee_cents,
        currency, timezone, times,
      }),
    })
    const inserted = await insertRes.json()
    const venue = inserted?.[0]
    if (!insertRes.ok || !venue?.id) {
      return new Response(JSON.stringify({ error: 'venue insert failed', details: inserted }), { status: 500, headers: corsHeaders })
    }

    // 3 · Token de invitación de Stripe — mismo mecanismo que stripe-connect-onboard,
    //    pero sin crear la cuenta de Stripe todavía (se crea sola, perezosa, en
    //    stripe-connect-self-onboard la primera vez que el restaurante abra el link).
    const inviteToken = crypto.randomUUID()
    await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue.id}`, {
      method: 'PATCH', headers: h,
      body: JSON.stringify({
        stripe_connect_invite_token: inviteToken,
        stripe_connect_invite_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    })

    return new Response(JSON.stringify({
      success: true,
      venue_id: venue.id,
      currency, timezone,
      self_service_url: `https://app.unamesa.co/?connect_token=${inviteToken}`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
