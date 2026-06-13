const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { venue_id, date, time, party_size, customer_name, customer_phone, customer_email, special_requests } = await req.json();

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
    if (!res.ok) throw new Error(JSON.stringify(reservation));

    return new Response(JSON.stringify({
      success: true,
      reservation_id: reservation[0]?.id,
      message: `Reserva confirmada para ${customer_name}, ${party_size} personas el ${date} a las ${time}.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Error al crear la reserva'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
