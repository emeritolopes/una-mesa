/* ════ UNA MESA · health-check ════
   Revisa anomalías reales — depósitos atascados en "capturing", reservas
   que ya debieron capturarse y no se capturaron, y (desde hoy) si los
   propios crons dejaron de correr. Antes, la única forma de enterarse
   era revisar SQL a mano; ahora corre solo (vía pg_cron) y manda un
   email si encuentra algo.

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
    const [moneyRes, cronRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/rpc/find_stuck_reservations`, { method: 'POST', headers: h, body: JSON.stringify({}) }),
      fetch(`${supabaseUrl}/rest/v1/rpc/find_cron_issues`, { method: 'POST', headers: h, body: JSON.stringify({}) }),
    ])
    const moneyIssues = await moneyRes.json()
    const cronIssues = await cronRes.json()

    const totalIssues = (Array.isArray(moneyIssues) ? moneyIssues.length : 0) + (Array.isArray(cronIssues) ? cronIssues.length : 0)

    if (totalIssues === 0) {
      return new Response(JSON.stringify({ ok: true, issues: 0 }), { headers: { 'Content-Type': 'application/json' } })
    }

    const moneyLines = (moneyIssues || []).map((i: { issue: string; venue_name: string; reservation_id: string; detail: string }) =>
      `- [dinero: ${i.issue}] ${i.venue_name} — reserva ${i.reservation_id} — ${i.detail}`
    )
    const cronLines = (cronIssues || []).map((i: { issue: string; job_name: string; detail: string }) =>
      `- [cron: ${i.issue}] ${i.job_name} — ${i.detail}`
    )
    const lines = [...moneyLines, ...cronLines].join('\n')

    const apiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Una Mesa <no-reply@unamesa.co>',
        to: [ALERT_EMAIL],
        subject: `⚠️ Una Mesa — ${totalIssues} anomalía(s) detectada(s)`,
        text: `Se encontraron ${totalIssues} anomalía(s):\n\n${lines}\n\nRevisa manualmente en Supabase.`,
      }),
    })

    return new Response(JSON.stringify({ ok: true, issues: totalIssues }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
