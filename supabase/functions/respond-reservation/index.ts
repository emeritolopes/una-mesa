// supabase/functions/respond-reservation/index.ts
//
// El restaurante confirma o rechaza una reserva 'pending' (venues con
// manual_confirmation = true, ver create-reservation y migración 044).
//
// Igual que mark-noshow: API JSON pura. La pantalla vive en backofhouse
// (?respond_token=…&action=confirm|decline) y llama aquí por fetch().
// El email NO ejecuta nada por sí solo: abrir el enlace solo muestra la
// pantalla; hace falta un clic real en ella (execute: true). Así un
// escáner de correo que abra el enlace no confirma ni rechaza nada.
//
// POST { token, action: 'confirm' | 'decline', execute?: boolean }
//   execute ausente/false → solo valida el token y devuelve los datos.
//   execute: true → PATCH atómico (solo si sigue 'pending'), marca el token
//     como usado y avisa al comensal por email (no bloqueante).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  const out = (body: unknown, status = 200) => new Response(JSON.stringify(body), { headers: jsonHeaders, status })

  let token: string | undefined
  let action: 'confirm' | 'decline' | null = null
  let execute = false
  try {
    const body = await req.json()
    token = body.token
    action = body.action === 'confirm' ? 'confirm' : body.action === 'decline' ? 'decline' : null
    execute = body.execute === true
  } catch (_) {
    return out({ ok: false, code: 'invalid' }, 400)
  }

  if (!token || !UUID.test(token)) return out({ ok: false, code: 'invalid' }, 400)
  if (execute && !action) return out({ ok: false, code: 'invalid', error: 'action required' }, 400)

  // 1. Token válido, no usado, no expirado
  const tRes = await fetch(`${supabaseUrl}/rest/v1/reservation_response_tokens?token=eq.${token}&select=token,reservation_id,used_at,expires_at`, { headers: h })
  const tk = (await tRes.json())?.[0]
  if (!tk) return out({ ok: false, code: 'invalid' }, 404)
  if (tk.used_at) return out({ ok: false, code: 'used' }, 409)
  if (new Date(tk.expires_at) < new Date()) return out({ ok: false, code: 'expired' }, 410)

  // 2. Datos de la reserva
  const rRes = await fetch(
    `${supabaseUrl}/rest/v1/reservations?id=eq.${tk.reservation_id}&select=id,customer_name,customer_email,date,time,pax,status,venues(name,city)`,
    { headers: h },
  )
  const reservation = (await rRes.json())?.[0]
  if (!reservation) return out({ ok: false, code: 'invalid' }, 404)

  const details = {
    customer_name: reservation.customer_name,
    restaurant_name: reservation.venues?.name,
    date: reservation.date,
    time: reservation.time,
    pax: reservation.pax,
  }

  if (reservation.status !== 'pending') {
    return out({ ok: false, code: 'already_resolved', resolved_status: reservation.status, ...details }, 409)
  }

  if (!execute) return out({ ok: true, code: 'valid', ...details })

  // 3. Acción — PATCH atómico: solo si sigue 'pending' (evita pisar una
  //    cancelación del comensal o un doble clic).
  const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled'
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservation.id}&status=eq.pending`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=representation' }, body: JSON.stringify({ status: newStatus }),
  })
  const patched = await patchRes.json().catch(() => [])
  if (!patchRes.ok || !Array.isArray(patched) || patched.length === 0) {
    return out({ ok: false, code: 'already_resolved', ...details }, 409)
  }

  await fetch(`${supabaseUrl}/rest/v1/reservation_response_tokens?token=eq.${token}`, {
    method: 'PATCH', headers: h, body: JSON.stringify({ used_at: new Date().toISOString() }),
  }).catch(() => {})

  // 4. Avisar al comensal — no bloqueante: la decisión ya está tomada.
  if (reservation.customer_email) {
    try {
      // Idioma del email al comensal: por la ciudad del restaurante (Londres → inglés),
      // igual que expire-pending-reservations. No depende del navegador de quien responde.
      const lang: 'es' | 'en' = reservation.venues?.city === 'London' ? 'en' : 'es'
      const label = new Date(reservation.date + 'T00:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
        timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
      })
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST', headers: h,
        body: JSON.stringify({
          to: reservation.customer_email,
          customer_name: reservation.customer_name || reservation.customer_email,
          restaurant_name: details.restaurant_name || 'Una Mesa',
          date: label,
          time: String(reservation.time || '').slice(0, 5),
          pax: reservation.pax,
          response_status: action === 'confirm' ? 'confirmed' : 'declined',
          lang,
        }),
      })
    } catch (e) { console.warn('[respond-reservation] email al comensal falló:', e instanceof Error ? e.message : e) }
  }

  return out({ ok: true, code: 'success', action, status: newStatus, ...details })
})
