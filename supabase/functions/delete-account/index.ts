const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido' }),
        { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    };

    // Buscar usuario por email
    const usersRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers }
    );
    const usersData = await usersRes.json();
    const user = usersData.users?.[0];

    if (!user?.id) {
      return new Response(JSON.stringify({ success: true, local_only: true }),
        { headers: corsHeaders });
    }

    const userId = user.id;

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
