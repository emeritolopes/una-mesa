/* ════ UNA MESA · pruebas automatizadas del núcleo de dinero ════
   Corre contra el proyecto real de Supabase, en modo test de Stripe —
   no hay entorno de staging separado. Cada prueba crea su propia
   reserva real, la ejecuta, confirma el resultado, y limpia después.

   Requiere estas variables de entorno (nunca escritas aquí):
     SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
     STRIPE_SECRET_KEY, TEST_VENUE_ID, TEST_STRIPE_ACCOUNT_ID,
     TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD

   TEST_VENUE_ID / TEST_STRIPE_ACCOUNT_ID deben ser un restaurante real
   con Stripe Connect ya activo (por ejemplo, El Bodegón Central).
   TEST_STAFF_EMAIL/PASSWORD deben ser una cuenta real vinculada a ese
   mismo restaurante en restaurant_users (por ejemplo, testA) — algunas
   de estas funciones exigen el JWT de un empleado real, no basta la
   service_role key, porque verifican dueño de verdad.

   Correr con:
     deno test --allow-net --allow-env tests/money-flows.test.ts
*/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const TEST_VENUE_ID = Deno.env.get('TEST_VENUE_ID')!
const TEST_STRIPE_ACCOUNT_ID = Deno.env.get('TEST_STRIPE_ACCOUNT_ID')!
const TEST_STAFF_EMAIL = Deno.env.get('TEST_STAFF_EMAIL')!
const TEST_STAFF_PASSWORD = Deno.env.get('TEST_STAFF_PASSWORD')!

const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

// ── Login real de staff — cancel-reservation/mark-completed verifican
//    dueño de verdad contra restaurant_users, la service_role key no basta ──
let staffToken: string | null = null
async function getStaffToken(): Promise<string> {
  if (staffToken) return staffToken
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_STAFF_EMAIL, password: TEST_STAFF_PASSWORD }),
  })
  const json = await res.json()
  const token: string | undefined = json.access_token
  if (!token) throw new Error('No se pudo iniciar sesión de staff de prueba: ' + JSON.stringify(json))
  staffToken = token
  return token
}

// ── Helpers ──────────────────────────────────────────────────────────

async function createTestReservation(opts: { hoursFromNow: number; depositCents?: number }) {
  const deposit = opts.depositCents ?? 1000
  const pi = await stripe.paymentIntents.create(
    { amount: deposit, currency: 'eur', capture_method: 'manual', payment_method: 'pm_card_visa', confirm: true },
    { stripeAccount: TEST_STRIPE_ACCOUNT_ID }
  )
  const when = new Date(Date.now() + opts.hoursFromNow * 3600_000)
  const date = when.toISOString().slice(0, 10)
  const time = when.toISOString().slice(11, 16) + ':00'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
    method: 'POST', headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({
      venue_id: TEST_VENUE_ID, customer_name: 'TEST_AUTOMATED', pax: 2,
      date, time, status: 'confirmed', deposit_status: 'pending', payment_intent_id: pi.id,
    }),
  })
  const [reservation] = await res.json()
  return { reservation, paymentIntentId: pi.id }
}

async function getReservation(id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}&select=*`, { headers: h })
  const [r] = await res.json()
  return r
}

async function deleteReservation(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}`, { method: 'DELETE', headers: h })
}

async function callFunction(name: string, body: unknown, authToken?: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${authToken ?? SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, json: await res.json() }
}

// ── Pruebas ──────────────────────────────────────────────────────────

Deno.test('cancelar con menos de 24h captura el depósito (penalización)', async () => {
  const { reservation, paymentIntentId } = await createTestReservation({ hoursFromNow: 5 })
  try {
    const { json } = await callFunction('cancel-reservation', { reservation_id: reservation.id }, await getStaffToken())
    assertEquals(json.success, true)

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'cancelled')
    assertEquals(updated.deposit_status, 'captured')

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { stripeAccount: TEST_STRIPE_ACCOUNT_ID })
    assertEquals(pi.status, 'succeeded')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('cancelar con más de 24h reembolsa el depósito', async () => {
  const { reservation, paymentIntentId } = await createTestReservation({ hoursFromNow: 48 })
  try {
    const { json } = await callFunction('cancel-reservation', { reservation_id: reservation.id }, await getStaffToken())
    assertEquals(json.success, true)

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'cancelled')
    assertEquals(updated.deposit_status, 'refunded')

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { stripeAccount: TEST_STRIPE_ACCOUNT_ID })
    assertEquals(pi.status, 'canceled')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('mark-completed captura el depósito y marca completed', async () => {
  const { reservation, paymentIntentId } = await createTestReservation({ hoursFromNow: -1 })
  try {
    const { json } = await callFunction('mark-completed', { reservation_id: reservation.id, status: 'completed' }, await getStaffToken())
    assertEquals(json.success, true)

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'completed')
    assertEquals(updated.deposit_status, 'captured')

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { stripeAccount: TEST_STRIPE_ACCOUNT_ID })
    assertEquals(pi.status, 'succeeded')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('cancelar una reserva ya resuelta no la sobreescribe (arreglo de la condición de carrera)', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: -1 })
  try {
    // La resolvemos primero como completada — simula que otro proceso ganó la carrera.
    const first = await callFunction('mark-completed', { reservation_id: reservation.id, status: 'completed' }, await getStaffToken())
    assertEquals(first.json.success, true)

    // Intentar cancelarla después NO debe tener éxito, ni sobreescribir con datos viejos.
    const second = await callFunction('cancel-reservation', { reservation_id: reservation.id }, await getStaffToken())
    assertEquals(second.status, 409)

    const finalState = await getReservation(reservation.id)
    assertEquals(finalState.status, 'completed') // debe seguir como quedó, no 'cancelled'
    assertEquals(finalState.deposit_status, 'captured')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('find_stuck_reservations detecta un depósito atascado en capturing', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: 5 })
  try {
    // Forzamos el estado atascado directamente, con updated_at en el pasado.
    await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${reservation.id}`, {
      method: 'PATCH', headers: h,
      body: JSON.stringify({ deposit_status: 'capturing', updated_at: new Date(Date.now() - 15 * 60_000).toISOString() }),
    })

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/find_stuck_reservations`, { method: 'POST', headers: h, body: '{}' })
    const issues = await res.json()
    const found = issues.find((i: { reservation_id: string }) => i.reservation_id === reservation.id)
    assertEquals(found?.issue, 'stuck_capturing')
  } finally {
    await deleteReservation(reservation.id)
  }
})
