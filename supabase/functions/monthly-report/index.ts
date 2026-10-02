/* ════ UNA MESA · monthly-report ════
   "Una Mesa te trajo X comensales en <mes>": a monthly email for each
   restaurant with its funnel for the previous month (venue_funnel(), 041/042).

   Called by the cron (call_monthly_report, 042) with the service role, or by
   an admin. Body (all optional):
     month       'YYYY-MM'  month to report (default: previous month)
     venue_id    uuid       only this restaurant
     dry_run     true       compute and return the numbers, send nothing
     preview_to  email      send every report to this address instead of the
                            restaurants (nothing is logged, can be repeated)
   A restaurant gets each month at most once (venue_monthly_reports), and
   restaurants with nothing to report (no views, no bookings) are skipped.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

type Funnel = {
  restaurant_views: number; video_views: number; video_viewers: number; booking_starts: number
  bookings: number; covers_booked: number; bookings_attended: number; covers_attended: number
  no_shows: number; cancellations: number
}

const T = {
  en: {
    locale: 'en-GB',
    subject: (n: number, month: string, name: string) =>
      n > 0 ? `Una Mesa brought ${n} ${n === 1 ? 'diner' : 'diners'} to ${name} in ${month}` : `Your Una Mesa report for ${month} — ${name}`,
    headline: (n: number, month: string) => n > 0
      ? `Una Mesa brought you <b>${n} ${n === 1 ? 'diner' : 'diners'}</b> in ${month}.`
      : `Here's how ${month} went on Una Mesa.`,
    views: (n: number) => n > 0 ? `${n} people looked at your restaurant on Una Mesa.` : '',
    rows: {
      restaurant_views: 'Restaurant page views', video_viewers: 'People who watched your dishes',
      booking_starts: 'Started a booking', bookings: 'Bookings', covers_booked: 'Diners booked',
      covers_attended: 'Diners who came', no_shows: 'No-shows (deposit kept)',
    },
    pending: (n: number) => `${n} ${n === 1 ? 'booking is' : 'bookings are'} still waiting to be marked as completed or no-show — use the button in the booking email.`,
    note: 'Only bookings made through Una Mesa are counted — not the ones your team takes by phone.',
    footer: 'You get this email once a month. Questions? Just reply.',
  },
  es: {
    locale: 'es-ES',
    subject: (n: number, month: string, name: string) =>
      n > 0 ? `Una Mesa trajo ${n} ${n === 1 ? 'comensal' : 'comensales'} a ${name} en ${month}` : `Tu informe de Una Mesa de ${month} — ${name}`,
    headline: (n: number, month: string) => n > 0
      ? `Una Mesa te trajo <b>${n} ${n === 1 ? 'comensal' : 'comensales'}</b> en ${month}.`
      : `Así fue ${month} en Una Mesa.`,
    views: (n: number) => n > 0 ? `${n} personas vieron tu restaurante en Una Mesa.` : '',
    rows: {
      restaurant_views: 'Visitas a tu ficha', video_viewers: 'Personas que vieron tus platos',
      booking_starts: 'Empezaron una reserva', bookings: 'Reservas', covers_booked: 'Comensales reservados',
      covers_attended: 'Comensales que vinieron', no_shows: 'No-shows (depósito cobrado)',
    },
    pending: (n: number) => `${n} ${n === 1 ? 'reserva está' : 'reservas están'} pendientes de marcar como completada o no-show — usa el botón del email de cada reserva.`,
    note: 'Solo contamos las reservas hechas a través de Una Mesa, no las que tu equipo toma por teléfono.',
    footer: 'Recibes este email una vez al mes. ¿Dudas? Responde a este email.',
  },
}

function monthRange(ym?: string) {
  const now = new Date()
  const [y, m] = ym && /^\d{4}-\d{2}$/.test(ym)
    ? ym.split('-').map(Number)
    : (() => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)); return [d.getUTCFullYear(), d.getUTCMonth() + 1] })()
  const from = new Date(Date.UTC(y, m - 1, 1))
  const to = new Date(Date.UTC(y, m, 0))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to), date: from }
}

function renderEmail(lang: 'en' | 'es', venueName: string, monthLabel: string, f: Funnel) {
  const t = T[lang]
  const pending = Math.max(0, f.bookings - f.bookings_attended - f.no_shows)
  const rows = (['restaurant_views', 'video_viewers', 'booking_starts', 'bookings', 'covers_booked', 'covers_attended', 'no_shows'] as const)
    .map(k => `<tr><td style="padding:10px 0;border-bottom:1px solid #EBE8E2;color:#57423C;font-size:14px">${t.rows[k]}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EBE8E2;text-align:right;font-weight:700;font-size:15px;color:#1C1C18">${f[k]}</td></tr>`).join('')
  return `<!DOCTYPE html><html><body style="margin:0;background:#FCF9F3;font-family:'Helvetica Neue',Arial,sans-serif;color:#1C1C18">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FCF9F3;padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #EBE8E2;border-radius:16px;padding:32px">
      <tr><td style="padding-bottom:10px"><img src="https://app.unamesa.co/una-mesa-logo.png" width="174" height="48" alt="Una Mesa" style="display:block;border:0"></td></tr>
      <tr><td style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8B716A;font-weight:700;padding-bottom:20px">${venueName} · ${monthLabel}</td></tr>
      <tr><td style="font-family:Georgia,serif;font-size:28px;line-height:1.25;color:#1C1C18;padding-bottom:8px">${t.headline(f.covers_attended, monthLabel).replace('<b>', '<b style="color:#973312">')}</td></tr>
      <tr><td style="font-size:15px;color:#57423C;padding-bottom:24px">${t.views(f.restaurant_views)}</td></tr>
      <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
      ${pending > 0 ? `<tr><td style="padding-top:20px;font-size:13px;color:#794900;background:#FFF6EA;border-radius:10px;padding:12px 14px;margin-top:16px">${t.pending(pending)}</td></tr>` : ''}
      <tr><td style="padding-top:20px;font-size:12px;color:#8B716A">${t.note}</td></tr>
      <tr><td style="padding-top:8px;font-size:12px;color:#8B716A">${t.footer}</td></tr>
    </table>
  </td></tr></table></body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    // Caller must be the cron (service role) or an admin
    const authHeader = req.headers.get('Authorization') || ''
    if (authHeader !== `Bearer ${serviceKey}`) {
      const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: authHeader } })
      const caller = await callerRes.json().catch(() => null)
      if (!caller?.id) return json({ error: 'unauthorized' }, 401)
      const adm = await (await fetch(`${supabaseUrl}/rest/v1/admins?user_id=eq.${caller.id}&select=user_id`, { headers: h })).json()
      if (!Array.isArray(adm) || !adm.length) return json({ error: 'forbidden' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const { month, venue_id, dry_run, preview_to } = body as { month?: string; venue_id?: string; dry_run?: boolean; preview_to?: string }
    const range = monthRange(month)

    const q = new URLSearchParams({ select: 'id,name,email,city', archived: 'eq.false' })
    if (venue_id) q.set('id', `eq.${venue_id}`)
    const venues = await (await fetch(`${supabaseUrl}/rest/v1/venues?${q}`, { headers: h })).json()

    const already = new Set<string>(
      (await (await fetch(`${supabaseUrl}/rest/v1/venue_monthly_reports?month=eq.${range.from}&select=venue_id`, { headers: h })).json())
        .map((r: { venue_id: string }) => r.venue_id))

    const results: unknown[] = []
    for (const v of venues) {
      const lang: 'en' | 'es' = v.city === 'London' ? 'en' : 'es'
      const fRes = await fetch(`${supabaseUrl}/rest/v1/rpc/venue_funnel`, {
        method: 'POST', headers: h, body: JSON.stringify({ p_venue_id: v.id, p_from: range.from, p_to: range.to }),
      })
      const f = (await fRes.json())?.[0] as Funnel | undefined
      if (!f) { results.push({ venue: v.name, error: 'funnel failed' }); continue }

      const nothing = f.restaurant_views === 0 && f.bookings === 0
      const recipient = preview_to || v.email
      const status = nothing ? 'skipped: nothing to report'
        : !recipient ? 'skipped: no email'
        : !preview_to && already.has(v.id) ? 'skipped: already sent'
        : dry_run ? 'dry run' : 'send'
      if (status !== 'send') { results.push({ venue: v.name, status, funnel: f }); continue }

      if (!resendKey) return json({ error: 'RESEND_API_KEY not set' }, 500)
      const monthLabel = range.date.toLocaleDateString(T[lang].locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Una Mesa <no-reply@unamesa.co>',
          reply_to: 'hello@unamesa.co.uk',
          to: [recipient],
          subject: (preview_to ? '[Preview] ' : '') + T[lang].subject(f.covers_attended, monthLabel, v.name),
          html: renderEmail(lang, v.name, monthLabel, f),
        }),
      })
      if (!res.ok) { results.push({ venue: v.name, status: 'email failed', detail: await res.text() }); continue }

      if (!preview_to) {
        await fetch(`${supabaseUrl}/rest/v1/venue_monthly_reports`, {
          method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
          body: JSON.stringify({ venue_id: v.id, month: range.from, sent_to: recipient, stats: f }),
        })
      }
      results.push({ venue: v.name, status: preview_to ? `preview sent to ${preview_to}` : `sent to ${recipient}`, funnel: f })
    }

    return json({ ok: true, month: range.from, results })
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Internal server error' }, 500)
  }
})
