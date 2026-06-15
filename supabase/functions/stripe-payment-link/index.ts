const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { reservation_id, customer_name, restaurant_name, date, time, party_size, deposit_amount_cents } = await req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

    const priceRes = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'currency': 'eur',
        'unit_amount': String(deposit_amount_cents),
        'product_data[name]': `Depósito reserva — ${restaurant_name} · ${customer_name} · ${party_size} personas · ${date} a las ${time}`,
      })
    });

    const price = await priceRes.json();
    if (!priceRes.ok) throw new Error(price.error?.message || 'Error creating price');

    const linkRes = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'line_items[0][price]': price.id,
        'line_items[0][quantity]': '1',
        'metadata[reservation_id]': reservation_id,
        'after_completion[type]': 'redirect',
        'after_completion[redirect][url]': `https://app.unamesa.co/#profile`,
      })
    });

    const link = await linkRes.json();
    if (!linkRes.ok) throw new Error(link.error?.message || 'Error creating payment link');

    return new Response(JSON.stringify({
      url: link.url,
      payment_link_id: link.id
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
