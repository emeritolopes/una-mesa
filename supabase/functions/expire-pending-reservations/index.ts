/* ════ UNA MESA · expire-pending-reservations ════
   Cron cada 15 min (migración 046). Para las reservas 'pending' creadas con
   confirmación manual:
     · a mitad de plazo → recordatorio al restaurante (mismo enlace, un solo uso)
     · al vencer el plazo → reserva 'cancelled' + aviso al comensal

   plazo = max(creación + 1 h, min(creación + 12 h, hora de la reserva − 1 h))

   Body opcional: { "dry_run": true } → solo informa de lo que haría, sin tocar nada.
   Seguro de repetir: la cancelación es un PATCH atómico solo si sigue 'pending',
   y el recordatorio se marca en el token para no enviarse dos veces.
*/

const HOUR = 60 * 60 * 1000
const MIN_WINDOW = 1 * HOUR
const MAX_WINDOW = 12 * HOUR
const BEFORE_SLOT = 1 * HOUR
const BACKOFHOUSE_URL = 'https://www.unamesa-backofhouse.com'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Fecha + hora locales del restaurante → instante UTC (ms). Londres / Madrid.
function zonedToUtcMs(date: string, time: string, tz: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(guess)).map((p) => [p.type, p.value]),
  )
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute)
  return guess - (asUtc - guess)
}

function dayLabel(date: string, lang: 'es' | 'en') {
  return new Date(date + 'T00:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  })
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    let dryRun = false
    try { dryRun = (await req.json())?.dry_run === true } catch { /* sin body */ }

    const query = new URLSearchParams({
      select: 'id,token,reminder_sent_at,reservations!inner(id,status,date,time,pax,customer_name,customer_email,customer_phone,created_at,venues(name,email,city))',
      used_at: 'is.null',
      'reservations.status': 'eq.pending',
      limit: '200',
    })
    const res = await fetch(`${supabaseUrl}/rest/v1/reservation_response_tokens?${query}`, { headers: h })
    if (!res.ok) return json({ ok: false, error: 'query failed', status: res.status, detail: await res.text() }, 500)
    const rows = await res.json()

    const now = Date.now()
    const report: { reservation_id: string; action: string }[] = []
    let reminded = 0, expired = 0

    for (const t of Array.isArray(rows) ? rows : []) {
      const r = t.reservations
      const venue = r?.venues
      if (!r || !venue || !r.date || !r.time) continue

      const lang: 'es' | 'en' = venue.city === 'London' ? 'en' : 'es'
      const tz = venue.city === 'London' ? 'Europe/London' : 'Europe/Madrid'
      const [hh, mm] = String(r.time).split(':')
      const shownTime = `${hh.padStart(2, '0')}:${(mm || '00').slice(0, 2)}`

      const created = Date.parse(r.created_at)
      const slot = zonedToUtcMs(r.date, shownTime, tz)
      const deadline = Math.max(created + MIN_WINDOW, Math.min(created + MAX_WINDOW, slot - BEFORE_SLOT))
      const remindAt = created + (deadline - created) / 2
      const label = dayLabel(r.date, lang)

      if (now >= deadline) {
        report.push({ reservation_id: r.id, action: 'expire' })
        if (dryRun) continue

        // Atómico: solo si sigue pendiente (el restaurante pudo responder entre medias).
        const patch = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${r.id}&status=eq.pending`, {
          method: 'PATCH', headers: { ...h, Prefer: 'return=representation' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
        const changed = patch.ok ? await patch.json() : []
        if (!Array.isArray(changed) || changed.length === 0) continue
        expired++

        await fetch(`${supabaseUrl}/rest/v1/reservation_response_tokens?id=eq.${t.id}`, {
          method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
        }).catch(() => null)

        if (r.customer_email) {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST', headers: h,
            body: JSON.stringify({
              to: r.customer_email, customer_name: r.customer_name || r.customer_email,
              restaurant_name: venue.name, date: label, time: shownTime, pax: r.pax,
              response_status: 'expired', lang,
            }),
          }).then(async (m) => { if (!m.ok) console.warn('[expire-pending] diner email', m.status, await m.text()) })
            .catch((e) => console.warn('[expire-pending] diner email failed:', e))
        }
      } else if (now >= remindAt && !t.reminder_sent_at && venue.email) {
        report.push({ reservation_id: r.id, action: 'remind' })
        if (dryRun) continue

        const mail = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST', headers: h,
          body: JSON.stringify({
            to: venue.email, customer_name: r.customer_name || r.customer_email || r.customer_phone || 'Cliente',
            restaurant_name: venue.name, date: label, time: shownTime, pax: r.pax,
            customer_phone: r.customer_phone || null, customer_email: r.customer_email || null,
            respond_confirm_url: `${BACKOFHOUSE_URL}/?respond_token=${t.token}&action=confirm`,
            respond_decline_url: `${BACKOFHOUSE_URL}/?respond_token=${t.token}&action=decline`,
            reminder: true, lang,
          }),
        }).catch(() => null)
        if (mail && mail.ok) {
          await fetch(`${supabaseUrl}/rest/v1/reservation_response_tokens?id=eq.${t.id}`, {
            method: 'PATCH', headers: h, body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }),
          }).catch(() => null)
          reminded++
        } else {
          console.warn('[expire-pending] reminder email failed for', r.id, mail ? mail.status : 'network')
        }
      }
    }

    return json({ ok: true, dry_run: dryRun, checked: Array.isArray(rows) ? rows.length : 0, reminded, expired, actions: report })
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Internal server error' }, 500)
  }
})
