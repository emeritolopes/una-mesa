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
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    // Verificar firma
    const encoder = new TextEncoder();
    const parts = signature.split(',');
    const timestamp = parts.find((p: string) => p.startsWith('t='))?.split('=')[1] || '';
    const sigHash = parts.find((p: string) => p.startsWith('v1='))?.split('=')[1] || '';

    const signedPayload = `${timestamp}.${body}`;
    const keyData = encoder.encode(webhookSecret);
    const messageData = encoder.encode(signedPayload);

    const key = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, messageData);
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');

    if (expectedSig !== sigHash) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: corsHeaders });
    }

    const event = JSON.parse(body);

    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    }

    const session = event.data.object;
    const reservationId = session.metadata?.reservation_id;

    if (!reservationId) {
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Actualizar reserva a confirmed
    const updateRes = await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservationId}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'confirmed',
        payment_intent_id: session.payment_intent
      })
    });

    const updated = await updateRes.json();

    // Actualizar perfil cliente con email confirmado — non-fatal
    try {
      await fetch(`${supabaseUrl}/functions/v1/upsert-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({
          venue_id: reservation.venue_id,
          reservation_id: reservationId,
          customer_name: reservation.customer_name,
          customer_phone: reservation.customer_phone || null,
          customer_email: session.customer_details?.email || reservation.customer_email || null,
        })
      });
    } catch(e) {}

    // Enviar email de confirmación
    const reservation = Array.isArray(updated) ? updated[0] : updated;

    // Obtener menu_url del venue
    let menuUrl: string | null = null;
    if (reservation?.venue_id) {
      try {
        const venueRes = await fetch(
          `${supabaseUrl}/rest/v1/venues?id=eq.${reservation.venue_id}&select=name,menu_url`,
          { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
        );
        const venues = await venueRes.json();
        menuUrl = venues[0]?.menu_url || null;
      } catch(_) {}
    }

    if (reservation?.customer_email || session.customer_details?.email) {
      const email = reservation?.customer_email || session.customer_details?.email;

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`
        },
        body: JSON.stringify({
          to: email,
          customer_name: reservation?.customer_name || session.customer_details?.name || 'Cliente',
          restaurant_name: 'El Bodegón Central',
          date: reservation?.date || '',
          time: reservation?.time || '',
          pax: reservation?.pax || 1,
          deposit_amount: session.amount_total || 1000,
          menu_url: menuUrl
        })
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('[WEBHOOK] error:', err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
