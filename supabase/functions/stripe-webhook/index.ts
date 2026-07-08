import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · stripe-webhook ════
   Stripe llama a esta función directamente — nunca el navegador del comensal.
   Verifica la firma criptográfica del evento (imposible de falsificar sin el
   secreto de firma de tu cuenta de Stripe) y, solo entonces, crea la reserva,
   el perfil del cliente, el token de no-show, y manda los dos emails.

   Antes de este cambio, todo esto lo hacía el propio navegador después de
   confirmar la tarjeta — es decir, el cliente le decía a la base de datos
   "ya pagué, aquí está mi payment_intent_id" sin que nadie lo verificara
   contra Stripe. Un usuario autenticado podía fabricar ese ID y crear una
   reserva 'confirmed' sin pagar nada. Aquí, el ID viene directo de Stripe,
   verificado por firma — no hay nada que fabricar.

   Evento que escuchamos: payment_intent.amount_capturable_updated — es el
   que Stripe dispara cuando una autorización con capture_method:'manual'
   se completa con éxito (la tarjeta quedó retenida, no cobrada todavía).
   Es el mismo momento en que antes el cliente creaba la reserva.

   NOTA: reemplaza una versión anterior de esta función que esperaba
   checkout.session.completed (flujo de Stripe Checkout) — esta app nunca
   usó Checkout, crea el PaymentIntent directo y confirma con Stripe.js, así
   que esa versión nunca pudo recibir un evento real. Al reconfigurar el
   webhook en el dashboard de Stripe, hay que cambiar el evento suscrito.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ET = {
  es: { restaurantFallback: 'Restaurante', guestFallback: 'Cliente' },
  en: { restaurantFallback: 'Restaurant', guestFallback: 'Guest' },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  let event: Stripe.Event
  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'missing signature or webhook secret' }), { status: 400, headers: corsHeaders })
    }
    // constructEventAsync: la verificación de firma en Deno necesita la versión async
    // (el crypto de Deno no expone las APIs síncronas que usa el SDK de Node).
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(JSON.stringify({ error: `signature verification failed: ${err instanceof Error ? err.message : err}` }), { status: 400, headers: corsHeaders })
  }

  // Solo nos importa este evento; cualquier otro se reconoce con 200 para que
  // Stripe no lo siga reintentando, pero no hacemos nada con él.
  if (event.type !== 'payment_intent.amount_capturable_updated') {
    return new Response(JSON.stringify({ received: true, ignored: event.type }), { headers: corsHeaders })
  }

  const pi = event.data.object as Stripe.PaymentIntent
  const meta = pi.metadata || {}
  const lang: 'es' | 'en' = meta.lang === 'en' ? 'en' : 'es'
  const t = ET[lang]

  try {
    // Idempotencia: Stripe puede reintentar la entrega del mismo evento.
    // Si ya existe una reserva con este payment_intent_id, no dupliques nada.
    const existingCheck = await fetch(
      `${supabaseUrl}/rest/v1/reservations?payment_intent_id=eq.${pi.id}&select=id`,
      { headers: sbHeaders }
    )
    const existing = await existingCheck.json()
    if (existing && existing.length) {
      return new Response(JSON.stringify({ received: true, already_processed: true }), { headers: corsHeaders })
    }

    const venueId = meta.restaurant_id
    const userId = meta.user_id || null
    const party = parseInt(meta.party, 10) || 1
    const customerName = meta.customer_name || t.guestFallback
    const customerPhone = meta.customer_phone || null
    const customerEmail = meta.customer_email || null

    // 1 · Crear la reserva — server-side, con datos verificados por Stripe, no por el cliente.
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        venue_id: venueId,
        user_id: userId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        pax: party,
        date: meta.date,
        time: meta.time,
        status: 'confirmed',
        payment_intent_id: pi.id,
        deposit_status: 'pending',
        source: 'web',
      }),
    })
    const inserted = await insertRes.json()
    const reservation = inserted?.[0]
    if (!insertRes.ok || !reservation?.id) {
      console.warn('[stripe-webhook] no se pudo crear la reserva:', JSON.stringify(inserted))
      return new Response(JSON.stringify({ received: true, error: 'reservation insert failed' }), { headers: corsHeaders })
    }

    // 2 · Perfil del cliente — non-fatal, igual que antes.
    if (customerName || customerEmail) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/upsert-customer`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify({
            venue_id: venueId,
            reservation_id: reservation.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
          }),
        })
      } catch (e) { console.warn('[stripe-webhook] upsert-customer:', e instanceof Error ? e.message : e) }
    }

    // 3 · Restaurante real — para el nombre, el email de aviso, y el token de no-show.
    const venueRes = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venueId}&select=name,email,deposit_amount,menu_url`, { headers: sbHeaders })
    const venues = await venueRes.json()
    const venue = venues?.[0]
    const restaurantName = venue?.name || t.restaurantFallback
    const depositAmount = venue?.deposit_amount || 1000
    const menuUrl = venue?.menu_url || null

    const dayLabel = new Date(meta.date + 'T00:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
      timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
    })

    // 4 · Token de no-show + email al restaurante — non-fatal.
    if (venue?.email) {
      try {
        const tokenRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_noshow_token`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify({ p_reservation_id: reservation.id }),
        })
        const token = await tokenRes.json()
        if (token) {
          const noshowUrl = `${supabaseUrl}/functions/v1/mark-noshow?token=${token}`
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: sbHeaders,
            body: JSON.stringify({
              to: venue.email,
              customer_name: customerName,
              restaurant_name: restaurantName,
              date: dayLabel,
              time: meta.time,
              pax: party,
              deposit_amount: depositAmount,
              noshow_url: noshowUrl,
              lang,
            }),
          })
        }
      } catch (e) { console.warn('[stripe-webhook] noshow/restaurant-email:', e instanceof Error ? e.message : e) }
    }

    // 5 · Email de confirmación al comensal — non-fatal.
    if (customerEmail) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify({
            to: customerEmail,
            customer_name: customerName,
            restaurant_name: restaurantName,
            date: dayLabel,
            time: meta.time,
            pax: party,
            deposit_amount: depositAmount,
            menu_url: menuUrl,
            lang,
          }),
        })
      } catch (e) { console.warn('[stripe-webhook] confirmation-email:', e instanceof Error ? e.message : e) }
    }

    return new Response(JSON.stringify({ received: true, reservation_id: reservation.id }), { headers: corsHeaders })
  } catch (err) {
    console.error('[stripe-webhook] error:', err instanceof Error ? err.message : err)
    // Devolvemos 200 para que Stripe no reintente indefinidamente algo que
    // probablemente va a volver a fallar igual; el error queda en los logs.
    return new Response(JSON.stringify({ received: true, error: 'internal error, see logs' }), { headers: corsHeaders })
  }
})
