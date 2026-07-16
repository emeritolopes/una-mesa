/* ════ UNA MESA · helpers compartidos entre archivos de prueba ════ */

import Stripe from 'https://esm.sh/stripe@14?target=deno'

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
export const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
export const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
export const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY_TEST')!
export const TEST_VENUE_ID = Deno.env.get('TEST_VENUE_ID')!
export const TEST_STRIPE_ACCOUNT_ID = Deno.env.get('TEST_STRIPE_ACCOUNT_ID')!
export const TEST_STAFF_EMAIL = Deno.env.get('TEST_STAFF_EMAIL')!
export const TEST_STAFF_PASSWORD = Deno.env.get('TEST_STAFF_PASSWORD')!

export const h = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
export const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

let staffToken: string | null = null
export async function getStaffToken(): Promise<string> {
  if (staffToken) return staffToken
  staffToken = await loginAs(TEST_STAFF_EMAIL, TEST_STAFF_PASSWORD)
  return staffToken
}

const tokenCache = new Map<string, string>()
export async function loginAs(email: string, password: string): Promise<string> {
  const cached = tokenCache.get(email)
  if (cached) return cached
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  const token: string | undefined = json.access_token
  if (!token) throw new Error(`No se pudo iniciar sesión como ${email}: ` + JSON.stringify(json))
  tokenCache.set(email, token)
  return token
}

export async function createTestReservation(opts: { hoursFromNow: number; depositCents?: number; customerEmail?: string }) {
  const deposit = opts.depositCents ?? 1000
  const pi = await stripe.paymentIntents.create(
    {
      amount: deposit, currency: 'eur', capture_method: 'manual',
      payment_method: 'pm_card_visa', confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    },
    { stripeAccount: TEST_STRIPE_ACCOUNT_ID }
  )
  const when = new Date(Date.now() + opts.hoursFromNow * 3600_000)
  const date = when.toISOString().slice(0, 10)
  const time = when.toISOString().slice(11, 16) + ':00'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
    method: 'POST', headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({
      venue_id: TEST_VENUE_ID, customer_name: 'TEST_AUTOMATED', pax: 2,
      customer_email: opts.customerEmail ?? null,
      date, time, status: 'confirmed', deposit_status: 'pending', payment_intent_id: pi.id,
    }),
  })
  const [reservation] = await res.json()
  return { reservation, paymentIntentId: pi.id }
}

export async function getReservation(id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}&select=*`, { headers: h })
  const [r] = await res.json()
  return r
}

export async function deleteReservation(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}`, { method: 'DELETE', headers: h })
}

export async function callFunction(name: string, body: unknown, authToken?: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${authToken ?? SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, json: await res.json() }
}

export async function rpc(name: string, args: unknown = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: h, body: JSON.stringify(args) })
  const text = await res.text()
  if (!text) return null // funciones que devuelven void (ej. test_force_stuck_reservation)
  return JSON.parse(text)
}
