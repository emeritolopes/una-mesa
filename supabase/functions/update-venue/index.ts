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
] as const

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
