/* ════ UNA MESA · create-reservation ════
   Crea una reserva directamente en la base de datos, sin depósito.
   Usada cuando deposit_min_party_size no se alcanza (ej: grupos < 15 personas
   en Izgara) — no se crea ningún PaymentIntent.

   Comportamiento por restaurante (ambas opciones apagadas por defecto, ver
   migración 044):
   · manual_confirmation = true → la reserva nace 'pending' y el restaurante
     recibe un email con botones de confirmar / rechazar (respond-reservation).
     El comensal recibe un aviso de "pendiente", no de "confirmada".
     Si no se puede avisar al restaurante, la reserva se cancela y se devuelve
     error: es peor una reserva que nadie ve que una reserva que falla.
   · max_covers_per_service → tope de cubiertos por día y servicio (comida
     < 17:00, cena >= 17:00), contando solo reservas de Una Mesa. No es atómico:
     dos reservas simultáneas justo en el límite podrían pasarse por poco.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_PARTY = 100
const BACKOFHOUSE_URL = 'https://www.unamesa-backofhouse.com'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const serviceOf = (time: string) => (parseInt(time.slice(0, 2), 10) < 17 ? 'lunch' : 'dinner')

function dayLabel(date: string, lang: 'es' | 'en') {
  return new Date(date + 'T00:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const {
      restaurant_id, user_id, reservation_id,
      party, date, time,
      customer_name, customer_phone, customer_email, lang,
    } = await req.json()

    if (!restaurant_id || !party || !date || !time) {
      return json({ error: 'restaurant_id, party, date and time required' }, 400)
    }
    if (!Number.isInteger(party) || party < 1 || party > MAX_PARTY) {
      return json({ error: `party must be an integer between 1 and ${MAX_PARTY}` }, 400)
    }
    // date/time se usan en filtros de consulta: validar formato antes de interpolarlos.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}/.test(time)) {
      return json({ error: 'invalid date or time format' }, 400)
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sbHeaders    = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
    const l: 'es' | 'en' = lang === 'en' ? 'en' : 'es'
    const rid = encodeURIComponent(restaurant_id)

    // Columnas nuevas (migración 044). Si la migración aún no se ha aplicado la
    // consulta falla con 400: caer a las columnas antiguas para no romper las
    // reservas mientras tanto.
    let venueRes = await fetch(
      `${supabaseUrl}/rest/v1/venues?id=eq.${rid}&select=id,name,email,deposit_min_party_size,manual_confirmation,max_covers_per_service`,
      { headers: sbHeaders },
    )
    if (!venueRes.ok) {
      venueRes = await fetch(
        `${supabaseUrl}/rest/v1/venues?id=eq.${rid}&select=id,name,deposit_min_party_size`,
        { headers: sbHeaders },
      )
    }
    const venues = await venueRes.json()
    const venue  = Array.isArray(venues) ? venues[0] : null

    if (!venue) {
      return json({ error: 'restaurant not found' }, 404)
    }

    const minPartyForDeposit = venue.deposit_min_party_size ?? 1
    if (party >= minPartyForDeposit && minPartyForDeposit > 1) {
      return json({ error: 'deposit required for this party size — use stripe-payment instead' }, 400)
    }

    const manual = venue.manual_confirmation === true

    // Modo confirmación manual: sin email del restaurante no hay a quién avisar.
    if (manual && !venue.email) {
      console.error('[create-reservation] manual_confirmation sin venues.email:', restaurant_id)
      return json({ error: 'restaurant_email_missing' }, 422)
    }

    // Límite de cubiertos por servicio (solo reservas de Una Mesa).
    const maxCovers = venue.max_covers_per_service
    if (maxCovers) {
      const capRes = await fetch(
        `${supabaseUrl}/rest/v1/reservations?venue_id=eq.${rid}&date=eq.${date}&status=in.(confirmed,pending)&select=pax,time`,
        { headers: sbHeaders },
      )
      if (!capRes.ok) {
        console.error('[create-reservation] capacity check failed:', capRes.status)
        return json({ error: 'capacity_check_failed' }, 503)
      }
      const rows = await capRes.json()
      const taken = (Array.isArray(rows) ? rows : [])
        .filter((r: { time?: string }) => r.time && serviceOf(r.time) === serviceOf(time))
        .reduce((sum: number, r: { pax?: number }) => sum + (r.pax || 0), 0)
      if (taken + party > maxCovers) {
        return json({ error: 'service_full', remaining: Math.max(0, maxCovers - taken) }, 409)
      }
    }

    const code = reservation_id || ('UM-' + Math.random().toString(36).slice(2, 7).toUpperCase())
    const status = manual ? 'pending' : 'confirmed'

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
      method:  'POST',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body:    JSON.stringify({
        venue_id:       restaurant_id,
        user_id:        user_id || null,
        customer_name:  customer_name  || null,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        pax:            party,
        date,
        time,
        status,
        deposit_status: null,
        source:         'web',
      }),
    })
    const inserted    = await insertRes.json()
    const reservation = inserted?.[0]

    if (!insertRes.ok || !reservation?.id) {
      console.warn('[create-reservation] insert failed:', JSON.stringify(inserted))
      return json({ error: 'could not create reservation' }, 500)
    }

    const supaFunctions = `${supabaseUrl}/functions/v1`
    const label = dayLabel(date, l)
    // Hora normalizada HH:MM (los horarios pueden venir como '9:00'); solo para emails y caducidad.
    const [hh, mm] = time.split(':')
    const shownTime = `${hh.padStart(2, '0')}:${mm.slice(0, 2)}`

    // Modo confirmación manual: token de un solo uso + email al restaurante.
    // Si algo falla aquí, deshacer la reserva: nadie la vería.
    if (manual) {
      const rollback = async (why: string) => {
        console.error('[create-reservation] rollback:', why)
        await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservation.id}`, {
          method: 'PATCH', headers: sbHeaders, body: JSON.stringify({ status: 'cancelled' }),
        }).catch(() => {})
        return json({ error: 'could_not_notify_restaurant' }, 502)
      }

      // Válido hasta 24 h después de la hora de la reserva.
      const expiresAt = new Date(new Date(`${date}T${shownTime}:00Z`).getTime() + 24 * 3600 * 1000).toISOString()
      const tokRes = await fetch(`${supabaseUrl}/rest/v1/reservation_response_tokens`, {
        method:  'POST',
        headers: { ...sbHeaders, 'Prefer': 'return=representation' },
        body:    JSON.stringify({ reservation_id: reservation.id, expires_at: expiresAt }),
      })
      const tokRows = await tokRes.json().catch(() => null)
      const token = tokRows?.[0]?.token
      if (!tokRes.ok || !token) return await rollback('token insert failed: ' + tokRes.status)

      const mailRes = await fetch(`${supaFunctions}/send-email`, {
        method:  'POST',
        headers: sbHeaders,
        body:    JSON.stringify({
          to:                  venue.email,
          customer_name:       customer_name || customer_email || customer_phone || 'Cliente',
          restaurant_name:     venue.name,
          date:                label,
          time:                shownTime,
          pax:                 party,
          respond_confirm_url: `${BACKOFHOUSE_URL}/?respond_token=${token}&action=confirm`,
          respond_decline_url: `${BACKOFHOUSE_URL}/?respond_token=${token}&action=decline`,
          lang:                l,
        }),
      }).catch(() => null)
      if (!mailRes || !mailRes.ok) return await rollback('restaurant email failed: ' + (mailRes ? mailRes.status : 'network'))
    }

    if (customer_name || customer_email) {
      try {
        await fetch(`${supaFunctions}/upsert-customer`, {
          method:  'POST',
          headers: sbHeaders,
          body:    JSON.stringify({
            venue_id:       restaurant_id,
            reservation_id: reservation.id,
            customer_name,
            customer_phone,
            customer_email,
          }),
        })
      } catch (e) {
        console.warn('[create-reservation] upsert-customer failed (non-fatal):', e)
      }
    }

    if (customer_email) {
      try {
        const emailRes = await fetch(`${supaFunctions}/send-email`, {
          method:  'POST',
          headers: sbHeaders,
          body:    JSON.stringify(manual
            ? {
                to:              customer_email,
                customer_name:   customer_name || customer_email,
                restaurant_name: venue.name,
                date:            label,
                time:            shownTime,
                pax:             party,
                pending_notice:  true,
                lang:            l,
              }
            : {
                to:              customer_email,
                customer_name:   customer_name || customer_email,
                restaurant_name: venue.name,
                date,
                time,
                pax:             party,
                deposit_amount:  0,
                lang:            l,
              }),
        })
        if (!emailRes.ok) console.warn('[create-reservation] send-email', emailRes.status, await emailRes.text())
      } catch (e) {
        console.warn('[create-reservation] send-email failed (non-fatal):', e)
      }
    }

    return json({ reservation_id: reservation.id, code, status })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return json({ error: message }, 500)
  }
})
