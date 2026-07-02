import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const stripe      = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

  try {
    // Fetch all reservations past grace period that still have an uncaptured deposit
    const viewRes = await fetch(
      `${supabaseUrl}/rest/v1/reservations_due_capture?select=id,payment_intent_id,venue_id`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    const due: Array<{ id: string; payment_intent_id: string; venue_id: string }> = await viewRes.json()

    if (!Array.isArray(due) || due.length === 0) {
      return new Response(JSON.stringify({ processed: 0, results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const results = []

    for (const r of due) {
      // Atomic lock — skip if already being captured by another run
      const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_reservation_id: r.id })
      })
      const locked: boolean = await lockRes.json()

      if (!locked) {
        results.push({ id: r.id, outcome: 'skipped_locked' })
        continue
      }

      let depositStatus = 'captured'
      let stripeError: string | null = null

      try {
        await stripe.paymentIntents.capture(r.payment_intent_id)
      } catch (e) {
        stripeError = e instanceof Error ? e.message : String(e)
        depositStatus = 'capture_failed'
        console.error(`[auto-capture] Stripe error for ${r.id}:`, stripeError)
      }

      // Update reservation
      await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${r.id}`, {
        method: 'PATCH',
        headers: {
          apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal'
        },
        body: JSON.stringify({ deposit_status: depositStatus })
      })

      results.push({ id: r.id, outcome: depositStatus, ...(stripeError ? { error: stripeError } : {}) })
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
