// supabase/functions/invite-restaurant/index.ts
// POST { venue_id, email } — solo admin. Crea usuario en Supabase Auth,
// lo vincula a restaurant_users, y le manda email de invitación para que
// fije su propia contraseña (Supabase lo gestiona via inviteUserByEmail).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  // Solo admin puede invitar — comprueba contra la tabla admins (001_admin_rls.sql)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

  const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: serviceKey, Authorization: authHeader },
  })
  const caller = await callerRes.json()
  if (!caller?.id) return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers: corsHeaders })

  const adminCheck = await fetch(`${supabaseUrl}/rest/v1/admins?user_id=eq.${caller.id}&select=user_id`, { headers: h })

  if (!adminCheck.ok) {
    return new Response(JSON.stringify({ error: 'admin check failed' }), { status: 403, headers: corsHeaders })
  }

  const adminRows = await adminCheck.json()

  if (!Array.isArray(adminRows) || adminRows.length === 0) {
    return new Response(JSON.stringify({ error: 'forbidden — admin only' }), { status: 403, headers: corsHeaders })
  }

  try {
    const { venue_id, email } = await req.json()
    if (!venue_id || !email) {
      return new Response(JSON.stringify({ error: 'venue_id and email required' }), { status: 400, headers: corsHeaders })
    }

    // Confirma que el venue existe antes de invitar a nadie
    const venueCheck = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}&select=id,name`, { headers: h })
    const venues = await venueCheck.json()
    if (!venues || venues.length === 0) {
      return new Response(JSON.stringify({ error: 'venue not found' }), { status: 404, headers: corsHeaders })
    }

    // Crea el usuario en Supabase Auth + envía email de invitación (magic link para fijar password)
    const inviteRes = await fetch(`${supabaseUrl}/auth/v1/invite`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const invited = await inviteRes.json()
    if (!inviteRes.ok || !invited?.id) {
      return new Response(JSON.stringify({ error: 'invite failed', detail: invited }), { status: 500, headers: corsHeaders })
    }

    // Vincula el nuevo usuario al venue
    const linkRes = await fetch(`${supabaseUrl}/rest/v1/restaurant_users`, {
      method: 'POST',
      headers: { ...h, Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: invited.id, venue_id, email }),
    })
    if (!linkRes.ok) {
      const detail = await linkRes.json()
      return new Response(JSON.stringify({ error: 'link failed', detail }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ ok: true, venue: venues[0].name, email }), { headers: corsHeaders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
