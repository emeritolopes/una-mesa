/* ════ UNA MESA · onboarding-reminder ════
   Busca restaurantes que empezaron el formulario de Stripe pero se
   quedaron a medias por 24h o más, y les manda un recordatorio suave —
   una sola vez por restaurante, nunca en bucle. Pensada para llamarse
   desde un cron, no desde un cliente.
*/

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const query = new URLSearchParams({
      select: 'id,name,email,city,stripe_connect_invite_token',
      stripe_charges_enabled: 'eq.false',
      archived: 'eq.false',
      stripe_onboarding_started_at: `lt.${cutoff}`,
      stripe_onboarding_reminder_sent_at: 'is.null',
    })
    const res = await fetch(`${supabaseUrl}/rest/v1/venues?${query}`, { headers: h })
    const venues = await res.json()

    let sent = 0
    for (const venue of venues) {
      if (!venue.email || !venue.stripe_connect_invite_token) continue
      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            to: venue.email,
            restaurant_name: venue.name,
            onboarding_reminder_url: `https://app.unamesa.co/?connect_token=${venue.stripe_connect_invite_token}`,
            lang: venue.city === 'London' ? 'en' : 'es',
          }),
        })
        if (emailRes.ok) {
          await fetch(`${supabaseUrl}/rest/v1/venues?id=eq.${venue.id}`, {
            method: 'PATCH', headers: h,
            body: JSON.stringify({ stripe_onboarding_reminder_sent_at: new Date().toISOString() }),
          })
          sent++
        }
      } catch (e) { console.warn('[onboarding-reminder]', venue.id, e instanceof Error ? e.message : e) }
    }

    return new Response(JSON.stringify({ ok: true, checked: venues.length, sent }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
