import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · stripe-webhook ════
   Stripe llama a esta función directamente — nunca el navegador del comensal.
   Verifica la firma criptográfica del evento y, solo entonces, crea la
   reserva, el perfil del cliente, el token de no-show, y manda los emails.

   Con Stripe Connect (direct charges), los eventos de pago YA NO llegan como
   eventos de "tu cuenta" — llegan como eventos de "cuentas conectadas", con
   su propio registro de webhook y su propio secreto de firma en Stripe. Este
   endpoint recibe AMBOS tipos (tu cuenta, para account.updated en algunos
   casos legacy; y cuentas conectadas, para todo lo de pagos) — probamos la
   firma contra los dos secretos posibles, ya que Stripe no nos dice de
   antemano cuál usar.

   Evento principal: payment_intent.amount_capturable_updated — se dispara
   cuando una autorización con capture_method:'manual' se completa con éxito
   (crea la reserva). payment_intent.succeeded es solo una red de
   reconciliación de deposit_status para capturas que no pasaron por
   stripe-capture o auto-capture (ver comentario en ese bloque).
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

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_LIVE') ?? Deno.env.get('STRIPE_SECRET_KEY_TEST') ?? '', { apiVersion: '2024-06-20' })
  const secretsToTry = [
    Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST') ?? '',
    Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET_TEST') ?? '',
    Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE') ?? '',
    Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET_LIVE') ?? '',
  ]
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sbHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  let event: Stripe.Event
  try {
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()
    if (!signature) {
      return new Response(JSON.stringify({ error: 'missing signature' }), { status: 400, headers: corsHeaders })
    }
    // Probamos contra los cuatro secretos posibles — test/real, cada uno con
    // pagos normales y cuentas conectadas por separado — no hay forma de
    // saber cuál aplica antes de intentar verificar la firma.
    let verified: Stripe.Event | null = null
    for (const secret of secretsToTry) {
      if (!secret) continue
      try {
        verified = await stripe.webhooks.constructEventAsync(body, signature, secret)
        break
      } catch (_) { /* prueba el siguiente secreto */ }
    }
    if (!verified) throw new Error('no matching webhook secret')
    event = verified
  } catch (err) {
    return new Response(JSON.stringify({ error: `signature verification failed: ${err instanceof Error ? err.message : err}` }), { status: 400, headers: corsHeaders })
  }

  // event.account está presente cuando el evento viene de una cuenta
  // conectada (todo lo de pagos con direct charges, y el propio
  // account.updated del restaurante).
  const eventAccount = (event as unknown as { account?: string }).account || null

  // account.updated — Stripe Connect: el restaurante terminó (o cambió) su
  // verificación. Actualizamos si ya puede recibir cobros de verdad.
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    try {
      // Miramos el estado ANTES de actualizar — así solo mandamos el email
      // de "ya estás en vivo" la primera vez que de verdad pasa a activo,
      // no cada vez que Stripe repite este evento durante la verificación.
      const beforeRes = await fetch(`${supabaseUrl}/rest/v1/venues?stripe_connect_account_id=eq.${account.id}&select=id,name,email,city,stripe_charges_enabled`, { headers: sbHeaders })
      const beforeRows = await beforeRes.json()
      const venueBefore = beforeRows?.[0]

      await fetch(`${supabaseUrl}/rest/v1/venues?stripe_connect_account_id=eq.${account.id}`, {
        method: 'PATCH', headers: sbHeaders,
        body: JSON.stringify({ stripe_charges_enabled: !!account.charges_enabled }),
      })

      const justWentLive = venueBefore && !venueBefore.stripe_charges_enabled && account.charges_enabled
      if (justWentLive && venueBefore.email) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST', headers: sbHeaders,
            body: JSON.stringify({
              to: venueBefore.email,
              restaurant_name: venueBefore.name,
              live_confirmation: true,
              lang: venueBefore.city === 'London' ? 'en' : 'es',
            }),
          })
        } catch (e) { console.warn('[stripe-webhook] live-confirmation email:', e instanceof Error ? e.message : e) }
      }
    } catch (e) { console.warn('[stripe-webhook] account.updated:', e instanceof Error ? e.message : e) }
    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders })
  }

  // payment_intent.succeeded — red de reconciliación. El flujo normal
  // (botón "capturar" en stripe-capture, o el cron auto-capture) ya marca
  // deposit_status='captured' en el mismo request que llama a
  // stripe.paymentIntents.capture(), así que este handler no es la vía
  // principal. Existe para el caso en que el PaymentIntent se capture por
  // fuera de esas dos funciones (a mano desde el Stripe Dashboard, o si el
  // PATCH de alguna de ellas falla después de que Stripe ya capturó) — sin
  // esto, deposit_status se queda desincronizado con Stripe silenciosamente.
  if (event.type === 'payment_intent.succeeded') {
    const capturedPi = event.data.object as Stripe.PaymentIntent
    try {
      // CAS en la propia query — nada de leer el estado en JS y decidir con
      // eso, porque Stripe no garantiza ni el orden ni la puntualidad de
      // entrega de webhooks (puede reintentar días después). Si este evento
      // llega tarde, después de que cancel-reservation ya reembolsó el
      // depósito (deposit_status='refunded'), un check ingenuo tipo
      // `!== 'captured'` lo pisaría de vuelta a 'captured' — mismo motivo
      // por el que cancel-reservation nunca escribe con datos viejos
      // cuando pierde el lock (ver su comentario ahí). Excluimos el mismo
      // conjunto de estados terminales/lock que usa try_lock_deposit_capture
      // y reservations_due_capture en todo el resto del código — incluyendo
      // el "is null", porque `deposit_status NOT IN (...)` en SQL da UNKNOWN
      // (no TRUE) cuando la columna es null, y silenciosamente excluiría esa
      // fila del PATCH.
      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/reservations?payment_intent_id=eq.${capturedPi.id}&or=(deposit_status.is.null,deposit_status.not.in.(capturing,captured,capture_failed,refunded))`,
        {
          method: 'PATCH',
          headers: { ...sbHeaders, Prefer: 'return=representation' },
          body: JSON.stringify({ deposit_status: 'captured', deposit_amount: capturedPi.amount_received }),
        }
      )
      const updated = await patchRes.json()
      // Log incondicional (éxito o no) — sin esto, el camino feliz no deja
      // ningún rastro verificable en los logs de producción.
      console.log(`[stripe-webhook] RECONCILE_SUCCEEDED pi=${capturedPi.id} amount_received=${capturedPi.amount_received} ok=${patchRes.ok} rows_updated=${Array.isArray(updated) ? updated.length : 0}`)
      if (!patchRes.ok) {
        console.warn('[stripe-webhook] payment_intent.succeeded reconciliation failed:', JSON.stringify(updated))
      }
    } catch (e) { console.warn('[stripe-webhook] payment_intent.succeeded reconciliation:', e instanceof Error ? e.message : e) }
    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders })
  }

  // Solo nos importa este evento (aparte de los de arriba); cualquier otro
  // se reconoce con 200 para que Stripe no lo siga reintentando, pero no
  // hacemos nada con él.
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

    // Restaurante real — antes de crear nada, cruzamos que la cuenta
    // conectada que mandó el evento sea de verdad la de este restaurante.
    // El metadata ya viene firmado por Stripe (no se puede fabricar), pero
    // este cruce es una capa extra barata contra cualquier desalineación.
    const venueRes = await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venueId}&select=name,email,deposit_amount,menu_url,stripe_connect_account_id`, { headers: sbHeaders })
    const venues = await venueRes.json()
    const venue = venues?.[0]

    if (eventAccount && venue?.stripe_connect_account_id && eventAccount !== venue.stripe_connect_account_id) {
      console.error('[stripe-webhook] event.account no coincide con el venue esperado:', eventAccount, 'vs', venue.stripe_connect_account_id)
      return new Response(JSON.stringify({ received: true, error: 'account mismatch' }), { headers: corsHeaders })
    }

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

    const restaurantName = venue?.name || t.restaurantFallback
    const depositAmount = (venue?.deposit_amount || 1000) * party
    const menuUrl = venue?.menu_url || null

    const dayLabel = new Date(meta.date + 'T00:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
      timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
    })

    // 3 · Token de no-show + email al restaurante — non-fatal.
    if (venue?.email) {
      try {
        const tokenRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_noshow_token`, {
          method: 'POST',
          headers: sbHeaders,
          body: JSON.stringify({ p_reservation_id: reservation.id }),
        })
        const token = await tokenRes.json()
        if (token) {
          const noshowUrl = `https://www.unamesa-backofhouse.com/?noshow_token=${token}`
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

    // 4 · Email de confirmación al comensal — non-fatal.
    if (customerEmail) {
      try {
        let cancelUrl: string | null = null
        try {
          const cancelTokenRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_cancel_token`, {
            method: 'POST', headers: sbHeaders, body: JSON.stringify({ p_reservation_id: reservation.id }),
          })
          const cancelToken = await cancelTokenRes.json()
          if (cancelToken) {
            const appOrigin = lang === 'en' ? 'https://app.unamesa.co.uk' : 'https://app.unamesa.co'
            cancelUrl = `${appOrigin}/?cancel_token=${cancelToken}&lang=${lang}`
          }
        } catch (e) { console.warn('[stripe-webhook] cancel-token:', e instanceof Error ? e.message : e) }

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
            cancel_url: cancelUrl,
            lang,
          }),
        })
      } catch (e) { console.warn('[stripe-webhook] confirmation-email:', e instanceof Error ? e.message : e) }
    }

    return new Response(JSON.stringify({ received: true, reservation_id: reservation.id }), { headers: corsHeaders })
  } catch (err) {
    console.error('[stripe-webhook] error:', err instanceof Error ? err.message : err)
    return new Response(JSON.stringify({ received: true, error: 'internal error, see logs' }), { headers: corsHeaders })
  }
})
