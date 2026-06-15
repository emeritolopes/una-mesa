const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verificar firma de Stripe
    const crypto = await import('node:crypto');
    const parts = signature.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const sigHash = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    const payload = `${timestamp}.${body}`;
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

    if (expectedSig !== sigHash) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
    }

    const event = JSON.parse(body);

    // Solo procesar checkout.session.completed de Payment Links
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const reservationId = session.metadata?.reservation_id;

      if (!reservationId) {
        return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
      }

      // Obtener datos de la reserva
      const resRes = await fetch(
        `${supabaseUrl}/rest/v1/reservations?id=eq.${reservationId}&select=*,venues(name)`,
        { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
      );
      const reservations = await resRes.json();
      const reservation = reservations[0];

      if (!reservation) {
        return new Response(JSON.stringify({ error: 'Reservation not found' }), { status: 404, headers: corsHeaders });
      }

      // Actualizar status a confirmed
      await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservationId}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: 'confirmed', payment_intent_id: session.payment_intent })
      });

      // Enviar email de confirmación al cliente
      if (reservation.customer_email) {
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            to: reservation.customer_email,
            customer_name: reservation.customer_name,
            restaurant_name: reservation.venues?.name || 'El Bodegón Central',
            date: reservation.date,
            time: reservation.time,
            pax: reservation.pax,
            deposit_amount: reservation.deposit_amount || 1000
          })
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
