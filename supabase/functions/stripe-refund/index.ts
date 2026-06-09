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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-06-20',
    })

    // Cancel releases the authorization hold without charging the card.
    // If the intent was already captured, create a refund instead.
    let status: string
    let payment_intent_id_out: string

    const pi = await stripe.paymentIntents.retrieve(payment_intent_id)

    if (pi.status === 'requires_capture') {
      const cancelled = await stripe.paymentIntents.cancel(payment_intent_id)
      status             = cancelled.status
      payment_intent_id_out = cancelled.id
    } else if (pi.status === 'succeeded') {
      const refund = await stripe.refunds.create({ payment_intent: payment_intent_id })
      status             = refund.status ?? 'succeeded'
      payment_intent_id_out = payment_intent_id
    } else {
      return new Response(
        JSON.stringify({
          error: `Cannot refund a PaymentIntent with status '${pi.status}'`,
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ payment_intent_id: payment_intent_id_out, status }),
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
