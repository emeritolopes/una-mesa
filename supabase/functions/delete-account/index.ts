const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // La identidad se deriva SIEMPRE del JWT de quien llama, nunca de un email
    // enviado en el body — de lo contrario cualquier usuario autenticado podría
    // borrar la cuenta de cualquier otra persona con solo conocer su email.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: corsHeaders });
    }

    const callerRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, Authorization: authHeader }
    });
    if (!callerRes.ok) {
      return new Response(JSON.stringify({ error: 'invalid session' }),
        { status: 401, headers: corsHeaders });
    }
    const caller = await callerRes.json();
    if (!caller?.id) {
      return new Response(JSON.stringify({ error: 'invalid session' }),
        { status: 401, headers: corsHeaders });
    }

    const userId = caller.id;
    const headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    };

    // 1. Anonimizar reservas (no eliminar — el restaurante las necesita)
    await fetch(`${supabaseUrl}/rest/v1/reservations?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        customer_name: 'Cliente eliminado',
        customer_phone: null,
        customer_email: null,
        user_id: null
      })
    });

    // 2. Eliminar perfil en customers
    await fetch(`${supabaseUrl}/rest/v1/customers?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers
    });

    // 3. Eliminar usuario de auth
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: corsHeaders });
  }
});
