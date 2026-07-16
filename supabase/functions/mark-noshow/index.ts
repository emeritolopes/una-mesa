// supabase/functions/mark-noshow/index.ts
//
// API JSON pura — Supabase no permite servir HTML renderizable desde una
// función Edge en el dominio compartido *.supabase.co. La pantalla vive
// dentro de backofhouse, que llama a esta función por fetch().
//
// Ahora resuelve las DOS salidas posibles de una reserva desde un solo
// link — antes existía solo "no-show"; un restaurante que nunca abre
// backofhouse no tenía ninguna forma de decir "el cliente sí vino" sin
// iniciar sesión, así que cada reserva terminaba registrada como no-show
// en el historial aunque el cliente hubiera asistido de verdad. El nombre
// del archivo/tabla se queda igual para no romper nada ya desplegado —
// solo el comportamiento se generaliza.
//
// POST { token, execute?: boolean, outcome?: 'completed' | 'no_show' }
//   execute ausente o false → solo valida el token, no ejecuta nada.
//   execute: true → requiere outcome. Captura el depósito en los dos
//     casos (el cliente vino o no, el depósito se cobra igual — la
//     diferencia es solo la etiqueta en el historial), y marca la
//     reserva con el estado correspondiente.

import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }

  let token: string | undefined
  let execute = false
  let outcome: 'completed' | 'no_show' | null = null
  try {
    const body = await req.json()
    token = body.token
    execute = body.execute === true
    outcome = body.outcome === 'completed' ? 'completed' : body.outcome === 'no_show' ? 'no_show' : null
  } catch (_) {
    return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 400 })
  }

  if (!token) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 400 })
  if (execute && !outcome) return new Response(JSON.stringify({ ok: false, code: 'invalid', error: 'outcome required' }), { headers: jsonHeaders, status: 400 })

  // 1. Token válido, no usado, no expirado
  const tRes = await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tokens = await tRes.json()
  const tk = tokens[0]
  if (!tk) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 404 })
  if (tk.used_at) return new Response(JSON.stringify({ ok: false, code: 'used' }), { headers: jsonHeaders, status: 409 })
  if (new Date(tk.expires_at) < new Date()) return new Response(JSON.stringify({ ok: false, code: 'expired' }), { headers: jsonHeaders, status: 410 })

  // 2. Traer detalles de la reserva — útiles para mostrar en la pantalla,
  //    tanto en el modo "solo validar" como en el de ejecutar.
  const rRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}&select=id,customer_name,date,time,pax,payment_intent_id,deposit_amount,status,venues(name,stripe_connect_account_id,stripe_mode)`, { headers: h })
  const reservation = (await rRes.json())?.[0]
  if (!reservation) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { headers: jsonHeaders, status: 404 })

  const details = {
    customer_name: reservation.customer_name,
    restaurant_name: reservation.venues?.name,
    date: reservation.date,
    time: reservation.time,
    pax: reservation.pax,
    deposit_amount: reservation.deposit_amount,
  }

  // Ya resuelta de otra forma (cancelada, por ejemplo) antes de que el
  // restaurante llegara a usar este link — evita sobreescribir un estado
  // que ya no corresponde.
  if (reservation.status && reservation.status !== 'confirmed') {
    return new Response(JSON.stringify({ ok: false, code: 'already_resolved', resolved_status: reservation.status, ...details }), { headers: jsonHeaders, status: 409 })
  }

  // Modo "solo validar" — no toca nada, solo confirma que el token sirve y
  // devuelve los datos para mostrar en la pantalla de confirmación.
  if (!execute) {
    return new Response(JSON.stringify({ ok: true, code: 'valid', ...details }), { headers: jsonHeaders })
  }

  // Modo "ejecutar" — a partir de aquí es la acción irreversible, disparada
  // solo por un clic real en la pantalla de backofhouse.

  const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
    method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: tk.reservation_id }),
  })
  const locked = await lockRes.json()
  if (!locked || locked.length === 0) {
    return new Response(JSON.stringify({ ok: false, code: 'unprocessable' }), { headers: jsonHeaders, status: 409 })
  }

  let captureOk = false
  const stripeAccount = reservation.venues?.stripe_connect_account_id
  if (reservation.payment_intent_id && stripeAccount) {
    try {
      const isLive = reservation.venues?.stripe_mode === 'live'
      const stripe = new Stripe((isLive ? Deno.env.get('STRIPE_SECRET_KEY_LIVE') : Deno.env.get('STRIPE_SECRET_KEY_TEST')) ?? '', { apiVersion: '2024-06-20' })
      await stripe.paymentIntents.capture(reservation.payment_intent_id, {}, { stripeAccount })
      captureOk = true
    } catch (_) { /* si Stripe falla, deposit_status queda en 'capturing' para revisión manual */ }
  }

  await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}`, {
    method: 'PATCH', headers: h,
    body: JSON.stringify({ status: outcome, deposit_status: captureOk ? 'captured' : 'capture_failed' }),
  })
  await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
  })

  return new Response(JSON.stringify({ ok: true, code: captureOk ? 'success' : 'capture_failed', outcome, ...details }), { headers: jsonHeaders })
})
