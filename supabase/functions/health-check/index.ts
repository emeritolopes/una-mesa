/* ════ UNA MESA · health-check ════
   Revisa dos anomalías reales de dinero — depósitos atascados en
   "capturing", y reservas que ya debieron capturarse y no se capturaron.
   Antes, la única forma de enterarse era revisar SQL a mano; ahora corre
   solo (vía pg_cron) y manda un email si encuentra algo.

   Sin parámetros — pensada para llamarse desde un cron, no desde un
   cliente. No requiere JWT (verify_jwt = false en config.toml), ya que
   pg_cron no puede mandar un Authorization header de usuario real.
*/

const ALERT_EMAIL = 'unamesagroup@gmail.com'

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/find_stuck_reservations`, {
      method: 'POST', headers: h, body: JSON.stringify({}),
    })
    const issues = await res.json()

    if (!Array.isArray(issues) || issues.length === 0) {
      return new Response(JSON.stringify({ ok: true, issues: 0 }), { headers: { 'Content-Type': 'application/json' } })
    }

    const lines = issues.map((i: { issue: string; venue_name: string; reservation_id: string; detail: string }) =>
      `- [${i.issue}] ${i.venue_name} — reserva ${i.reservation_id} — ${i.detail}`
    ).join('\n')

    const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Una Mesa <no-reply@unamesa.co>',
        to: [ALERT_EMAIL],
        subject: `⚠️ Una Mesa — ${issues.length} anomalía(s) detectada(s)`,
        text: `Se encontraron ${issues.length} reserva(s) con problemas:\n\n${lines}\n\nRevisa manualmente en Supabase.`,
      }),
    })

    return new Response(JSON.stringify({ ok: true, issues: issues.length }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
