const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { venue_id, reservation_id, customer_name, customer_phone, customer_email, allergies, notes } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

    // Buscar cliente existente por email o teléfono
    let customerId = null;
    const lookup = customer_email || customer_phone;
    const field = customer_email ? 'email' : 'phone';

    if (lookup) {
      // Fecha de "hoy" en la hora local del venue (nunca UTC — ver CLAUDE.md).
      let tz = 'Europe/Madrid';
      try {
        const venueRes = await fetch(
          `${supabaseUrl}/rest/v1/venues?id=eq.${venue_id}&select=city,timezone`,
          { headers }
        );
        const [venue] = await venueRes.json();
        tz = venue?.city === 'London' ? 'Europe/London' : (venue?.timezone || 'Europe/Madrid');
      } catch { /* mantiene el fallback de Madrid */ }
      const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: tz });

      const findRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?${field}=eq.${encodeURIComponent(lookup)}&venue_id=eq.${venue_id}&select=id,visits`,
        { headers }
      );
      const found = await findRes.json();

      if (found.length > 0) {
        // Cliente existente — actualizar visitas y última visita
        customerId = found[0].id;
        await fetch(`${supabaseUrl}/rest/v1/customers?id=eq.${customerId}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            visits: (found[0].visits || 0) + 1,
            last_visit: todayLocal,
            name: customer_name,
            phone: customer_phone || undefined,
            email: customer_email || undefined,
          })
        });
      } else {
        // Cliente nuevo — crear
        const createRes = await fetch(`${supabaseUrl}/rest/v1/customers`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify({
            venue_id,
            name: customer_name,
            phone: customer_phone || null,
            email: customer_email || null,
            allergies: allergies || [],
            notes: notes || null,
            visits: 1,
            last_visit: todayLocal,
            vip: false
          })
        });
        const created = await createRes.json();
        customerId = created[0]?.id;
      }
    }

    // Enlazar customer_id a la reserva
    if (customerId && reservation_id) {
      await fetch(`${supabaseUrl}/rest/v1/reservations?id=eq.${reservation_id}`, {
        method: 'PATCH',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ customer_id: customerId })
      });
    }

    return new Response(JSON.stringify({ customer_id: customerId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
