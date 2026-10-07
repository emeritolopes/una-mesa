/* ════ UNA MESA · funciones internas: solo service role ════
   upsert-customer y data-retention solo las llaman otras edge functions / cron
   con la service role key. Sin ella (o con la anon key) deben responder 401 y
   no tocar datos.

   Correr con:
     deno test --allow-net --allow-env --no-config tests/internal-functions-auth.test.ts
*/

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { SUPABASE_URL, ANON_KEY, SERVICE_KEY, TEST_VENUE_ID, h } from './helpers.ts'

async function call(name: string, headers: Record<string, string>, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  })
  return { status: res.status, text: await res.text() }
}

const customer = { venue_id: TEST_VENUE_ID, customer_name: 'AuthTest', customer_email: 'authtest@example.invalid' }

Deno.test('upsert-customer: sin Authorization → 401', async () => {
  const r = await call('upsert-customer', {}, customer)
  assertEquals(r.status === 401, true)
})

Deno.test('upsert-customer: con anon key → 401 y no crea el cliente', async () => {
  const r = await call('upsert-customer', { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }, customer)
  assertEquals(r.status === 401, true)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?email=eq.authtest@example.invalid&select=id`, { headers: h })
  assertEquals((await res.json()).length, 0)
})

Deno.test('upsert-customer: con service role key sigue funcionando', async () => {
  const r = await call('upsert-customer', { Authorization: `Bearer ${SERVICE_KEY}` }, customer)
  assertEquals(r.status, 200)
  await fetch(`${SUPABASE_URL}/rest/v1/customers?email=eq.authtest@example.invalid`, { method: 'DELETE', headers: h })
})

Deno.test('data-retention: con anon key → 401', async () => {
  const r = await call('data-retention', { Authorization: `Bearer ${ANON_KEY}` }, { dry_run: true })
  assertEquals(r.status === 401, true)
})

Deno.test('data-retention: dry_run con service role no modifica nada', async () => {
  const r = await call('data-retention', { Authorization: `Bearer ${SERVICE_KEY}` }, { dry_run: true })
  assertEquals(r.status, 200)
})
