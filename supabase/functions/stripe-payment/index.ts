import Stripe from 'https://esm.sh/stripe@14?target=deno'

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
    const { amount, currency, restaurant_id, user_id, reservation_id, party } = await req.json()

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: 'reservation_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!currency) {
      return new Response(JSON.stringify({ error: 'currency required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!restaurant_id) {
      return new Response(JSON.stringify({ error: 'restaurant_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!party || party < 1) {
      return new Response(JSON.stringify({ error: 'party required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar el depósito esperado contra el restaurante real — no confiar en 'amount' del cliente.
    // Se valida contra `venues`, no contra `reservations`: en este punto la reserva todavía no existe,
    // se crea después de que el pago se autoriza (ver booking.jsx paso 3).
    const venueCheck = await fetch(
      `${supabaseUrl}/rest/v1/venues?id=eq.${restaurant_id}&select=id,deposit_amount`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const venues = await venueCheck.json()
    const venue = venues[0]

    if (!venue) {
      return new Response(JSON.stringify({ error: 'restaurant not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const expectedAmount = venue.deposit_amount * party
    if (amount !== expectedAmount) {
      return new Response(JSON.stringify({ error: 'amount does not match expected deposit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: expectedAmount,  // siempre usar el valor recalculado desde la BD, no el del cliente
      currency,
      capture_method: 'manual',
      metadata: {
        restaurant_id,
        user_id:       user_id ?? '',
        reservation_id,
      },
    })

    return new Response(
      JSON.stringify({
        client_secret:      paymentIntent.client_secret,
        payment_intent_id:  paymentIntent.id,
      }),
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
