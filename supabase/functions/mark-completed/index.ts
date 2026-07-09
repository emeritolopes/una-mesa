import Stripe from 'https://esm.sh/stripe@14?target=deno'

/* ════ UNA MESA · mark-completed ════
   El restaurante marca una reserva como "el comensal sí llegó" (completed)
   o "no se presentó" (no_show) — desde su propio panel, con su sesión real,
   en vez de una actualización directa a la tabla sin pasar por Stripe.

   Generalizada para los dos casos porque la acción de Stripe es idéntica:
   capturar el depósito. Solo cambia la etiqueta que queda registrada. Antes
   de esto, backofhouse tenía sus propios botones que hacían un
   `reservations.update({status:...})` directo desde el cliente — cambiaban
   la etiqueta pero nunca tocaban Stripe, y como reservations_due_capture
   excluye status='no_show' (asume que ya se capturó), esas reservas se
   quedaban con el depósito retenido para siempre, sin que auto-capture las
   recogiera nunca.

   En los dos casos el dinero pasa de "retenido" a "cobrado" — la diferencia
   es solo el `status` que queda registrado. El restaurante aplica el
   descuento en su propio sistema de caja al cobrar la cuenta final; esta
   función no decide eso, solo mueve el dinero retenido a cobrado y dice por qué.

   Requiere autenticación real: solo el restaurante dueño del venue de esta
   reserva puede marcarla — mismo patrón de verificación que
   cancel-reservation.
*/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const h = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-06-20' })

  try {
    // 1 · Identidad real del que llama
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders })

    const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: authHeader } })
    const caller = await callerRes.json()
    if (!caller?.id) return new Response(JSON.stringify({ error: 'invalid session' }), { status: 401, headers: corsHeaders })

    const { reservation_id, status: requestedStatus } = await req.json()
    if (!reservation_id) return new Response(JSON.stringify({ error: 'reservation_id required' }), { status: 400, headers: corsHeaders })
    const targetStatus = requestedStatus === 'no_show' ? 'no_show' : 'completed'

    // 2 · Traer la reserva
    const resRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservation_id}&select=*`, { headers: h })
    const reservation = (await resRes.json())?.[0]
    if (!reservation) return new Response(JSON.stringify({ error: 'reservation not found' }), { status: 404, headers: corsHeaders })

    if (reservation.status === 'cancelled' || reservation.status === 'no_show' || reservation.status === 'completed') {
      return new Response(JSON.stringify({ error: `reservation already ${reservation.status}` }), { status: 409, headers: corsHeaders })
    }

    // 3 · Verificar que quien llama es del restaurante dueño de esta reserva
    const ruRes = await fetch(`${supabaseUrl}/rest/v1/restaurant_users?user_id=eq.${caller.id}&select=venue_id`, { headers: h })
    const ru = await ruRes.json()
    const isOwnerRestaurant = ru?.[0]?.venue_id === reservation.venue_id
    if (!isOwnerRestaurant) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders })
    }

    // 4 · Capturar el depósito — mismo lock atómico que mark-noshow / auto-capture / cancel-reservation
    let depositStatus: string | null = reservation.deposit_status
    if (reservation.payment_intent_id) {
      const lockRes = await fetch(`${supabaseUrl}/rest/v1/rpc/try_lock_deposit_capture`, {
        method: 'POST', headers: h, body: JSON.stringify({ p_reservation_id: reservation_id }),
      })
      const locked = await lockRes.json()
      if (locked) {
        try {
          await stripe.paymentIntents.capture(reservation.payment_intent_id)
          depositStatus = 'captured'
        } catch (err) {
          depositStatus = 'capture_failed'
          console.warn('[mark-completed] Stripe:', err instanceof Error ? err.message : err)
        }
      }
      // Si no se pudo tomar el lock, algo más ya lo estaba procesando —
      // igual marcamos la reserva como completada, no tocamos deposit_status.
    }

    // 5 · Actualizar la reserva
    await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservation_id}`, {
      method: 'PATCH', headers: h,
      body: JSON.stringify({ status: targetStatus, deposit_status: depositStatus }),
    })

    return new Response(JSON.stringify({ success: true, status: targetStatus, deposit_status: depositStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders })
  }
})
