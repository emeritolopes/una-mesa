// supabase/functions/mark-noshow/index.ts
//
// GET  ?token=<uuid>&lang=<es|en> — muestra una pantalla de confirmación,
//      NO ejecuta nada todavía.
// POST (formulario, mismo token) — recién aquí se captura el depósito y se
//      marca la reserva. Es la acción irreversible.
//
// Antes, un solo GET ejecutaba la captura al cargar la página — vulnerable
// a que un escáner de seguridad de correo (Outlook, Gmail) pre-visite el
// link automáticamente y dispare el cobro sin que ningún humano haga clic.
// Los escáneres hacen GET pasivo para previsualizar; nunca envían
// formularios. Separar "ver" de "confirmar" en dos pasos distintos cierra
// ese hueco sin depender de JavaScript.

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
    confirmTitle: '&iquest;Confirmar no-show?',
    confirmBody: 'Vas a marcar esta reserva como no-show. Al confirmar, el dep&oacute;sito del cliente se cobrar&aacute; de forma <strong>irreversible</strong>. &Uacute;salo solo si el cliente no se present&oacute;.',
    confirmButton: 'S&iacute;, marcar como no-show y cobrar dep&oacute;sito',
    cancelLink: 'No hacer nada',
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
    confirmTitle: 'Confirm no-show?',
    confirmBody: "You're about to mark this booking as a no-show. Confirming will charge the customer's deposit <strong>irreversibly</strong>. Only use this if the customer didn't show up.",
    confirmButton: 'Yes, mark as no-show and charge deposit',
    cancelLink: 'Do nothing',
  },
}

const htmlResult = (title: string, body: string, ok: boolean, lang: string) => `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:sans-serif;background:#FAF6F0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="background:#fff;border-radius:14px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,.07)">
<div style="font-size:40px;margin-bottom:12px">${ok ? '&#9989;' : '&#9888;'}</div>
<h1 style="font-size:20px;color:#1a130d;margin:0 0 10px">${title}</h1>
<p style="font-size:14px;color:#777;line-height:1.6;margin:0">${body}</p>
</div></body></html>`

const htmlConfirm = (title: string, body: string, token: string, lang: string, t: typeof ET['es']) => `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="font-family:sans-serif;background:#FAF6F0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="background:#fff;border-radius:14px;padding:40px;max-width:420px;text-align:center;box-shadow:0 2px 16px rgba(0,0,0,.07)">
<div style="font-size:40px;margin-bottom:12px">&#9888;</div>
<h1 style="font-size:20px;color:#1a130d;margin:0 0 10px">${title}</h1>
<p style="font-size:14px;color:#777;line-height:1.6;margin:0 0 24px">${body}</p>
<form method="POST">
  <input type="hidden" name="token" value="${token}">
  <input type="hidden" name="lang" value="${lang}">
  <button type="submit" style="width:100%;background:#D8552E;color:#fff;border:none;padding:14px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:10px">${t.confirmButton}</button>
</form>
<p style="font-size:12px;color:#aaa;margin:0">${t.cancelLink}</p>
</div></body></html>`

async function validateToken(supabaseUrl: string, h: Record<string, string>, token: string, t: typeof ET['es']) {
  const tRes = await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tokens = await tRes.json()
  const tk = tokens[0]
  if (!tk) return { error: htmlResult(t.invalidTitle, t.invalidNotExist, false, t.lang), status: 404 }
  if (tk.used_at) return { error: htmlResult(t.usedTitle, t.usedBody, false, t.lang), status: 409 }
  if (new Date(tk.expires_at) < new Date()) return { error: htmlResult(t.expiredTitle, t.expiredBody, false, t.lang), status: 410 }
  return { tk }
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }

  let token: string | null
  let lang: 'es' | 'en'

  if (req.method === 'POST') {
    const form = await req.formData()
    token = form.get('token') as string | null
    lang = form.get('lang') === 'en' ? 'en' : 'es'
  } else {
    const url = new URL(req.url)
    token = url.searchParams.get('token')
    lang = url.searchParams.get('lang') === 'en' ? 'en' : 'es'
  }
  const t = ET[lang]

  if (!token) return new Response(htmlResult(t.invalidTitle, t.invalidMissing, false, t.lang), { headers, status: 400 })

  const check = await validateToken(supabaseUrl, h, token, t)
  if ('error' in check) return new Response(check.error, { headers, status: check.status })
  const tk = check.tk

  // GET — solo mostrar la pantalla de confirmación, nunca ejecutar nada.
  if (req.method !== 'POST') {
    return new Response(htmlConfirm(t.confirmTitle, t.confirmBody, token, lang, t), { headers })
  }

  // POST — aquí sí se ejecuta la acción irreversible, disparada por un
  // envío real de formulario (nunca por un escáner de correo).

  // Lock atómico: solo procede si deposit_status era 'pending'
  const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
    method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: tk.reservation_id }),
  })
  const locked = await lockRes.json()
  if (!locked || locked.length === 0) {
    return new Response(htmlResult(t.unprocessableTitle, t.unprocessableBody, false, t.lang), { headers, status: 409 })
  }

  // Capturar depósito (penalización por no-show) y marcar reserva
  const rRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}&select=id,payment_intent_id`, { headers: h })
  const reservation = (await rRes.json())[0]

  let captureOk = false
  if (reservation?.payment_intent_id) {
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
      await stripe.paymentIntents.capture(reservation.payment_intent_id)
      captureOk = true
    } catch (_) { /* si Stripe falla, deposit_status queda en 'capturing' para revisión manual */ }
  }

  await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}`, {
    method: 'PATCH', headers: h,
    body: JSON.stringify({ status: 'no_show', deposit_status: captureOk ? 'captured' : 'capture_failed' }),
  })
  await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
  })

  return new Response(
    htmlResult(t.doneTitle, captureOk ? t.doneOk : t.doneFailed, true, t.lang),
    { headers }
  )
})
