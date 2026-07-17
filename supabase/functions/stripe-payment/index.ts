import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · stripe-payment ════
   Crea el PaymentIntent DIRECTO en la cuenta Stripe Connect del restaurante
   (direct charge) — el dinero nunca pasa por la cuenta de Una Mesa, ni un
   instante. Una Mesa se queda con una comisión fija (platform_fee_cents,
   por defecto 1€) vía application_fee_amount, que Stripe transfiere solo a
   la plataforma en la misma operación.

   Si el restaurante no ha completado el onboarding de Stripe Connect
   (stripe_charges_enabled = false), se rechaza la reserva — no existe un
   camino de respaldo al modelo viejo (cuenta centralizada).
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
      amount, restaurant_id, user_id, reservation_id, party,
      date, time, customer_name, customer_phone, customer_email, lang,
    } = await req.json()

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: 'reservation_id required' }), {
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

    if (!date || !time) {
      return new Response(JSON.stringify({ error: 'date and time required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verificar el depósito, la moneda, y la cuenta Connect del restaurante
    // — nunca confiar en el cliente para ninguno de estos.
    const venueCheck = await fetch(
      `${supabaseUrl}/rest/v1/venues?id=eq.${restaurant_id}&select=id,deposit_amount,currency,stripe_connect_account_id,stripe_charges_enabled,platform_fee_cents,stripe_mode`,
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

    if (!venue.stripe_connect_account_id || !venue.stripe_charges_enabled) {
      return new Response(JSON.stringify({ error: 'restaurant has not completed payment onboarding yet' }), {
        status: 409,
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

    // Modo test/live por restaurante — los tres restaurantes de prueba
    // existentes se quedan en 'test' para siempre (así las pruebas
    // automatizadas nunca tocan dinero real); cualquier restaurante nuevo
    // entra en 'live' por defecto.
    const isLive = venue.stripe_mode === 'live'
    const secretKey = isLive ? Deno.env.get('STRIPE_SECRET_KEY_LIVE') : Deno.env.get('STRIPE_SECRET_KEY_TEST')
    const publishableKey = isLive ? Deno.env.get('STRIPE_PK_LIVE') : Deno.env.get('STRIPE_PK_TEST')
    if (!secretKey || !publishableKey) {
      return new Response(JSON.stringify({ error: `stripe keys not configured for mode: ${venue.stripe_mode}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
    })

    const platformFee = (venue.platform_fee_cents ?? 100) * party
    // La comisión no puede ser mayor que el propio depósito — protección
    // simple contra una configuración mal puesta que Stripe rechazaría igual,
    // pero con un mensaje más claro que el error crudo de la API.
    if (platformFee >= expectedAmount) {
      return new Response(JSON.stringify({ error: 'platform fee misconfigured for this deposit amount' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: expectedAmount,       // siempre el valor recalculado desde la BD, no el del cliente
        currency: venue.currency,     // siempre la moneda del restaurante, no la del navegador del comensal
        capture_method: 'manual',
        application_fee_amount: platformFee,
        metadata: {
          restaurant_id,
          user_id:        user_id ?? '',
          reservation_id,
          party:           String(party),
          date,
          time,
          customer_name:   customer_name ?? '',
          customer_phone:  customer_phone ?? '',
          customer_email:  customer_email ?? '',
          lang:            lang === 'en' ? 'en' : 'es',
        },
      },
      { stripeAccount: venue.stripe_connect_account_id } // direct charge — crítico, sin esto el pago se crearía en la cuenta de Una Mesa
    )

    return new Response(
      JSON.stringify({
        client_secret:      paymentIntent.client_secret,
        payment_intent_id:  paymentIntent.id,
        stripe_account:      venue.stripe_connect_account_id, // el cliente lo necesita para inicializar Stripe.js
        stripe_publishable_key: publishableKey, // el cliente necesita la clave pública correcta (test o live)
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
