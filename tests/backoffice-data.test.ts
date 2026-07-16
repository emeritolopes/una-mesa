/* ════ UNA MESA · pruebas automatizadas de carta e inventario ════
   menu_categories, menu_items, stock_items no tienen funciones de Edge
   propias — carta.jsx/stock.jsx escriben directo a Supabase, protegidos
   solo por RLS. Estas pruebas confirman el aislamiento entre restaurantes
   (la misma fuga que encontramos y cerramos hoy — "Allow all for
   authenticated" dejaba que cualquiera tocara el menú de cualquiera) y
   que la lectura pública solo expone platos disponibles, nunca el
   inventario.

   Requiere, además de lo de helpers.ts:
     TEST_STAFF_B_EMAIL, TEST_STAFF_B_PASSWORD — cuenta de un SEGUNDO
       restaurante real (testB / DiverXO), para probar aislamiento de verdad.
     TEST_VENUE_B_ID — el venue_id de ese segundo restaurante.

   Correr con:
     deno test --allow-net --allow-env --no-config tests/backoffice-data.test.ts
*/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { SUPABASE_URL, ANON_KEY, h, TEST_VENUE_ID, loginAs, getStaffToken } from './helpers.ts'

const TEST_STAFF_B_EMAIL = Deno.env.get('TEST_STAFF_B_EMAIL')!
const TEST_STAFF_B_PASSWORD = Deno.env.get('TEST_STAFF_B_PASSWORD')!
const TEST_VENUE_B_ID = Deno.env.get('TEST_VENUE_B_ID')!

async function asStaff(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
      ...(method !== 'GET' ? { Prefer: 'return=representation' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, json: await res.json() }
}

async function asAnon(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: ANON_KEY } })
  return { status: res.status, json: await res.json() }
}

async function deleteMenuItem(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, { method: 'DELETE', headers: h })
}
async function deleteStockItem(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/stock_items?id=eq.${id}`, { method: 'DELETE', headers: h })
}

Deno.test('un restaurante puede crear su propio plato', async () => {
  const tokenA = await getStaffToken()
  const { status, json } = await asStaff(tokenA, 'POST', 'menu_items', {
    venue_id: TEST_VENUE_ID, name: 'TEST_PLATO_A', price: 12.5, available: true,
  })
  assertEquals(status, 201)
  const item = json[0]
  try {
    assertEquals(item.venue_id, TEST_VENUE_ID)
  } finally {
    await deleteMenuItem(item.id)
  }
})

Deno.test('un restaurante NO puede crear un plato a nombre de otro restaurante (RLS with_check)', async () => {
  const tokenA = await getStaffToken()
  const { status } = await asStaff(tokenA, 'POST', 'menu_items', {
    venue_id: TEST_VENUE_B_ID, name: 'TEST_INTENTO_AJENO', price: 9.99, available: true,
  })
  // RLS rechaza el INSERT — PostgREST responde con error, no con éxito.
  assertEquals(status >= 400, true)
})

Deno.test('un restaurante NO puede leer un plato NO disponible de otro restaurante', async () => {
  const tokenA = await getStaffToken()
  const created = await asStaff(tokenA, 'POST', 'menu_items', {
    venue_id: TEST_VENUE_ID, name: 'TEST_PLATO_OCULTO', price: 8, available: false,
  })
  const item = created.json[0]
  try {
    const tokenB = await loginAs(TEST_STAFF_B_EMAIL, TEST_STAFF_B_PASSWORD)
    const { json } = await asStaff(tokenB, 'GET', `menu_items?id=eq.${item.id}&select=*`)
    assertEquals(json.length, 0) // invisible para el otro restaurante
  } finally {
    await deleteMenuItem(item.id)
  }
})

Deno.test('un restaurante NO puede actualizar un plato de otro restaurante', async () => {
  const tokenA = await getStaffToken()
  const created = await asStaff(tokenA, 'POST', 'menu_items', {
    venue_id: TEST_VENUE_ID, name: 'TEST_PLATO_PROTEGIDO', price: 15, available: true,
  })
  const item = created.json[0]
  try {
    const tokenB = await loginAs(TEST_STAFF_B_EMAIL, TEST_STAFF_B_PASSWORD)
    const { json } = await asStaff(tokenB, 'PATCH', `menu_items?id=eq.${item.id}`, { price: 1 })
    assertEquals(json.length, 0) // RLS: 0 filas afectadas, no error — pero tampoco cambio

    const stillOriginal = await asStaff(tokenA, 'GET', `menu_items?id=eq.${item.id}&select=price`)
    assertEquals(Number(stillOriginal.json[0].price), 15)
  } finally {
    await deleteMenuItem(item.id)
  }
})

Deno.test('la lectura pública solo expone platos disponibles', async () => {
  const tokenA = await getStaffToken()
  const created = await asStaff(tokenA, 'POST', 'menu_items', {
    venue_id: TEST_VENUE_ID, name: 'TEST_PLATO_PUBLICO_DISPONIBLE', price: 10, available: true,
  })
  const hidden = await asStaff(tokenA, 'POST', 'menu_items', {
    venue_id: TEST_VENUE_ID, name: 'TEST_PLATO_PUBLICO_OCULTO', price: 10, available: false,
  })
  const visibleItem = created.json[0]
  const hiddenItem = hidden.json[0]
  try {
    const visible = await asAnon(`menu_items?id=eq.${visibleItem.id}&select=*`)
    assertEquals(visible.json.length, 1)

    const invisible = await asAnon(`menu_items?id=eq.${hiddenItem.id}&select=*`)
    assertEquals(invisible.json.length, 0)
  } finally {
    await deleteMenuItem(visibleItem.id)
    await deleteMenuItem(hiddenItem.id)
  }
})

Deno.test('el inventario nunca es público, ni siquiera parcialmente', async () => {
  const tokenA = await getStaffToken()
  const created = await asStaff(tokenA, 'POST', 'stock_items', {
    venue_id: TEST_VENUE_ID, name: 'TEST_INVENTARIO', category: 'Despensa', unit: 'kg', qty: 5, par: 10, cost: 3.5,
  })
  const item = created.json[0]
  try {
    const anonRead = await asAnon(`stock_items?id=eq.${item.id}&select=*`)
    assertEquals(anonRead.json.length, 0) // sin política de lectura pública — invisible siempre

    const tokenB = await loginAs(TEST_STAFF_B_EMAIL, TEST_STAFF_B_PASSWORD)
    const otherRestaurantRead = await asStaff(tokenB, 'GET', `stock_items?id=eq.${item.id}&select=*`)
    assertEquals(otherRestaurantRead.json.length, 0) // tampoco otro restaurante
  } finally {
    await deleteStockItem(item.id)
  }
})
