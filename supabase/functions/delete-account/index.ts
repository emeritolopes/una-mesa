import Stripe from 'https://esm.sh/stripe@14?target=deno'

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
    // Solo se tratan como "suyos" los datos ligados a su email si el email está
    // verificado; si no, alguien podría registrarse con el email de otra persona
    // y borrar sus reservas de invitado.
    const email: string | null = caller.email && caller.email_confirmed_at ? String(caller.email).toLowerCase() : null;
    // ilike trata "_" y "%" como comodines: se escapan para que el filtro por email
    // no pueda coincidir con el email de otra persona. Si trae "*" o "%" no se usa.
    const emailFilter: string | null = email && !/[*%]/.test(email)
      ? encodeURIComponent(email.replace(/_/g, '\\_'))
      : null;
    const headers = {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    };

    // 0. Reunir las reservas del usuario (por cuenta y, si el email está verificado,
    //    las hechas como invitado con ese email) antes de anonimizarlas.
    const sel = 'id,payment_intent_id,customer_phone,venues(stripe_connect_account_id,stripe_mode)';
    const byUser = await fetch(`${supabaseUrl}/rest/v1/reservations?user_id=eq.${userId}&select=${sel}`, { headers });
    const byEmail = emailFilter
      ? await fetch(`${supabaseUrl}/rest/v1/reservations?customer_email=ilike.${emailFilter}&select=${sel}`, { headers })
      : null;
    const rows: Array<{ id: string; payment_intent_id: string | null; customer_phone: string | null; venues: { stripe_connect_account_id: string | null; stripe_mode: string | null } | null }> = [];
    const seen = new Set<string>();
    for (const r of [byUser, byEmail]) {
      if (!r || !r.ok) continue;
      for (const row of await r.json()) if (!seen.has(row.id)) { seen.add(row.id); rows.push(row); }
    }

    // 1. Quitar nombre/teléfono/email de la metadata de Stripe (la copia que vive
    //    en la cuenta Connect del restaurante). Best-effort: si falla uno, se sigue.
    let stripeFailures = 0;
    for (const row of rows) {
      const acct = row.venues?.stripe_connect_account_id;
      if (!row.payment_intent_id || !acct) continue;
      const key = row.venues?.stripe_mode === 'live'
        ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
        : Deno.env.get('STRIPE_SECRET_KEY_TEST');
      if (!key) { stripeFailures++; continue; }
      try {
        const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
        await stripe.paymentIntents.update(
          row.payment_intent_id,
          { metadata: { customer_name: '', customer_phone: '', customer_email: '', user_id: '' } },
          { stripeAccount: acct }
        );
      } catch (e) {
        stripeFailures++;
        console.warn('[delete-account] stripe metadata scrub failed:', row.id, e instanceof Error ? e.message : e);
      }
    }

    // 2. Anonimizar reservas (no eliminar — el restaurante las necesita). Incluye
    //    las notas libres, que pueden contener alergias u otros datos de salud.
    const anon = JSON.stringify({
      customer_name: 'Guest (deleted)',
      customer_phone: null,
      customer_email: null,
      notes: null,
      user_id: null
    });
    await fetch(`${supabaseUrl}/rest/v1/reservations?user_id=eq.${userId}`, {
      method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: anon
    });
    if (emailFilter) {
      await fetch(`${supabaseUrl}/rest/v1/reservations?customer_email=ilike.${emailFilter}`, {
        method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: anon
      });
    }

    // 3. Eliminar perfiles en customers (uno por restaurante). Se buscan por email y
    //    por los teléfonos usados — también los creados como invitado, que nunca
    //    tuvieron user_id. El borrado por user_id se mantiene por si la columna existe.
    const del = async (filter: string) => {
      await fetch(`${supabaseUrl}/rest/v1/customers?${filter}`, { method: 'DELETE', headers });
    };
    await del(`user_id=eq.${userId}`);
    if (emailFilter) await del(`email=ilike.${emailFilter}`);
    const phones = [...new Set(rows.map(r => r.customer_phone).filter((p): p is string => !!p))];
    for (const ph of phones) await del(`phone=eq.${encodeURIComponent(ph)}`);

    // 4. Eliminar usuario de auth
    const authDel = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers
    });
    if (!authDel.ok) {
      return new Response(JSON.stringify({ error: 'auth user deletion failed', stripe_failures: stripeFailures }),
        { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, stripe_failures: stripeFailures }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: corsHeaders });
  }
});
