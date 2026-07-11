import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · cancel-reservation-guest ════
   GET ?token=<uuid> — cancela una reserva de invitado (sin cuenta) usando
   un token de un solo uso, generado al confirmar la reserva e incluido en
   el propio email de confirmación.

   Ya NO devuelve HTML — Gmail (y probablemente otros webviews de correo)
   interceptaban el link antes de que el navegador real lo abriera, y
   mostraban la respuesta cruda como texto plano en vez de renderizarla,
   sin importar el Content-Type real que mandaba el servidor (confirmado
   con curl directo: el servidor siempre mandó bytes correctos). La
   solución no era otro ajuste de header — era dejar de depender de que un
   cliente de correo interprete bien una URL de Supabase. Ahora el email
   apunta a una pantalla dentro de la propia app (app.unamesa.co), que
   llama a esta función por fetch() y renderiza el resultado ella misma.

   Misma política de 24h que cancel-reservation (el flujo autenticado):
   más de 24h de antelación → depósito liberado; menos de 24h → el depósito
   se pierde, igual que un no-show.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }

  if (!token) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 400 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

  // 1. Token válido, no usado, no expirado
  const tRes = await fetch(`${supabaseUrl}/rest/v1/cancel_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tokens = await tRes.json()
  const tk = tokens[0]
  if (!tk) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 404 })
  if (tk.used_at) return new Response(JSON.stringify({ ok: false, code: 'used' }), { headers: jsonHeaders, status: 409 })
  if (new Date(tk.expires_at) < new Date()) return new Response(JSON.stringify({ ok: false, code: 'expired' }), { headers: jsonHeaders, status: 410 })

  // 2. Traer la reserva + zona horaria real del restaurante
  const resRes = await fetch(
    `${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}&select=*,venues(name,timezone,stripe_connect_account_id)`,
    { headers: h }
  )
  const reservation = (await resRes.json())?.[0]
  if (!reservation) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 404 })
  if (reservation.status === 'cancelled') {
    return new Response(JSON.stringify({ ok: false, code: 'already_cancelled' }), { headers: jsonHeaders, status: 409 })
  }

  // 3. Ventana de 24h — misma política que el flujo autenticado
  const tz = reservation.venues?.timezone || 'Europe/Madrid'
  const reservationDateTime = new Date(
    new Date(`${reservation.date}T${reservation.time}`).toLocaleString('en-US', { timeZone: tz })
  )
  const hoursUntil = (reservationDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const withinPenaltyWindow = hoursUntil < 24

  // 4. Resolver el depósito — mismo lock atómico que cancel-reservation / auto-capture / mark-noshow
  let depositStatus: string | null = reservation.deposit_status
  const stripeAccount = reservation.venues?.stripe_connect_account_id

  if (reservation.payment_intent_id && stripeAccount) {
    const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
      method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: tk.reservation_id }),
    })
    const locked = await lockRes.json()

    if (locked) {
      try {
        if (withinPenaltyWindow) {
          await stripe.paymentIntents.capture(reservation.payment_intent_id, {}, { stripeAccount })
          depositStatus = 'captured'
        } else {
          const pi = await stripe.paymentIntents.retrieve(reservation.payment_intent_id, { stripeAccount })
          if (pi.status === 'requires_capture') {
            await stripe.paymentIntents.cancel(reservation.payment_intent_id, { stripeAccount })
          } else if (pi.status === 'succeeded') {
            await stripe.refunds.create({ payment_intent: reservation.payment_intent_id }, { stripeAccount })
          }
          depositStatus = 'refunded'
        }
      } catch (err) {
        depositStatus = 'capture_failed'
        console.warn('[cancel-reservation-guest] Stripe:', err instanceof Error ? err.message : err)
      }
    }
  }

  // 5. Actualizar la reserva
  await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}`, {
    method: 'PATCH', headers: h,
    body: JSON.stringify({ status: 'cancelled', deposit_status: depositStatus }),
  })

  // 6. Marcar el token como usado
  await fetch(`${supabaseUrl}/rest/v1/cancel_tokens?token=eq.${token}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
  })

  // 7. Registrar la cancelación
  await fetch(`${supabaseUrl}/rest/v1/cancellations`, {
    method: 'POST', headers: h,
    body: JSON.stringify({
      reservation_id: tk.reservation_id,
      user_id: null,
      reason: withinPenaltyWindow ? 'late_cancellation_guest' : 'guest_cancelled',
      refund_amount: depositStatus === 'refunded' ? reservation.deposit_amount : 0,
    }),
  })

  // 8. Email de cancelación — non-fatal. El idioma del email lo decide el
  //    parámetro 'lang' que la pantalla de la app manda en la URL.
  if (reservation.customer_email) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-cancellation-email`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          to: reservation.customer_email,
          customer_name: reservation.customer_name,
          restaurant_name: reservation.venues?.name,
          date: reservation.date,
          time: reservation.time,
          pax: reservation.pax,
          deposit_amount: reservation.deposit_amount,
          refunded: depositStatus === 'refunded',
          lang: url.searchParams.get('lang') === 'en' ? 'en' : 'es',
        }),
      })
    } catch (e) { console.warn('[cancel-reservation-guest] email:', e instanceof Error ? e.message : e) }
  }

  return new Response(
    JSON.stringify({ ok: true, code: 'success', refunded: depositStatus === 'refunded' }),
    { headers: jsonHeaders }
  )
})
