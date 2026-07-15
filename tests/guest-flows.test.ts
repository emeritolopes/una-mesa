/* ════ UNA MESA · pruebas automatizadas de los flujos de invitado ════
   mark-noshow (link de email al restaurante) y cancel-reservation-guest
   (link de email al comensal) — los dos caminos de dinero que dependen
   de un token, no de una sesión de staff. Ver tests/helpers.ts para las
   variables de entorno necesarias.

   Correr con:
     deno test --allow-net --allow-env --no-config tests/guest-flows.test.ts
*/

import { assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  SUPABASE_URL, stripe, TEST_STRIPE_ACCOUNT_ID,
  createTestReservation, getReservation, deleteReservation, rpc,
} from './helpers.ts'

async function callPublic(name: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  return { status: res.status, json: await res.json() }
}

// ── mark-noshow ──────────────────────────────────────────────────────

Deno.test('mark-noshow: validar el token no ejecuta nada todavía', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: 5 })
  try {
    const token = await rpc('generate_noshow_token', { p_reservation_id: reservation.id })
    const { json } = await callPublic('mark-noshow', { token, execute: false })
    assertEquals(json.ok, true)
    assertEquals(json.code, 'valid')

    const stillPending = await getReservation(reservation.id)
    assertEquals(stillPending.deposit_status, 'pending')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('mark-noshow: outcome no_show captura el depósito y marca no_show', async () => {
  const { reservation, paymentIntentId } = await createTestReservation({ hoursFromNow: -1 })
  try {
    const token = await rpc('generate_noshow_token', { p_reservation_id: reservation.id })
    const { json } = await callPublic('mark-noshow', { token, execute: true, outcome: 'no_show' })
    assertEquals(json.ok, true)
    assertEquals(json.code, 'success')

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'no_show')
    assertEquals(updated.deposit_status, 'captured')

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { stripeAccount: TEST_STRIPE_ACCOUNT_ID })
    assertEquals(pi.status, 'succeeded')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('mark-noshow: outcome completed captura el depósito y marca completed', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: -1 })
  try {
    const token = await rpc('generate_noshow_token', { p_reservation_id: reservation.id })
    const { json } = await callPublic('mark-noshow', { token, execute: true, outcome: 'completed' })
    assertEquals(json.ok, true)

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'completed')
    assertEquals(updated.deposit_status, 'captured')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('mark-noshow: un token ya usado se rechaza, sin volver a cobrar', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: -1 })
  try {
    const token = await rpc('generate_noshow_token', { p_reservation_id: reservation.id })
    const first = await callPublic('mark-noshow', { token, execute: true, outcome: 'no_show' })
    assertEquals(first.json.ok, true)

    const second = await callPublic('mark-noshow', { token, execute: true, outcome: 'completed' })
    assertEquals(second.json.ok, false)
    assertEquals(second.json.code, 'used')

    // Debe seguir como quedó la primera vez, no la segunda.
    const finalState = await getReservation(reservation.id)
    assertEquals(finalState.status, 'no_show')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('mark-noshow: una reserva ya cancelada por otro camino no se sobreescribe', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: 5 })
  try {
    const token = await rpc('generate_noshow_token', { p_reservation_id: reservation.id })

    // Se cancela por otro camino (simulamos lo que haría cancel-reservation-guest)
    // antes de que el restaurante llegue a usar el link de no-show.
    await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${reservation.id}`, {
      method: 'PATCH',
      headers: { apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled', deposit_status: 'refunded' }),
    })

    const { json } = await callPublic('mark-noshow', { token, execute: true, outcome: 'no_show' })
    assertEquals(json.ok, false)
    assertEquals(json.code, 'already_resolved')

    const finalState = await getReservation(reservation.id)
    assertEquals(finalState.status, 'cancelled') // no debe pasar a 'no_show'
    assertEquals(finalState.deposit_status, 'refunded') // no debe capturarse
  } finally {
    await deleteReservation(reservation.id)
  }
})

// ── cancel-reservation-guest ─────────────────────────────────────────

Deno.test('cancel-reservation-guest: cancelar con menos de 24h captura el depósito', async () => {
  const { reservation, paymentIntentId } = await createTestReservation({ hoursFromNow: 5, customerEmail: 'test@example.com' })
  try {
    const token = await rpc('generate_cancel_token', { p_reservation_id: reservation.id })
    const { json } = await callPublic('cancel-reservation-guest', { token })
    assertEquals(json.ok, true)
    assertEquals(json.refunded, false)

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'cancelled')
    assertEquals(updated.deposit_status, 'captured')

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { stripeAccount: TEST_STRIPE_ACCOUNT_ID })
    assertEquals(pi.status, 'succeeded')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('cancel-reservation-guest: cancelar con más de 24h reembolsa', async () => {
  const { reservation, paymentIntentId } = await createTestReservation({ hoursFromNow: 48, customerEmail: 'test@example.com' })
  try {
    const token = await rpc('generate_cancel_token', { p_reservation_id: reservation.id })
    const { json } = await callPublic('cancel-reservation-guest', { token })
    assertEquals(json.ok, true)
    assertEquals(json.refunded, true)

    const updated = await getReservation(reservation.id)
    assertEquals(updated.status, 'cancelled')
    assertEquals(updated.deposit_status, 'refunded')

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { stripeAccount: TEST_STRIPE_ACCOUNT_ID })
    assertEquals(pi.status, 'canceled')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('cancel-reservation-guest: una reserva ya resuelta por el restaurante no se sobreescribe', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: -1, customerEmail: 'test@example.com' })
  try {
    const token = await rpc('generate_cancel_token', { p_reservation_id: reservation.id })

    // El restaurante ya la marcó como no-show antes de que el comensal
    // llegara a usar su propio link de cancelación.
    const noshowToken = await rpc('generate_noshow_token', { p_reservation_id: reservation.id })
    const resolved = await callPublic('mark-noshow', { token: noshowToken, execute: true, outcome: 'no_show' })
    assertEquals(resolved.json.ok, true)

    const { json, status } = await callPublic('cancel-reservation-guest', { token })
    assertNotEquals(status, 200)
    assertEquals(json.ok, false)

    const finalState = await getReservation(reservation.id)
    assertEquals(finalState.status, 'no_show') // no debe pasar a 'cancelled'
    assertEquals(finalState.deposit_status, 'captured') // no debe reembolsarse
  } finally {
    await deleteReservation(reservation.id)
  }
})
