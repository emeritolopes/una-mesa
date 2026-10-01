/* ════ UNA MESA · send-reservation-reminders ════
   Cron cada 30 min (migración 050). Manda al comensal UN recordatorio por reserva,
   con el enlace de cancelar, cuando la reserva está 'confirmed', tiene email, y:
     · faltan 24 h o menos, y al menos 2 h, para la hora de la reserva (hora del local)
     · se hizo hace 6 h o más (si no, llegaría pegado al email de confirmación)

   Body opcional: { "dry_run": true } → solo informa, no envía ni marca nada.
   Seguro de repetir: la reserva se "reclama" con un PATCH atómico (reminder_sent_at
   is null) antes de enviar; si el email falla se libera para reintentar en la
   siguiente pasada.
*/

const HOUR = 60 * 60 * 1000
const REMIND_WITHIN = 24 * HOUR      // como mucho 24 h antes
const MIN_BEFORE_SLOT = 2 * HOUR     // y como mínimo 2 h antes (el enlace de cancelar caduca a la hora de la reserva)
const MIN_AFTER_CREATED = 6 * HOUR   // no pegado al email de confirmación

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

const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10)

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  try {
    let dryRun = false
    try { dryRun = (await req.json())?.dry_run === true } catch { /* sin body */ }

    const now = Date.now()
    // Solo reservas de ayer a pasado mañana (UTC): cubre cualquier zona horaria sin barrer toda la tabla.
    const query = new URLSearchParams({
      select: 'id,user_id,status,date,time,pax,customer_name,customer_email,deposit_amount,created_at,reminder_sent_at,venues(name,city,timezone)',
      status: 'eq.confirmed',
      reminder_sent_at: 'is.null',
      customer_email: 'not.is.null',
      limit: '500',
    })
    query.append('date', `gte.${ymd(now - 24 * HOUR)}`)
    query.append('date', `lte.${ymd(now + 48 * HOUR)}`)
    const res = await fetch(`${supabaseUrl}/rest/v1/reservations?${query}`, { headers: h })
    if (!res.ok) return json({ ok: false, error: 'query failed (¿aplicaste la migración 050?)', status: res.status, detail: await res.text() }, 500)
    const rows = await res.json()

    const report: { reservation_id: string; action: string }[] = []
    let sent = 0, skipped = 0

    for (const r of Array.isArray(rows) ? rows : []) {
      const venue = r?.venues
      // Defensa en profundidad: aunque la consulta ya filtra, nunca confiar solo en ella.
      if (!r || !venue || r.status !== 'confirmed' || r.reminder_sent_at || !r.customer_email || !r.date || !r.time) continue

      const isLondon = venue.city === 'London'
      const lang: 'es' | 'en' = isLondon ? 'en' : 'es'
      const tz = isLondon ? 'Europe/London' : (venue.timezone || 'Europe/Madrid')
      const [hh, mm] = String(r.time).split(':')
      const shownTime = `${hh.padStart(2, '0')}:${(mm || '00').slice(0, 2)}`

      const slot = zonedToUtcMs(r.date, shownTime, tz)
      const created = Date.parse(r.created_at)
      const untilSlot = slot - now
      const due = untilSlot <= REMIND_WITHIN && untilSlot >= MIN_BEFORE_SLOT && (now - created) >= MIN_AFTER_CREATED
      if (!due) { skipped++; continue }

      report.push({ reservation_id: r.id, action: 'remind' })
      if (dryRun) continue

      // Reclamar: solo una pasada puede enviar este recordatorio.
      const claim = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${r.id}&status=eq.confirmed&reminder_sent_at=is.null`, {
        method: 'PATCH', headers: { ...h, Prefer: 'return=representation' },
        body: JSON.stringify({ reminder_sent_at: new Date().toISOString() }),
      })
      const claimed = claim.ok ? await claim.json() : []
      if (!Array.isArray(claimed) || claimed.length === 0) continue

      // Enlace de cancelar (no bloqueante: sin él el recordatorio sale igual).
      let cancelUrl: string | null = null
      try {
        const ctRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_cancel_token`, {
          method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: r.id }),
        })
        const ct = await ctRes.json()
        if (ctRes.ok && typeof ct === 'string' && ct) {
          cancelUrl = `${isLondon ? 'https://app.unamesa.co.uk' : 'https://app.unamesa.co'}/?cancel_token=${ct}&lang=${lang}`
        } else console.warn('[reminders] cancel-token', ctRes.status)
      } catch (e) { console.warn('[reminders] cancel-token failed (non-fatal):', e) }

      const mail = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          to: r.customer_email, customer_name: r.customer_name || r.customer_email,
          restaurant_name: venue.name, date: dayLabel(r.date, lang), time: shownTime, pax: r.pax,
          deposit_amount: Number(r.deposit_amount) || 0,
          diner_reminder: true, show_view_booking: !!r.user_id, cancel_url: cancelUrl, lang,
        }),
      }).catch(() => null)

      if (mail && mail.ok) {
        sent++
      } else {
        console.warn('[reminders] email failed for', r.id, mail ? mail.status : 'network')
        // Liberar para reintentar en la siguiente pasada.
        await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${r.id}`, {
          method: 'PATCH', headers: h, body: JSON.stringify({ reminder_sent_at: null }),
        }).catch(() => null)
      }
    }

    return json({ ok: true, dry_run: dryRun, checked: Array.isArray(rows) ? rows.length : 0, sent, skipped, actions: report })
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : 'Internal server error' }, 500)
  }
})
