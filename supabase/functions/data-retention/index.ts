import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · data-retention ════
   Cron diario (migración 051). Dos pasos:
   1. Reservas con más de RESERVATION_RETENTION_MONTHS meses: borra nombre,
      teléfono y email de la copia en Stripe (metadata del PaymentIntent, en la
      cuenta Connect del restaurante) y luego anonimiza la fila en la base de datos.
   2. run_data_retention(): notas libres, perfiles de cliente, leads, eventos de embudo.
   Plazo por defecto PENDIENTE DE CONFIRMAR con el solicitor.
   Solo la service role key puede llamarla. { "dry_run": true } solo cuenta.
*/

const RESERVATION_RETENTION_MONTHS = 24
const BATCH = 100
const MAX_BATCHES = 10
const ANON_NAME = 'Guest (deleted)'
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

type Row = {
  id: string
  payment_intent_id: string | null
  venues: { stripe_connect_account_id: string | null; stripe_mode: string | null } | null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
  if (!serviceKey || !safeEqual(bearer, serviceKey)) return json({ error: 'unauthorized' }, 401)

  let dryRun = false
  try { dryRun = (await req.json())?.dry_run === true } catch { /* body vacío */ }

  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  const cutoffDate = new Date()
  cutoffDate.setUTCMonth(cutoffDate.getUTCMonth() - RESERVATION_RETENTION_MONTHS)
  const cutoff = cutoffDate.toISOString().slice(0, 10)

  const orFilter = encodeURIComponent(
    `(customer_email.not.is.null,customer_phone.not.is.null,customer_name.neq.${ANON_NAME},notes.not.is.null,user_id.not.is.null)`
  )
  const select = 'id,payment_intent_id,venues(stripe_connect_account_id,stripe_mode)'

  let anonymized = 0
  let stripeScrubbed = 0
  const stripeFailed: string[] = []

  for (let i = 0; i < MAX_BATCHES; i++) {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/reservations?date=lt.${cutoff}&or=${orFilter}&select=${select}&limit=${BATCH}`,
      { headers: h }
    )
    if (!res.ok) { console.error('[data-retention] select failed', res.status, await res.text()); break }
    const rows: Row[] = await res.json()
    if (rows.length === 0) break

    if (dryRun) {
      // En dry_run no se modifica nada, así que la misma página volvería a salir:
      // se cuenta solo la primera página y se para.
      anonymized = rows.length
      break
    }

    for (const r of rows) {
      const acct = r.venues?.stripe_connect_account_id
      if (!r.payment_intent_id || !acct) continue
      const key = r.venues?.stripe_mode === 'live'
        ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
        : Deno.env.get('STRIPE_SECRET_KEY_TEST')
      if (!key) { stripeFailed.push(r.id); continue }
      try {
        const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
        await stripe.paymentIntents.update(
          r.payment_intent_id,
          { metadata: { customer_name: '', customer_phone: '', customer_email: '', user_id: '' } },
          { stripeAccount: acct }
        )
        stripeScrubbed++
      } catch (e) {
        stripeFailed.push(r.id)
        console.warn('[data-retention] stripe scrub failed', r.id, e instanceof Error ? e.message : e)
      }
    }

    // La base de datos se anonimiza aunque Stripe falle: eliminar la copia propia
    // tiene prioridad. Los ids fallidos quedan en el log para limpiar a mano.
    const ids = rows.map(r => r.id).join(',')
    const patch = await fetch(`${supabaseUrl}/rest/v1/reservations?id=in.(${ids})`, {
      method: 'PATCH',
      headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ customer_name: ANON_NAME, customer_phone: null, customer_email: null, notes: null, user_id: null }),
    })
    if (!patch.ok) { console.error('[data-retention] anonymize failed', patch.status, await patch.text()); break }
    anonymized += rows.length
    if (rows.length < BATCH) break
  }

  let dbResult: unknown = null
  if (!dryRun) {
    const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/run_data_retention`, { method: 'POST', headers: h, body: '{}' })
    dbResult = rpc.ok ? await rpc.json() : { error: rpc.status }
    if (!rpc.ok) console.error('[data-retention] run_data_retention failed', rpc.status)
  }

  console.log('[data-retention]', JSON.stringify({ dryRun, cutoff, anonymized, stripeScrubbed, stripeFailed, dbResult }))
  return json({
    dry_run: dryRun, cutoff,
    reservations_anonymized: anonymized,
    stripe_scrubbed: stripeScrubbed,
    stripe_failed: stripeFailed,
    db: dbResult,
  })
})
