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

    if (!amount || !currency) {
      return new Response(JSON.stringify({ error: 'amount and currency are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,           // smallest currency unit — e.g. 500 = €5.00
      currency,
      capture_method: 'manual',   // authorize only; capture on arrival, cancel on no-show
      metadata: {
        restaurant_id: restaurant_id ?? '',
        user_id:       user_id       ?? '',
        reservation_id: reservation_id ?? '',
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
