import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · stripe-connect-self-onboard ════
   Público, sin login — el restaurante llega aquí con el token que Emerito
   le mandó por email (generado una sola vez desde stripe-connect-onboard).
   Genera un link de onboarding fresco de Stripe cada vez que lo abre,
   hasta que termine — sin que Emerito tenga que hacer nada más por su cuenta.

   Seguridad: se niega a generar un nuevo link si el restaurante YA completó
   la verificación (stripe_charges_enabled = true) — sin esto, cualquiera
   con el link viejo (aunque fuera solo el propio restaurante mucho después)
   podría reabrir el formulario de una cuenta activa y cambiar la cuenta
   bancaria de destino de los pagos.

   POST { token }
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }

  try {
    const { token } = await req.json()
    if (!token) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { status: 400, headers: jsonHeaders })

    const vRes = await fetch(
      `${supabaseUrl}/rest/v1/venues?stripe_connect_invite_token=eq.${token}&select=id,name,city,email,stripe_connect_account_id,stripe_charges_enabled,stripe_connect_invite_expires_at,stripe_mode`,
      { headers: h }
    )
    const venue = (await vRes.json())?.[0]
    if (!venue) return new Response(JSON.stringify({ ok: false, code: 'invalid' }), { status: 404, headers: jsonHeaders })

    if (venue.stripe_connect_invite_expires_at && new Date(venue.stripe_connect_invite_expires_at) < new Date()) {
      return new Response(JSON.stringify({ ok: false, code: 'expired' }), { status: 410, headers: jsonHeaders })
    }

    if (venue.stripe_charges_enabled) {
      // Ya está activo — no generamos un link nuevo, para que nadie pueda
      // reabrir el formulario y cambiar la cuenta bancaria de destino.
      return new Response(JSON.stringify({ ok: false, code: 'already_connected', restaurant_name: venue.name }), { status: 409, headers: jsonHeaders })
    }

    const isLive = venue.stripe_mode === 'live'
    const stripe = new Stripe((isLive ? Deno.env.get('STRIPE_SECRET_KEY_LIVE') : Deno.env.get('STRIPE_SECRET_KEY_TEST')) ?? '', { apiVersion: '2024-06-20' })

    let accountId = venue.stripe_connect_account_id
    if (!accountId) {
      const country = venue.city === 'London' ? 'GB' : 'ES'
      const account = await stripe.accounts.create({
        type: 'express',
        country,
        email: venue.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
      })
      accountId = account.id
      await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue.id}`, {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ stripe_connect_account_id: accountId, stripe_onboarding_started_at: new Date().toISOString() }),
      })
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `https://app.unamesa.co/?connect_token=${token}`,
      return_url: `https://app.unamesa.co/?connect_token=${token}&done=1`,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ ok: true, code: 'success', onboarding_url: accountLink.url, restaurant_name: venue.name }),
      { headers: jsonHeaders }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ ok: false, code: 'error', error: message }), { status: 500, headers: jsonHeaders })
  }
})
