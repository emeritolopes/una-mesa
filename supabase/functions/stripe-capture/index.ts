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
    const { payment_intent_id } = await req.json()

    if (!payment_intent_id) {
      return new Response(JSON.stringify({ error: 'payment_intent_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Buscar la reserva vinculada a este PaymentIntent
    const resCheck = await fetch(
      `${supabaseUrl}/rest/v1/reservations?payment_intent_id=eq.${payment_intent_id}&select=id,deposit_status,status`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const reservations = await resCheck.json()
    const reservation = reservations[0]

    if (!reservation) {
      return new Response(JSON.stringify({ error: 'no reservation linked to this payment_intent_id' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (reservation.deposit_status === 'captured') {
      return new Response(JSON.stringify({ error: 'already captured' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (reservation.status === 'cancelled') {
      return new Response(JSON.stringify({ error: 'cannot capture a cancelled reservation' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    })

    const paymentIntent = await stripe.paymentIntents.capture(payment_intent_id)

    // Marcar depósito como capturado en la reserva
    await fetch(
      `${supabaseUrl}/rest/v1/reservations?id=eq.${reservation.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ deposit_status: 'captured' }),
      }
    )

    return new Response(
      JSON.stringify({
        payment_intent_id: paymentIntent.id,
        status:            paymentIntent.status,
        amount_captured:   paymentIntent.amount_received,
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
