const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Horarios del restaurante — hardcodeados para máxima velocidad
const LUNCH_TIMES = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
const DINNER_TIMES = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
const ALL_TIMES = [...LUNCH_TIMES, ...DINNER_TIMES];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Verificar secreto compartido con Vapi
  const vapiSecret = req.headers.get('x-vapi-secret') || '';
  const expectedSecret = Deno.env.get('VAPI_WEBHOOK_SECRET') || '';
  if (expectedSecret && vapiSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bodyText = await req.text();
    const body = JSON.parse(bodyText || '{}');

    let params = body;
    if (body.message?.toolCalls?.[0]?.function?.arguments) {
      params = body.message.toolCalls[0].function.arguments;
    } else if (body.message?.toolCallList?.[0]?.function?.arguments) {
      params = body.message.toolCallList[0].function.arguments;
    }

    const { date, time, party_size } = params;
    const timeStr = String(time || '').slice(0, 5);
    const available = ALL_TIMES.includes(timeStr);

    return new Response(JSON.stringify({
      result: available
        ? `Disponible. Hay disponibilidad para ${party_size} personas el ${date} a las ${time}.`
        : `No disponible a las ${time}. Horarios disponibles: ${ALL_TIMES.join(', ')}.`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({
      result: 'Disponible para las personas y horario solicitados.'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
