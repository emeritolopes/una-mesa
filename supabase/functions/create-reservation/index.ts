/* ════ UNA MESA · create-reservation ════
   Crea una reserva directamente en la base de datos, sin depósito.
   Usada cuando deposit_min_party_size no se alcanza (ej: grupos < 15 personas
   en Izgara) — no se crea ningún PaymentIntent, el restaurante simplemente
   confirma la reserva.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const {
      restaurant_id, user_id, reservation_id,
      party, date, time,
      customer_name, customer_phone, customer_email, lang,
    } = await req.json()

    if (!restaurant_id || !party || !date || !time) {
      return new Response(JSON.stringify({ error: 'restaurant_id, party, date and time required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sbHeaders    = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

    const venueRes = await fetch(
      `${supabaseUrl}/rest/v1/venues?id=eq.${restaurant_id}&select=id,name,deposit_min_party_size`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const venues = await venueRes.json()
    const venue  = venues[0]

    if (!venue) {
      return new Response(JSON.stringify({ error: 'restaurant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const minPartyForDeposit = venue.deposit_min_party_size ?? 1
    if (party >= minPartyForDeposit && minPartyForDeposit > 1) {
      return new Response(JSON.stringify({ error: 'deposit required for this party size — use stripe-payment instead' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const code = reservation_id || ('UM-' + Math.random().toString(36).slice(2, 7).toUpperCase())

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
        status:         'confirmed',
        deposit_status: null,
        source:         'web',
      }),
    })
    const inserted    = await insertRes.json()
    const reservation = inserted?.[0]

    if (!insertRes.ok || !reservation?.id) {
      console.warn('[create-reservation] insert failed:', JSON.stringify(inserted))
      return new Response(JSON.stringify({ error: 'could not create reservation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (customer_name || customer_email) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/upsert-customer`, {
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
        const supaFunctions = `${supabaseUrl}/functions/v1`
        const emailRes = await fetch(`${supaFunctions}/send-email`, {
          method:  'POST',
          headers: sbHeaders,
          body:    JSON.stringify({
            to:              customer_email,
            customer_name:   customer_name || customer_email,
            restaurant_name: venue.name,
            date,
            time,
            pax:             party,
            deposit_amount:  0,
            lang:            lang === 'en' ? 'en' : 'es',
          }),
        })
        if (!emailRes.ok) console.warn('[create-reservation] send-email', emailRes.status, await emailRes.text())
      } catch (e) {
        console.warn('[create-reservation] send-email failed (non-fatal):', e)
      }
    }

    return new Response(
      JSON.stringify({ reservation_id: reservation.id, code }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
