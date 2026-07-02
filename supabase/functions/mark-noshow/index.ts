// supabase/functions/mark-noshow/index.ts
// GET ?token=<uuid> — marca la reserva como no_show y cancela el PaymentIntent...
// NO: en no-show el depósito SE CAPTURA (es la penalización). Cancela solo la mesa.
// Un solo uso, expira, sin login.

import Stripe from 'https://esm.sh/stripe@14?target=deno'

const html = (title: string, body: string, ok: boolean) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
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
  if (!token) return new Response(html('Enlace inválido', 'Falta el token.', false), { headers: { 'Content-Type': 'text/html' }, status: 400 })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  // 1. Token válido, no usado, no expirado
  const tRes = await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tokens = await tRes.json()
  const t = tokens[0]
  if (!t) return new Response(html('Enlace inválido', 'Este enlace no existe.', false), { headers: { 'Content-Type': 'text/html' }, status: 404 })
  if (t.used_at) return new Response(html('Ya utilizado', 'Este enlace ya se usó. Si fue un error, contacta con Una Mesa.', false), { headers: { 'Content-Type': 'text/html' }, status: 409 })
  if (new Date(t.expires_at) < new Date()) return new Response(html('Enlace caducado', 'Este enlace ha expirado.', false), { headers: { 'Content-Type': 'text/html' }, status: 410 })

  // 2. Lock atómico: solo procede si deposit_status era 'pending'
  const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
    method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: t.reservation_id }),
  })
  const locked = await lockRes.json()
  if (!locked || locked.length === 0) {
    return new Response(html('No procesable', 'El depósito de esta reserva ya fue procesado (capturado o cancelado antes).', false), { headers: { 'Content-Type': 'text/html' }, status: 409 })
  }

  // 3. Capturar depósito (penalización por no-show) y marcar reserva
  const rRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${t.reservation_id}&select=id,payment_intent_id`, { headers: h })
  const reservation = (await rRes.json())[0]

  let captureOk = false
  if (reservation?.payment_intent_id) {
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
      await stripe.paymentIntents.capture(reservation.payment_intent_id)
      captureOk = true
    } catch (_) { /* si Stripe falla, deposit_status queda en 'capturing' para revisión manual */ }
  }

  await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${t.reservation_id}`, {
    method: 'PATCH', headers: h,
    body: JSON.stringify({ status: 'no_show', deposit_status: captureOk ? 'captured' : 'capture_failed' }),
  })
  await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
  })

  return new Response(
    html('No-show registrado', captureOk
      ? 'La reserva se marcó como no-show y el depósito ha sido cobrado.'
      : 'La reserva se marcó como no-show. El cobro del depósito falló y queda pendiente de revisión.', true),
    { headers: { 'Content-Type': 'text/html' } }
  )
})
