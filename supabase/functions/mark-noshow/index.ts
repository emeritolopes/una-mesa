// supabase/functions/mark-noshow/index.ts
// GET ?token=<uuid>&lang=<es|en> &mdash; marca la reserva como no_show y captura el PaymentIntent...
// El dep&oacute;sito SE CAPTURA (es la penalizaci&oacute;n). Cancela solo la mesa.
// Un solo uso, expira, sin login.

import Stripe from 'https://esm.sh/stripe@14?target=deno'

const ET = {
  es: {
    lang: 'es',
    invalidTitle: 'Enlace inv&aacute;lido', invalidMissing: 'Falta el token.', invalidNotExist: 'Este enlace no existe.',
    usedTitle: 'Ya utilizado', usedBody: 'Este enlace ya se us&oacute;. Si fue un error, contacta con Una Mesa.',
    expiredTitle: 'Enlace caducado', expiredBody: 'Este enlace ha expirado.',
    unprocessableTitle: 'No procesable', unprocessableBody: 'El dep&oacute;sito de esta reserva ya fue procesado (capturado o cancelado antes).',
    doneTitle: 'No-show registrado',
    doneOk: 'La reserva se marc&oacute; como no-show y el dep&oacute;sito ha sido cobrado.',
    doneFailed: 'La reserva se marc&oacute; como no-show. El cobro del dep&oacute;sito fall&oacute; y queda pendiente de revisi&oacute;n.',
  },
  en: {
    lang: 'en',
    invalidTitle: 'Invalid link', invalidMissing: 'Token is missing.', invalidNotExist: "This link doesn't exist.",
    usedTitle: 'Already used', usedBody: 'This link was already used. If this was a mistake, contact Una Mesa.',
    expiredTitle: 'Link expired', expiredBody: 'This link has expired.',
    unprocessableTitle: 'Cannot process', unprocessableBody: "This booking's deposit was already processed (captured or cancelled earlier).",
    doneTitle: 'No-show recorded',
    doneOk: "The booking was marked as a no-show and the deposit has been charged.",
    doneFailed: 'The booking was marked as a no-show. Charging the deposit failed and needs manual review.',
  },
}

const html = (title: string, body: string, ok: boolean, lang: string) => `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:sans-serif;background:#FAF6F0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="background:#fff;border-radius:14px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,.07)">
<div style="font-size:40px;margin-bottom:12px">${ok ? '&#9989;' : '&#9888;'}</div>
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

  // 1. Token v&aacute;lido, no usado, no expirado
  const tRes = await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tokens = await tRes.json()
  const tk = tokens[0]
  if (!tk) return new Response(html(t.invalidTitle, t.invalidNotExist, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 404 })
  if (tk.used_at) return new Response(html(t.usedTitle, t.usedBody, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 409 })
  if (new Date(tk.expires_at) < new Date()) return new Response(html(t.expiredTitle, t.expiredBody, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 410 })

  // 2. Lock at&oacute;mico: solo procede si deposit_status era 'pending'
  const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
    method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: tk.reservation_id }),
  })
  const locked = await lockRes.json()
  if (!locked || locked.length === 0) {
    return new Response(html(t.unprocessableTitle, t.unprocessableBody, false, t.lang), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, status: 409 })
  }

  // 3. Capturar dep&oacute;sito (penalizaci&oacute;n por no-show) y marcar reserva
  const rRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}&select=id,payment_intent_id`, { headers: h })
  const reservation = (await rRes.json())[0]

  let captureOk = false
  if (reservation?.payment_intent_id) {
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
      await stripe.paymentIntents.capture(reservation.payment_intent_id)
      captureOk = true
    } catch (_) { /* si Stripe falla, deposit_status queda en 'capturing' para revisi&oacute;n manual */ }
  }

  await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}`, {
    method: 'PATCH', headers: h,
    body: JSON.stringify({ status: 'no_show', deposit_status: captureOk ? 'captured' : 'capture_failed' }),
  })
  await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
  })

  return new Response(
    html(t.doneTitle, captureOk ? t.doneOk : t.doneFailed, true, t.lang),
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )
})
