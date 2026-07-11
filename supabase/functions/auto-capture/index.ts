// supabase/functions/auto-capture/index.ts
// Invocada por pg_cron cada 15 min con Authorization: Bearer <service_role>.
// Captura depósitos de reservas vencidas (grace period pasado) que siguen 'pending'.
// Usa try_lock_deposit_capture para no chocar con mark-noshow.

import Stripe from 'https://esm.sh/stripe@14?target=deno'

Deno.serve(async (req) => {
  // Solo service role puede invocar esto — el JWT anon no basta.
  // .trim() por si acaso al pegar la clave en Vault se cuela un espacio.
  const auth = (req.headers.get('Authorization') ?? '').trim()
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim()
  if (auth !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

  const dueRes = await fetch(`${supabaseUrl}/rest/v1/reservations_due_capture?select=id,payment_intent_id,stripe_connect_account_id&limit=50`, { headers: h })
  const due = await dueRes.json()

  const results: Array<{ id: string; result: string }> = []

  for (const r of due) {
    if (!r.stripe_connect_account_id) {
      // Reserva de un restaurante sin cuenta Connect (no debería pasar tras
      // la migración a direct charges, pero lo salteamos en vez de romper
      // el lote entero si aparece un caso viejo).
      results.push({ id: r.id, result: 'skipped_no_connect_account' })
      continue
    }

    // Lock atómico — si mark-noshow (u otra corrida del cron) llegó primero, esto devuelve vacío y saltamos
    const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
      method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: r.id }),
    })
    const locked = await lockRes.json()
    if (!locked || locked.length === 0) { results.push({ id: r.id, result: 'skipped_locked' }); continue }

    try {
      await stripe.paymentIntents.capture(r.payment_intent_id, {}, { stripeAccount: r.stripe_connect_account_id })
      await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${r.id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ status: 'no_show', deposit_status: 'captured' }),
      })
      results.push({ id: r.id, result: 'captured' })
    } catch (err) {
      await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${r.id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ deposit_status: 'capture_failed' }),
      })
      results.push({ id: r.id, result: `failed: ${err instanceof Error ? err.message : 'unknown'}` })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
