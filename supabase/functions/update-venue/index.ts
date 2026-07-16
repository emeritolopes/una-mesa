/* ════ UNA MESA · update-venue ════
   Solo admin. Edita un restaurante ya creado — antes no existía ninguna
   forma de hacer esto salvo SQL manual.

   POST { venue_id, name?, address?, city?, phone?, email?, cuisine?,
          neighborhood?, description?, deposit_amount?, capacity?,
          platform_fee_cents?, grace_period_minutes? }

   Solo actualiza los campos que de verdad se manden — el resto queda
   igual. No permite tocar campos sensibles de Stripe desde aquí
   (stripe_connect_account_id, stripe_charges_enabled) — esos solo los
   tocan las funciones de Connect, nunca una edición manual de admin.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const EDITABLE_FIELDS = [
  'name', 'address', 'city', 'phone', 'email', 'cuisine', 'neighborhood',
  'description', 'deposit_amount', 'capacity', 'platform_fee_cents', 'grace_period_minutes',
  'photo_url', 'archived',
] as const

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

    const body = await req.json()
    const { venue_id } = body
    if (!venue_id) return new Response(JSON.stringify({ error: 'venue_id required' }), { status: 400, headers: corsHeaders })

    // 2 · Solo los campos permitidos, y solo los que de verdad se mandaron
    const patch: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) patch[field] = body[field]
    }
    // Horarios — se mandan como lunch_start/lunch_end/dinner_start/dinner_end
    // en vez del objeto times directo, para que el formulario de admin sea
    // simple (cuatro campos de hora, no JSON a mano).
    if (body.lunch_start || body.lunch_end || body.dinner_start || body.dinner_end) {
      patch.times = {
        lunch: generateSlots(body.lunch_start || '13:00', body.lunch_end || '16:00'),
        dinner: generateSlots(body.dinner_start || '20:00', body.dinner_end || '23:00'),
      }
    }
    // Fotos — hasta 10, la primera es la portada (photo_url), para que todo
    // lo que ya lee photo_url directamente siga funcionando sin tocarlo.
    if (Array.isArray(body.photo_urls)) {
      const photo_urls = body.photo_urls.slice(0, 10)
      patch.photo_urls = photo_urls
      patch.photo_url = photo_urls[0] || null
    }
    if (Object.keys(patch).length === 0) {
      return new Response(JSON.stringify({ error: 'no editable fields provided' }), { status: 400, headers: corsHeaders })
    }

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}`, {
      method: 'PATCH', headers: { ...h, Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    })
    const updated = await updateRes.json()
    if (!updateRes.ok || !updated?.[0]) {
      return new Response(JSON.stringify({ error: 'update failed', details: updated }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true, venue: updated[0] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
