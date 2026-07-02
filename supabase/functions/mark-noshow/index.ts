import Stripe from 'https://esm.sh/stripe@14?target=deno'

Deno.serve(async (req) => {
  // magic-link: opened in browser → returns HTML, no JWT
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  const page = (title: string, body: string, ok = true) => new Response(
    `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Una Mesa</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:40px 20px; background:#F5F4F0; font-family:'Manrope',Arial,sans-serif;
         display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .card { background:#fff; border-radius:20px; max-width:480px; width:100%; padding:48px 40px;
          text-align:center; box-shadow:0 4px 32px rgba(0,0,0,.08); }
  .icon { font-size:52px; margin-bottom:20px; }
  h1 { margin:0 0 12px; font-size:24px; font-weight:800; color:${ok ? '#121212' : '#CC3300'}; }
  p { margin:0; font-size:15px; color:#666; line-height:1.6; }
  .badge { display:inline-block; margin-top:24px; padding:6px 16px; border-radius:20px;
           font-size:12px; font-weight:700; letter-spacing:.5px;
           background:${ok ? '#F0FAF0' : '#FFF0EE'}; color:${ok ? '#187C40' : '#CC3300'}; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">${ok ? '✅' : '⚠️'}</div>
  <h1>${title}</h1>
  <p>${body}</p>
  <span class="badge">Una Mesa</span>
</div>
</body>
</html>`,
    { status: ok ? 200 : 422, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
  )

  if (!token) return page('Enlace inválido', 'Falta el parámetro token.', false)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    // Fetch token record
    const tRes = await fetch(
      `${supabaseUrl}/rest/v1/noshow_tokens?token=eq.${token}&select=id,reservation_id,expires_at,used_at`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const [nt] = await tRes.json()

    if (!nt)                                      return page('Enlace no encontrado', 'Este enlace no existe o ha caducado.', false)
    if (nt.used_at)                               return page('Ya utilizado', 'Este enlace ya fue usado. El depósito fue procesado anteriormente.', false)
    if (new Date(nt.expires_at) < new Date())     return page('Enlace caducado', 'El enlace es válido solo 24 h desde la hora de la reserva.', false)

    // Fetch reservation
    const rRes = await fetch(
      `${supabaseUrl}/rest/v1/reservations?id=eq.${nt.reservation_id}&select=id,payment_intent_id,deposit_status,status`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const [reservation] = await rRes.json()

    if (!reservation)              return page('Reserva no encontrada', 'No se encontró la reserva.', false)
    if (!reservation.payment_intent_id) return page('Sin cargo pendiente', 'Esta reserva no tiene depósito autorizado.', false)

    if (reservation.deposit_status === 'captured') {
      // Already captured — just mark token used and confirm
      await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?id=eq.${nt.id}`, {
        method: 'PATCH',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ used_at: new Date().toISOString() })
      })
      return page('Depósito ya cobrado', 'El depósito de esta reserva ya fue capturado previamente.')
    }

    // Atomic lock: pending/null → 'capturing'
    const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_reservation_id: nt.reservation_id })
    })
    const locked: boolean = await lockRes.json()

    if (!locked) return page('En proceso', 'El depósito ya está siendo procesado. Espera un momento y recarga.', false)

    // Capture via Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })
    let captureStatus = 'captured'
    try {
      await stripe.paymentIntents.capture(reservation.payment_intent_id)
    } catch (e) {
      console.error('Stripe capture error:', e instanceof Error ? e.message : e)
      captureStatus = 'capture_failed'
    }

    // Update reservation
    await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${nt.reservation_id}`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'no_show', deposit_status: captureStatus })
    })

    // Mark token used
    await fetch(`${supabaseUrl}/rest/v1/noshow_tokens?id=eq.${nt.id}`, {
      method: 'PATCH',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ used_at: new Date().toISOString() })
    })

    if (captureStatus === 'captured') {
      return page('No-show registrado', 'El cliente ha sido marcado como no presentado y el depósito ha sido cobrado correctamente.')
    } else {
      return page('No-show registrado — error en cobro',
        'El cliente fue marcado como no-show pero el cobro del depósito falló. Revisa Stripe manualmente.', false)
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return page('Error interno', msg, false)
  }
})
