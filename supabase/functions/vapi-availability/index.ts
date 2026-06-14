const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const body = await req.json();
    const venue_id = body.venue_id || url.searchParams.get('venue_id');
    const { date, time, party_size } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const venueRes = await fetch(
      `${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}&select=name,times,capacity`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    );
    const venues = await venueRes.json();
    if (!venues.length) {
      return new Response(JSON.stringify({ available: false, message: 'Restaurante no encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const venue = venues[0];

    const resRes = await fetch(
      `${supabaseUrl}/rest/v1/reservations?venue_id=eq.${venue_id}&date=eq.${date}&time=eq.${time}&status=neq.cancelled&select=pax`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    );
    const existing = await resRes.json();
    const occupied = existing.reduce((sum: number, r: any) => sum + (r.pax || 0), 0);
    const capacity = venue.capacity || 50;
    const available = (capacity - occupied) >= party_size;

    const allTimes = [...(venue.times?.lunch || []), ...(venue.times?.dinner || [])]
      .map(([t]: [string, string]) => t);

    return new Response(JSON.stringify({
      result: available
        ? `Disponible. Hay disponibilidad para ${party_size} personas el ${date} a las ${time}.`
        : `No disponible. Los horarios disponibles son: ${allTimes.join(', ')}.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
