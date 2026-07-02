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
    const { amount, currency, restaurant_id, user_id, reservation_id } = await req.json()

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar el depósito esperado contra la reserva real — no confiar en 'amount' del cliente
    const resCheck = await fetch(
      `${supabaseUrl}/rest/v1/reservations?id=eq.${reservation_id}&select=id,venue_id,deposit_amount,deposit_status`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const reservations = await resCheck.json()
    const reservation = reservations[0]

    if (!reservation) {
      return new Response(JSON.stringify({ error: 'reservation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (reservation.deposit_status === 'captured') {
      return new Response(JSON.stringify({ error: 'deposit already captured' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (reservation.deposit_amount !== amount) {
      return new Response(JSON.stringify({ error: 'amount does not match expected deposit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: reservation.deposit_amount,  // siempre usar el valor de la BD
      currency,
      capture_method: 'manual',
      metadata: {
        restaurant_id: restaurant_id ?? reservation.venue_id ?? '',
        user_id:       user_id       ?? '',
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
