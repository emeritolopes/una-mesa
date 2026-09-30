/* ════ UNA MESA · create-manual-reservation ════
   Reserva creada por el propio restaurante desde backofhouse (teléfono, walk-in).
   · verify_jwt = true y además se re-comprueba al llamante contra restaurant_users:
     el venue sale del usuario autenticado, nunca del body.
   · Sin depósito, sin emails. source = 'backofhouse' (no cuenta como reserva
     generada por Una Mesa en venue_funnel, ver migración 048).
   · El aforo (max_covers_per_service) es un AVISO, no un bloqueo: el personal puede
     decidir sobrepasarlo. Se devuelve over_capacity / remaining.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const MAX_PARTY = 100
const serviceOf = (time: string) => (parseInt(time.slice(0, 2), 10) < 17 ? 'lunch' : 'dinner')
const clean = (v: unknown, max: number) => {
  const s = String(v ?? '').trim().slice(0, max)
  return s || null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sbHeaders   = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

    // 1. Quién llama
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'unauthorized' }, 401)
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${token}` } })
    if (!userRes.ok) return json({ error: 'unauthorized' }, 401)
    const user = await userRes.json()
    if (!user?.id) return json({ error: 'unauthorized' }, 401)

    const ruRes = await fetch(`${supabaseUrl}/rest/v1/restaurant_users?user_id=eq.${encodeURIComponent(user.id)}&select=venue_id&limit=1`, { headers: sbHeaders })
    const ru = await ruRes.json()
    const venueId = Array.isArray(ru) ? ru[0]?.venue_id : null
    if (!venueId) return json({ error: 'forbidden' }, 403)

    // 2. Validación
    const b = await req.json()
    const party = Number(b.party)
    const date = String(b.date || '')
    const time = String(b.time || '')
    if (!Number.isInteger(party) || party < 1 || party > MAX_PARTY) return json({ error: `party must be an integer between 1 and ${MAX_PARTY}` }, 400)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) return json({ error: 'invalid date or time format' }, 400)
    const name = clean(b.customer_name, 120)
    if (!name) return json({ error: 'customer_name required' }, 400)
    const phone = clean(b.customer_phone, 40)
    const notes = clean(b.notes, 500)
    const tableLabel = clean(b.table_label, 40)

    // 3. Aviso de aforo (no bloquea)
    let overCapacity = false
    let remaining: number | null = null
    const vRes = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venueId}&select=max_covers_per_service`, { headers: sbHeaders })
    const maxCovers = vRes.ok ? (await vRes.json())?.[0]?.max_covers_per_service : null
    if (maxCovers) {
      const capRes = await fetch(`${supabaseUrl}/rest/v1/reservations?venue_id=eq.${venueId}&date=eq.${date}&status=in.(confirmed,pending)&select=pax,time`, { headers: sbHeaders })
      if (capRes.ok) {
        const rows = await capRes.json()
        const taken = (Array.isArray(rows) ? rows : [])
          .filter((r: { time?: string }) => r.time && serviceOf(r.time) === serviceOf(time))
          .reduce((s: number, r: { pax?: number }) => s + (r.pax || 0), 0)
        remaining = Math.max(0, maxCovers - taken - party)
        overCapacity = taken + party > maxCovers
      }
    }

    // 4. Insertar
    const row = {
      venue_id: venueId, customer_name: name, customer_phone: phone, pax: party,
      date, time: time.length === 5 ? time + ':00' : time, status: 'confirmed',
      deposit_status: null, source: 'backofhouse', notes, table_label: tableLabel,
    }
    let insRes = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
      method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(row),
    })
    let ins = await insRes.json()
    if (!insRes.ok) {
      // Si alguna columna opcional (notes, table_label: migración 049) no existiera en este
      // entorno, reintentar sin ellas: nunca perder la reserva.
      const { notes: _n, table_label: _t, ...minimal } = row
      insRes = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
        method: 'POST', headers: { ...sbHeaders, Prefer: 'return=representation' }, body: JSON.stringify(minimal),
      })
      ins = await insRes.json()
    }
    const reservation = ins?.[0]
    if (!insRes.ok || !reservation?.id) {
      console.warn('[create-manual-reservation] insert failed:', JSON.stringify(ins))
      return json({ error: 'could not create reservation' }, 500)
    }

    // 5. Ficha de comensal (no fatal)
    try {
      await fetch(`${supabaseUrl}/functions/v1/upsert-customer`, {
        method: 'POST', headers: sbHeaders,
        body: JSON.stringify({ venue_id: venueId, reservation_id: reservation.id, customer_name: name, customer_phone: phone, notes }),
      })
    } catch (e) {
      console.warn('[create-manual-reservation] upsert-customer failed (non-fatal):', e)
    }

    return json({ ok: true, id: reservation.id, over_capacity: overCapacity, remaining })
  } catch (e) {
    console.error('[create-manual-reservation]', e)
    return json({ error: 'internal error' }, 500)
  }
})
