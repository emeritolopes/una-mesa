const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const bodyText = await req.text();
    console.log('[VAPI-RES] body:', bodyText);
    console.log('[VAPI-RES] venue_id from URL:', url.searchParams.get('venue_id'));
    const body = JSON.parse(bodyText || '{}');

    let params = body;
    if (body.message?.toolCallList?.[0]?.function?.arguments) {
      params = body.message.toolCallList[0].function.arguments;
    } else if (body.message?.toolCalls?.[0]?.function?.arguments) {
      const args = body.message.toolCalls[0].function.arguments;
      params = typeof args === 'string' ? JSON.parse(args) : args;
    }

    const { venue_id: bodyVenueId, date, time, party_size, customer_name, customer_phone, customer_email, special_requests } = params;
    const venue_id = bodyVenueId || url.searchParams.get('venue_id');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const res = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        venue_id,
        date,
        time,
        pax: party_size,
        customer_name,
        customer_phone: customer_phone || null,
        notes: special_requests || null,
        status: 'confirmed',
        source: 'phone_agent'
      })
    });

    const reservation = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({
        result: `Error al crear la reserva: ${JSON.stringify(reservation)}`
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!reservation[0]?.id) {
      return new Response(JSON.stringify({
        result: `Error: la reserva no se creó correctamente. Respuesta: ${JSON.stringify(reservation)}`
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generar Payment Link y enviar email — non-fatal
    if (customer_email) {
      try {
        // Obtener deposit_amount del venue
        const venueRes = await fetch(
          `${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}&select=name,deposit_amount`,
          { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
        );
        const venues = await venueRes.json();
        const depositCents = venues[0]?.deposit_amount || 1000;
        const venueName = venues[0]?.name || 'El Bodegón Central';
        const totalDeposit = depositCents * party_size;

        // Crear Payment Link
        const plRes = await fetch(`${supabaseUrl}/functions/v1/stripe-payment-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            reservation_id: reservation[0].id,
            customer_name,
            restaurant_name: venueName,
            date,
            time,
            party_size,
            deposit_amount_cents: totalDeposit
          })
        });
        const pl = await plRes.json();

        // Enviar email con Payment Link
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
          body: JSON.stringify({
            to: customer_email,
            customer_name,
            restaurant_name: venueName,
            date,
            time,
            pax: party_size,
            deposit_amount: totalDeposit,
            payment_link: pl.url || null
          })
        });
      } catch(e) {
        console.warn('payment link error:', e);
      }
    }

    return new Response(JSON.stringify({
      result: `Reserva confirmada exitosamente para ${customer_name}, ${party_size} personas el ${date} a las ${time}. ID: ${reservation[0]?.id?.slice(0,8).toUpperCase()}.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear la reserva'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
