import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · cancel-reservation-guest ════
   GET ?token=<uuid>&lang=<es|en> — cancela una reserva de invitado (sin
   cuenta) usando un token de un solo uso, generado al confirmar la reserva
   e incluido en el propio email de confirmación. Mismo patrón que
   mark-noshow: sin login, un solo uso, expira.

   Misma política de 24h que cancel-reservation (el flujo autenticado):
   más de 24h de antelación → depósito liberado; menos de 24h → el depósito
   se pierde, igual que un no-show.

   AVISO conocido, compartido con mark-noshow: al ser un link de un solo
   clic (GET) que ejecuta la acción de inmediato, un escáner de seguridad de
   correo corporativo que pre-visita el link podría disparar la cancelación
   sin que el humano haya hecho clic. No resuelto aquí — mismo riesgo que ya
   existía en mark-noshow antes de esta función.
*/

const ET = {
  es: {
    lang: 'es',
    invalidTitle: 'Enlace inválido', invalidMissing: 'Falta el token.', invalidNotExist: 'Este enlace no existe.',
    usedTitle: 'Ya utilizado', usedBody: 'Este enlace ya se usó. Si fue un error, contacta con el restaurante.',
    expiredTitle: 'Enlace caducado', expiredBody: 'Este enlace ha expirado — probablemente porque la reserva ya pasó.',
    alreadyCancelledTitle: 'Ya cancelada', alreadyCancelledBody: 'Esta reserva ya estaba cancelada.',
    doneTitle: 'Reserva cancelada',
    doneRefunded: 'Tu reserva se canceló. El depósito se reembolsará en 5-10 días hábiles.',
    doneForfeited: 'Tu reserva se canceló. Como fue con menos de 24 horas de antelación, el depósito no es reembolsable.',
  },
  en: {
    lang: 'en',
    invalidTitle: 'Invalid link', invalidMissing: 'Token is missing.', invalidNotExist: "This link doesn't exist.",
    usedTitle: 'Already used', usedBody: 'This link was already used. If this was a mistake, contact the restaurant.',
    expiredTitle: 'Link expired', expiredBody: 'This link has expired — likely because the booking time has already passed.',
    alreadyCancelledTitle: 'Already cancelled', alreadyCancelledBody: 'This booking was already cancelled.',
    doneTitle: 'Booking cancelled',
    doneRefunded: 'Your booking has been cancelled. The deposit will be refunded within 5-10 business days.',
    doneForfeited: "Your booking has been cancelled. Since it was less than 24 hours in advance, the deposit isn't refundable.",
  },
}

const html = (title: string, body: string, ok: boolean, lang: string) => `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:sans-serif;background:#FAF6F0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="background:#fff;border-radius:14px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,.07)">
<div style="font-size:40px;margin-bottom:12px">${ok ? '✅' : '⚠️'}</div>
<h1 style="font-size:20px;color:#1a130d;margin:0 0 10px">${title}</h1>
<p style="font-size:14px;color:#777;line-height:1.6;margin:0">${body}</p>
</div></body></html>`

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const lang: 'es' | 'en' = url.searchParams.get('lang') === 'en' ? 'en' : 'es'
  const t = ET[lang]

  if (!token) return new Response(html(t.invalidTitle, t.invalidMissing, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 400 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

  // 1. Token válido, no usado, no expirado
  const tRes = await fetch(`${supabaseUrl}/rest/v1/cancel_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tokens = await tRes.json()
  const tk = tokens[0]
  if (!tk) return new Response(html(t.invalidTitle, t.invalidNotExist, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 404 })
  if (tk.used_at) return new Response(html(t.usedTitle, t.usedBody, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 409 })
  if (new Date(tk.expires_at) < new Date()) return new Response(html(t.expiredTitle, t.expiredBody, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 410 })

  // 2. Traer la reserva + zona horaria real del restaurante
  const resRes = await fetch(
    `${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}&select=*,venues(name,timezone)`,
    { headers: h }
  )
  const reservation = (await resRes.json())?.[0]
  if (!reservation) return new Response(html(t.invalidTitle, t.invalidNotExist, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 404 })
  if (reservation.status === 'cancelled') {
    return new Response(html(t.alreadyCancelledTitle, t.alreadyCancelledBody, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 409 })
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

  if (reservation.payment_intent_id) {
    const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
      method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: tk.reservation_id }),
    })
    const locked = await lockRes.json()

    if (locked) {
      try {
        if (withinPenaltyWindow) {
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

  // 8. Email de cancelación — non-fatal
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
          lang,
        }),
      })
    } catch (e) { console.warn('[cancel-reservation-guest] email:', e instanceof Error ? e.message : e) }
  }

  return new Response(
    html(t.doneTitle, depositStatus === 'refunded' ? t.doneRefunded : t.doneForfeited, true, t.lang),
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )
})
