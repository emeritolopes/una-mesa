/* ════ UNA MESA · pruebas automatizadas de avisos de onboarding ════
   Cubre lo construido ayer que faltaba probar: el recordatorio
   automático si un restaurante se queda a medias en Stripe, y que el
   webhook de account.updated actualiza stripe_charges_enabled
   correctamente y de forma idempotente.

   Nota honesta: no hay forma de verificar automáticamente que el email
   en sí se mandó (no hay infraestructura de "spy" sobre las llamadas a
   Resend) — estas pruebas confirman el comportamiento observable que sí
   podemos medir: qué restaurantes califican, y qué queda guardado en la
   base de datos.

   Requiere las mismas variables que el resto de tests/*.ts.

   Correr con:
     deno test --allow-net --allow-env --no-config tests/onboarding-notifications.test.ts
*/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { SUPABASE_URL, h } from './helpers.ts'

const CONNECT_WEBHOOK_SECRET = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET_TEST')!

async function createTempVenue(overrides: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues`, {
    method: 'POST', headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({
      name: 'TEST_ONBOARD_NOTIF_' + crypto.randomUUID().slice(0, 8),
      city: 'London', deposit_amount: 1000, capacity: 50,
      stripe_mode: 'test', archived: false, stripe_charges_enabled: false,
      email: 'test-onboard-notif@example.com',
      stripe_connect_invite_token: crypto.randomUUID(),
      ...overrides,
    }),
  })
  const [venue] = await res.json()
  return venue
}

async function getVenue(id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${id}&select=*`, { headers: h })
  return (await res.json())[0]
}

async function deleteVenue(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${id}`, { method: 'DELETE', headers: h })
}

async function callOnboardingReminder() {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/onboarding-reminder`, { method: 'POST', headers: h })
  return { status: res.status, json: await res.json() }
}

function hoursAgo(n: number) {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString()
}

// ── onboarding-reminder ──────────────────────────────────────────────

Deno.test('onboarding-reminder manda aviso a un restaurante que se quedó a medias más de 24h', async () => {
  const venue = await createTempVenue({ stripe_onboarding_started_at: hoursAgo(25) })
  try {
    await callOnboardingReminder()
    const after = await getVenue(venue.id)
    assertEquals(after.stripe_onboarding_reminder_sent_at !== null, true)
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('onboarding-reminder NO manda aviso si empezó hace menos de 24h', async () => {
  const venue = await createTempVenue({ stripe_onboarding_started_at: hoursAgo(1) })
  try {
    await callOnboardingReminder()
    const after = await getVenue(venue.id)
    assertEquals(after.stripe_onboarding_reminder_sent_at, null)
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('onboarding-reminder NO manda un segundo aviso si ya se mandó uno', async () => {
  const alreadySent = hoursAgo(3)
  const venue = await createTempVenue({ stripe_onboarding_started_at: hoursAgo(25), stripe_onboarding_reminder_sent_at: alreadySent })
  try {
    await callOnboardingReminder()
    const after = await getVenue(venue.id)
    // Debe seguir siendo exactamente la fecha original — no una nueva.
    assertEquals(new Date(after.stripe_onboarding_reminder_sent_at).getTime(), new Date(alreadySent).getTime())
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('onboarding-reminder ignora restaurantes archivados', async () => {
  const venue = await createTempVenue({ stripe_onboarding_started_at: hoursAgo(25), archived: true })
  try {
    await callOnboardingReminder()
    const after = await getVenue(venue.id)
    assertEquals(after.stripe_onboarding_reminder_sent_at, null)
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('onboarding-reminder ignora restaurantes que ya tienen Stripe activo', async () => {
  const venue = await createTempVenue({ stripe_onboarding_started_at: hoursAgo(25), stripe_charges_enabled: true })
  try {
    await callOnboardingReminder()
    const after = await getVenue(venue.id)
    assertEquals(after.stripe_onboarding_reminder_sent_at, null)
  } finally {
    await deleteVenue(venue.id)
  }
})

// ── account.updated webhook (confirmación de "ya estás en vivo") ────

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

async function sendAccountUpdatedEvent(accountId: string, chargesEnabled: boolean) {
  const event = {
    id: 'evt_test_' + crypto.randomUUID(),
    object: 'event',
    type: 'account.updated',
    data: { object: { id: accountId, object: 'account', charges_enabled: chargesEnabled } },
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

Deno.test('account.updated activa stripe_charges_enabled correctamente', async () => {
  const fakeAccountId = 'acct_test_' + crypto.randomUUID().slice(0, 16)
  const venue = await createTempVenue({ stripe_connect_account_id: fakeAccountId, stripe_charges_enabled: false })
  try {
    const { status } = await sendAccountUpdatedEvent(fakeAccountId, true)
    assertEquals(status, 200)
    const after = await getVenue(venue.id)
    assertEquals(after.stripe_charges_enabled, true)
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('account.updated es idempotente — repetir el mismo evento no falla ni revierte el estado', async () => {
  const fakeAccountId = 'acct_test_' + crypto.randomUUID().slice(0, 16)
  const venue = await createTempVenue({ stripe_connect_account_id: fakeAccountId, stripe_charges_enabled: false })
  try {
    await sendAccountUpdatedEvent(fakeAccountId, true)
    const { status: status2 } = await sendAccountUpdatedEvent(fakeAccountId, true)
    assertEquals(status2, 200)
    const after = await getVenue(venue.id)
    assertEquals(after.stripe_charges_enabled, true)
  } finally {
    await deleteVenue(venue.id)
  }
})
