// DEPRECATED — esta función no verificaba en absoluto quién llamaba: cualquiera
// con la anon key podía reembolsar/cancelar el depósito de cualquier persona
// mandando solo un payment_intent_id. Tampoco actualizaba nunca la base de
// datos tras reembolsar. Reemplazada por cancel-reservation, que verifica
// dueño, aplica la política de 24h, y deja Stripe y la reserva consistentes.
// Se deja este stub en vez de borrar el archivo para que cualquier caller
// viejo reciba un error claro, no un 404 mudo.

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
