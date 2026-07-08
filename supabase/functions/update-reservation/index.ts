// DEPRECATED — esta función no verificaba en absoluto quién llamaba: cualquiera
// con la anon key podía cancelar la reserva de cualquier persona mandando solo
// un reservation_id. Reemplazada por cancel-reservation, que sí verifica dueño
// (diner o restaurante), aplica la política de 24h, y resuelve Stripe de forma
// consistente con la base de datos. Se deja este stub en vez de borrar el
// archivo para que cualquier caller viejo reciba un error claro, no un 404 mudo.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  return new Response(
    JSON.stringify({ error: 'deprecated — use cancel-reservation instead' }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
