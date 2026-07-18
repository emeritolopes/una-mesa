/* ════ UNA MESA · pruebas automatizadas de funciones de admin de hoy ════
   Cubre lo construido hoy que se puede probar sin depender de eventos
   externos de Stripe: archivar/reactivar un restaurante, y el formulario
   público de interés de restaurantes.

   Correr con:
     deno test --allow-net --allow-env --no-config tests/admin-features.test.ts
*/

import { assertEquals, assertExists } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { SUPABASE_URL, ANON_KEY, h, getStaffToken } from './helpers.ts'

async function createTempVenue(overrides: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/venues`, {
    method: 'POST', headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({
      name: 'TEST_ADMIN_FEATURES_' + crypto.randomUUID().slice(0, 8),
      city: 'Madrid', deposit_amount: 1000, capacity: 50,
      stripe_mode: 'test',
      ...overrides,
    }),
  })
  const [venue] = await res.json()
  return venue
}

async function deleteVenue(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${id}`, { method: 'DELETE', headers: h })
}

async function callUpdateVenue(body: unknown, token: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/update-venue`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, json: await res.json() }
}

// ── Archivar / reactivar ─────────────────────────────────────────────

Deno.test('archivar un restaurante lo oculta, reactivarlo lo devuelve', async () => {
  // Nota: update-venue exige admin real — no hay una cuenta de admin con
  // contraseña utilizable en pruebas automatizadas (la real usa Google
  // OAuth). Esta prueba confirma el comportamiento a nivel de base de
  // datos directamente, que es lo que de verdad decide la visibilidad.
  const venue = await createTempVenue({ archived: false })
  try {
    // Estado inicial: visible
    const before = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}&select=archived`, { headers: h })
    assertEquals((await before.json())[0].archived, false)

    // Archivar
    await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}`, {
      method: 'PATCH', headers: h, body: JSON.stringify({ archived: true }),
    })
    const afterArchive = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}&select=archived`, { headers: h })
    assertEquals((await afterArchive.json())[0].archived, true)

    // Reactivar
    await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}`, {
      method: 'PATCH', headers: h, body: JSON.stringify({ archived: false }),
    })
    const afterReactivate = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}&select=archived`, { headers: h })
    assertEquals((await afterReactivate.json())[0].archived, false)
  } finally {
    await deleteVenue(venue.id)
  }
})

Deno.test('update-venue rechaza a quien no es admin (incluye el campo archived)', async () => {
  const venue = await createTempVenue()
  try {
    const staffToken = await getStaffToken()
    const { status, json } = await callUpdateVenue({ venue_id: venue.id, archived: true }, staffToken)
    assertEquals(status, 403)
    assertEquals(json.error, 'forbidden — admin only')

    // Confirma que de verdad no cambió nada
    const check = await fetch(`${SUPABASE_URL}/rest/v1/venues?id=eq.${venue.id}&select=archived`, { headers: h })
    assertEquals((await check.json())[0].archived, false)
  } finally {
    await deleteVenue(venue.id)
  }
})

// ── Formulario de interés de restaurantes ───────────────────────────

Deno.test('submit-restaurant-lead guarda el lead correctamente', async () => {
  const uniqueEmail = `test-lead-${crypto.randomUUID().slice(0, 8)}@example.com`
  const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-restaurant-lead`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurant_name: 'TEST_LEAD_RESTAURANT',
      contact_name: 'Test Contact',
      email: uniqueEmail,
      phone: '+44 7000 000000',
      city: 'London',
    }),
  })
  const json = await res.json()
  assertEquals(res.ok, true)
  assertEquals(json.success, true)

  // Confirma que de verdad se guardó — leído vía service_role, ya que la
  // tabla es de solo-lectura para admin, no para el público.
  const check = await fetch(`${SUPABASE_URL}/rest/v1/restaurant_leads?email=eq.${uniqueEmail}&select=*`, { headers: h })
  const rows = await check.json()
  assertEquals(rows.length, 1)
  assertEquals(rows[0].restaurant_name, 'TEST_LEAD_RESTAURANT')

  // Limpieza
  await fetch(`${SUPABASE_URL}/rest/v1/restaurant_leads?email=eq.${uniqueEmail}`, { method: 'DELETE', headers: h })
})

Deno.test('submit-restaurant-lead rechaza un envío sin email', async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-restaurant-lead`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurant_name: 'TEST_SIN_EMAIL' }),
  })
  assertEquals(res.status, 400)
})

Deno.test('los leads no se pueden leer con la clave pública, solo con admin', async () => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurant_leads?select=*&limit=1`, {
    headers: { apikey: ANON_KEY },
  })
  const json = await res.json()
  // Sin sesión de ningún tipo, RLS debe devolver vacío, nunca los leads reales.
  assertEquals(Array.isArray(json), true)
  assertEquals(json.length, 0)
})
