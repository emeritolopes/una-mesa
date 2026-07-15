/* ════ UNA MESA · pruebas automatizadas del núcleo de dinero (staff) ════
   Corre contra el proyecto real de Supabase, en modo test de Stripe.
   Ver tests/helpers.ts para las variables de entorno necesarias.

   Correr con:
     deno test --allow-net --allow-env --no-config tests/money-flows.test.ts
*/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  stripe, TEST_STRIPE_ACCOUNT_ID,
  createTestReservation, getReservation, deleteReservation, callFunction, rpc, getStaffToken,
} from './helpers.ts'

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
    const first = await callFunction('mark-completed', { reservation_id: reservation.id, status: 'completed' }, await getStaffToken())
    assertEquals(first.json.success, true)

    const second = await callFunction('cancel-reservation', { reservation_id: reservation.id }, await getStaffToken())
    assertEquals(second.status, 409)

    const finalState = await getReservation(reservation.id)
    assertEquals(finalState.status, 'completed')
    assertEquals(finalState.deposit_status, 'captured')
  } finally {
    await deleteReservation(reservation.id)
  }
})

Deno.test('find_stuck_reservations detecta un depósito atascado en capturing', async () => {
  const { reservation } = await createTestReservation({ hoursFromNow: 5 })
  try {
    await rpc('test_force_stuck_reservation', { p_reservation_id: reservation.id, p_minutes_ago: 15 })
    const issues = await rpc('find_stuck_reservations')
    const found = issues.find((i: { reservation_id: string }) => i.reservation_id === reservation.id)
    assertEquals(found?.issue, 'stuck_capturing')
  } finally {
    await deleteReservation(reservation.id)
  }
})
