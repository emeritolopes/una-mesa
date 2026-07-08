import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · cancel-reservation ════
   Reemplaza a update-reservation + la llamada directa del cliente a
   stripe-refund. Antes, cualquiera con la anon key podía cancelar la
   reserva de cualquier persona (update-reservation) y reembolsar el
   depósito de cualquier pago (stripe-refund) mandando solo un ID — sin
   verificar que le perteneciera a quien preguntaba.

   Esta función es la única autorizada a cancelar: verifica que quien llama
   sea el dueño real de la reserva (el diner que la hizo, o el restaurante
   dueño del venue), aplica la política de 24 horas usando la zona horaria
   real del restaurante, y deja la base de datos y Stripe siempre
   consistentes entre sí — nunca cancela en Stripe sin actualizar la reserva,
   ni al revés.

   Política: cancelar con más de 24h de antelación → depósito liberado
   (cancelado si no se había capturado, reembolsado si ya se había
   capturado). Cancelar con menos de 24h → el depósito se pierde, igual que
   un no-show — se captura como penalización.

   PENDIENTE, fuera de esta función: cancelación de una reserva de invitado
   (sin cuenta, user_id null) — hoy no hay forma de que un invitado se
   autentique para cancelar la suya. Necesitaría un token de un solo uso,
   igual que noshow_tokens, o pasar siempre por el restaurante.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ET = {
  es: {
    forbidden: 'No tienes permiso para cancelar esta reserva.',
    notFound: 'Reserva no encontrada.',
    alreadyCancelled: 'Esta reserva ya estaba cancelada.',
  },
  en: {
    forbidden: "You don't have permission to cancel this booking.",
    notFound: 'Reservation not found.',
    alreadyCancelled: 'This booking was already cancelled.',
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

  try {
    // 1 · Identidad real del que llama — nunca confiar en nada que mande el body para esto
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

    const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: authHeader } })
    const caller = await callerRes.json()
    if (!caller?.id) return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers: corsHeaders })

    const { reservation_id, lang: langRaw } = await req.json()
    const lang: 'es' | 'en' = langRaw === 'en' ? 'en' : 'es'
    const t = ET[lang]
    if (!reservation_id) return new Response(JSON.stringify({ error: 'reservation_id required' }), { status: 400, headers: corsHeaders })

    // 2 · Traer la reserva + el restaurante (zona horaria real, no asumida)
    const resRes = await fetch(
      `${supabaseUrl}/rest/v1/reservations?id=eq.${reservation_id}&select=*,venues(name,timezone,email)`,
      { headers: h }
    )
    const reservations = await resRes.json()
    const reservation = reservations?.[0]
    if (!reservation) return new Response(JSON.stringify({ error: t.notFound }), { status: 404, headers: corsHeaders })
    if (reservation.status === 'cancelled') {
      return new Response(JSON.stringify({ error: t.alreadyCancelled }), { status: 409, headers: corsHeaders })
    }

    // 3 · Verificar dueño real: el diner que la hizo, o el restaurante del venue
    const isOwnerDiner = reservation.user_id && reservation.user_id === caller.id
    let isOwnerRestaurant = false
    if (!isOwnerDiner) {
      const ruRes = await fetch(
        `${supabaseUrl}/rest/v1/restaurant_users?user_id=eq.${caller.id}&select=venue_id`,
        { headers: h }
      )
      const ru = await ruRes.json()
      isOwnerRestaurant = ru?.[0]?.venue_id === reservation.venue_id
    }
    if (!isOwnerDiner && !isOwnerRestaurant) {
      return new Response(JSON.stringify({ error: t.forbidden }), { status: 403, headers: corsHeaders })
    }

    // 4 · Ventana de 24h, calculada con la zona horaria real del restaurante
    const tz = reservation.venues?.timezone || 'Europe/Madrid'
    const reservationDateTime = new Date(
      new Date(`${reservation.date}T${reservation.time}`).toLocaleString('en-US', { timeZone: tz })
    )
    const hoursUntil = (reservationDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
    const withinPenaltyWindow = hoursUntil < 24

    // 5 · Resolver el depósito en Stripe — con el mismo lock atómico que usan
    //    auto-capture y mark-noshow, para no chocar con ellos si ya estaban procesándolo
    let depositStatus: string | null = reservation.deposit_status

    if (reservation.payment_intent_id) {
      const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
        method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: reservation_id }),
      })
      const locked = await lockRes.json()

      if (locked) {
        try {
          if (withinPenaltyWindow) {
            // Cancelación tardía — el depósito se pierde, igual que un no-show
            await stripe.paymentIntents.capture(reservation.payment_intent_id)
            depositStatus = 'captured'
          } else {
            const pi = await stripe.paymentIntents.retrieve(reservation.payment_intent_id)
            if (pi.status === 'requires_capture') {
              await stripe.paymentIntents.cancel(reservation.payment_intent_id)
            } else if (pi.status === 'succeeded') {
              await stripe.refunds.create({ payment_intent: reservation.payment_intent_id })
            }
            depositStatus = 'refunded'
          }
        } catch (err) {
          depositStatus = 'capture_failed'
          console.warn('[cancel-reservation] Stripe:', err instanceof Error ? err.message : err)
        }
      }
      // Si no se pudo tomar el lock, algo más (auto-capture/mark-noshow) ya lo estaba
      // procesando — dejamos su deposit_status tal cual quede, solo cancelamos la mesa.
    }

    // 6 · Actualizar la reserva — siempre, sea cual sea el resultado de Stripe
    await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservation_id}`, {
      method: 'PATCH',
      headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'cancelled', deposit_status: depositStatus }),
    })

    // 7 · Registrar la cancelación — server-side, no confiar en el cliente para esto
    await fetch(`${supabaseUrl}/rest/v1/cancellations`, {
      method: 'POST',
      headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({
        reservation_id,
        user_id: reservation.user_id,
        reason: withinPenaltyWindow ? 'late_cancellation' : 'user_cancelled',
        refund_amount: depositStatus === 'refunded' ? reservation.deposit_amount : 0,
      }),
    })

    // 8 · Email de cancelación — non-fatal, refleja si hubo reembolso real o no
    const recipientEmail = reservation.customer_email
    if (recipientEmail) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-cancellation-email`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            to: recipientEmail,
            customer_name: reservation.customer_name,
            restaurant_name: reservation.venues?.name,
            date: reservation.date,
            time: reservation.time,
            pax: reservation.pax,
            deposit_amount: reservation.deposit_amount,
            refunded: depositStatus === 'refunded',
            lang,
          }),
        })
      } catch (e) { console.warn('[cancel-reservation] email:', e instanceof Error ? e.message : e) }
    }

    return new Response(JSON.stringify({ success: true, deposit_status: depositStatus, late_cancellation: withinPenaltyWindow }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
