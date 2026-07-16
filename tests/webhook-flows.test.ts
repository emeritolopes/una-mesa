/* ════ UNA MESA · pruebas automatizadas de stripe-webhook ════
   El momento donde de verdad se crea la reserva — nunca se había probado
   de forma automática. Construye un evento real de Stripe (payment_intent.
   amount_capturable_updated), lo firma con el secreto real de Connect
   (igual que Stripe firma sus webhooks reales), y lo manda directo a la
   función — sin depender de que Stripe entregue un webhook de verdad.

   Requiere, además de las variables de tests/helpers.ts:
     STRIPE_CONNECT_WEBHOOK_SECRET — el mismo secreto que guardaste con
       `supabase secrets set STRIPE_CONNECT_WEBHOOK_SECRET=...`

   Correr con:
     deno test --allow-net --allow-env --no-config tests/webhook-flows.test.ts
*/

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { SUPABASE_URL, h, stripe, TEST_VENUE_ID, TEST_STRIPE_ACCOUNT_ID } from './helpers.ts'

const CONNECT_WEBHOOK_SECRET = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET_TEST')!

async function getReservationByPaymentIntent(piId: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?payment_intent_id=eq.${piId}&select=*`, { headers: h })
  const rows = await res.json()
  return rows[0] ?? null
}

async function deleteReservationById(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}`, { method: 'DELETE', headers: h })
}

async function signStripePayload(payload: string, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000)
  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const signatureHex = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `t=${timestamp},v1=${signatureHex}`
}

async function sendWebhookEvent(pi: Stripe.PaymentIntent) {
  const event = {
    id: 'evt_test_' + crypto.randomUUID(),
    object: 'event',
    type: 'payment_intent.amount_capturable_updated',
    account: TEST_STRIPE_ACCOUNT_ID,
    data: { object: pi },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    api_version: '2024-06-20',
  }
  const payload = JSON.stringify(event)
  const signature = await signStripePayload(payload, CONNECT_WEBHOOK_SECRET)

  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body: payload,
  })
  return { status: res.status, json: await res.json() }
}

Deno.test('stripe-webhook crea la reserva correctamente a partir del evento', async () => {
  const uniquePhone = '+34600' + Math.floor(Math.random() * 900000 + 100000)
  const pi = await stripe.paymentIntents.create(
    {
      amount: 1000, currency: 'eur', capture_method: 'manual',
      payment_method: 'pm_card_visa', confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        restaurant_id: TEST_VENUE_ID, user_id: '', reservation_id: 'UM-TEST01',
        party: '2', date: '2026-08-20', time: '20:00',
        customer_name: 'TEST_WEBHOOK', customer_phone: uniquePhone, customer_email: '',
        lang: 'es',
      },
    },
    { stripeAccount: TEST_STRIPE_ACCOUNT_ID }
  )

  let reservationId: string | null = null
  try {
    const { json } = await sendWebhookEvent(pi)
    assertEquals(json.received, true)
    assertExists(json.reservation_id)
    reservationId = json.reservation_id

    const reservation = await getReservationByPaymentIntent(pi.id)
    assertExists(reservation)
    assertEquals(reservation.venue_id, TEST_VENUE_ID)
    assertEquals(reservation.customer_name, 'TEST_WEBHOOK')
    assertEquals(reservation.customer_phone, uniquePhone)
    assertEquals(reservation.pax, 2)
    assertEquals(reservation.status, 'confirmed')
    assertEquals(reservation.deposit_status, 'pending')
  } finally {
    if (reservationId) await deleteReservationById(reservationId)
    // Deshacemos también la autorización en Stripe, para no dejar dinero de prueba retenido.
    try { await stripe.paymentIntents.cancel(pi.id, { stripeAccount: TEST_STRIPE_ACCOUNT_ID }) } catch (_) { /* puede que ya no aplique */ }
  }
})

Deno.test('stripe-webhook es idempotente — reenviar el mismo evento no duplica la reserva', async () => {
  const uniquePhone = '+34600' + Math.floor(Math.random() * 900000 + 100000)
  const pi = await stripe.paymentIntents.create(
    {
      amount: 1000, currency: 'eur', capture_method: 'manual',
      payment_method: 'pm_card_visa', confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        restaurant_id: TEST_VENUE_ID, user_id: '', reservation_id: 'UM-TEST02',
        party: '2', date: '2026-08-20', time: '20:00',
        customer_name: 'TEST_WEBHOOK_IDEMPOTENT', customer_phone: uniquePhone, customer_email: '',
        lang: 'es',
      },
    },
    { stripeAccount: TEST_STRIPE_ACCOUNT_ID }
  )

  let reservationId: string | null = null
  try {
    const first = await sendWebhookEvent(pi)
    assertEquals(first.json.received, true)
    reservationId = first.json.reservation_id

    const second = await sendWebhookEvent(pi)
    assertEquals(second.json.already_processed, true)

    // Debe seguir existiendo UNA sola reserva para este payment_intent_id, no dos.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?payment_intent_id=eq.${pi.id}&select=id`, { headers: h })
    const rows = await res.json()
    assertEquals(rows.length, 1)
  } finally {
    if (reservationId) await deleteReservationById(reservationId)
    try { await stripe.paymentIntents.cancel(pi.id, { stripeAccount: TEST_STRIPE_ACCOUNT_ID }) } catch (_) { /* puede que ya no aplique */ }
  }
})

Deno.test('stripe-webhook rechaza un evento con firma inválida', async () => {
  const fakeEvent = { id: 'evt_fake', type: 'payment_intent.amount_capturable_updated', data: { object: {} } }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': 'firma_inventada_no_valida' },
    body: JSON.stringify(fakeEvent),
  })
  assertEquals(res.status, 400)
})
