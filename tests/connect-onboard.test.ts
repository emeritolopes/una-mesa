/* ════ UNA MESA · pruebas automatizadas de Stripe Connect onboarding ════
   stripe-connect-onboard exige ser admin, y la cuenta admin real inicia
   sesión con Google (OAuth) — no hay forma de autenticarla en una prueba
   automatizada sin un navegador de verdad. Por eso solo probamos:
   (a) que rechace correctamente a alguien que NO es admin (con la cuenta
       de staff que sí podemos loguear con contraseña), y
   (b) stripe-connect-self-onboard completo, que es público y sí se puede
       probar de principio a fin — incluida la protección que evita
       reabrir el formulario de una cuenta ya conectada (el vector de
       fraude que discutimos al construirla).

   Correr con:
     deno test --allow-net --allow-env --no-config tests/connect-onboard.test.ts
*/

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { SUPABASE_URL, h, callFunction, getStaffToken, TEST_VENUE_ID } from './helpers.ts'

async function createTempVenue(overrides: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues`, {
    method: 'POST', headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({
      name: 'TEST_CONNECT_VENUE_' + crypto.randomUUID().slice(0, 8),
      city: 'Madrid', deposit_amount: 1000, capacity: 50,
      stripe_mode: 'test', // el default de la columna ahora es 'live' — esta prueba nunca debe tocar Stripe real
      ...overrides,
    }),
  })
  const [venue] = await res.json()
  return venue
}

async function deleteVenue(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${id}`, { method: 'DELETE', headers: h })
}

async function setInviteToken(venueId: string, token: string, expiresInDays = 30) {
  await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venueId}`, {
    method: 'PATCH', headers: h,
    body: JSON.stringify({
      stripe_connect_invite_token: token,
      stripe_connect_invite_expires_at: new Date(Date.now() + expiresInDays * 86400_000).toISOString(),
    }),
  })
}

Deno.test('stripe-connect-onboard rechaza a quien no es admin', async () => {
  // TEST_STAFF_EMAIL es personal de restaurante (restaurant_users), no admin.
  const staffToken = await getStaffToken()
  const { status, json } = await callFunction('stripe-connect-onboard', { venue_id: TEST_VENUE_ID }, staffToken)
  assertEquals(status, 403)
  assertEquals(json.error, 'forbidden — admin only')
})

Deno.test('stripe-connect-self-onboard: token inexistente se rechaza', async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-connect-self-onboard`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'token-que-no-existe-' + crypto.randomUUID() }),
  })
  const json = await res.json()
  assertEquals(res.status, 404)
  assertEquals(json.code, 'invalid')
})

Deno.test('stripe-connect-self-onboard: genera un link real para un restaurante sin conectar', async () => {
  const token = crypto.randomUUID()
  const venue = await createTempVenue()
  try {
    await setInviteToken(venue.id, token)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-connect-self-onboard`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const json = await res.json()
    assertEquals(json.ok, true)
    assertEquals(json.code, 'success')
    assertExists(json.onboarding_url)
    assertEquals(json.onboarding_url.startsWith('https://connect.stripe.com/'), true)

    // Confirma que sí se creó (y guardó) una cuenta Express real en Stripe.
    const check = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}&select=stripe_connect_account_id`, { headers: h })
    const [row] = await check.json()
    assertExists(row.stripe_connect_account_id)
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('stripe-connect-self-onboard: se niega a reabrir el formulario de una cuenta ya conectada', async () => {
  // Protección contra secuestro de cuenta de pago — si alguien reabre este
  // link una vez que el restaurante ya está verificado, no debe poder
  // regenerar el formulario (que permitiría cambiar la cuenta bancaria).
  const token = crypto.randomUUID()
  const venue = await createTempVenue({ stripe_charges_enabled: true, stripe_connect_account_id: 'acct_fake_ya_conectado' })
  try {
    await setInviteToken(venue.id, token)
    const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-connect-self-onboard`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const json = await res.json()
    assertEquals(res.status, 409)
    assertEquals(json.ok, false)
    assertEquals(json.code, 'already_connected')
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('stripe-connect-self-onboard: un token expirado se rechaza', async () => {
  const token = crypto.randomUUID()
  const venue = await createTempVenue()
  try {
    await setInviteToken(venue.id, token, -1) // expiró hace un día
    const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-connect-self-onboard`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    const json = await res.json()
    assertEquals(res.status, 410)
    assertEquals(json.code, 'expired')
  } finally {
    await deleteVenue(venue.id)
  }
})
