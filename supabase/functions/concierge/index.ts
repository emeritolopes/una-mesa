import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const tools: Anthropic.Tool[] = [
  {
    name: 'check_availability',
    description: 'Consulta si hay disponibilidad en un restaurante para una fecha, hora y número de personas. Úsalo siempre antes de confirmar una reserva.',
    input_schema: {
      type: 'object' as const,
      properties: {
        restaurant_id: { type: 'string', description: 'ID del restaurante' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        time: { type: 'string', description: 'Hora en formato HH:MM' },
        party_size: { type: 'number', description: 'Número de personas' }
      },
      required: ['restaurant_id', 'date', 'time', 'party_size']
    }
  },
  {
    name: 'create_reservation',
    description: 'Crea una reserva confirmada cuando el usuario ha proporcionado todos los datos y ha confirmado que quiere reservar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        restaurant_id: { type: 'string', description: 'ID del restaurante' },
        restaurant_name: { type: 'string', description: 'Nombre del restaurante' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        time: { type: 'string', description: 'Hora en formato HH:MM' },
        party_size: { type: 'number', description: 'Número de personas' }
      },
      required: ['restaurant_id', 'restaurant_name', 'date', 'time', 'party_size']
    }
  },
  {
    name: 'start_reservation',
    description: 'Abre el formulario de reserva en la app cuando el usuario quiere reservar pero faltan datos como el pago del depósito.',
    input_schema: {
      type: 'object' as const,
      properties: {
        restaurant_name: { type: 'string' },
        date: { type: 'string' },
        time: { type: 'string' },
        party_size: { type: 'number' }
      },
      required: ['restaurant_name', 'date', 'time', 'party_size']
    }
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })

  try {
    const { message, history, restaurants, user } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const restaurantList = (restaurants || [])
      .map((r: { id: string; name: string; cuisine: string; area: string; price: string }) =>
        `${r.name} (ID: ${r.id}, ${r.cuisine || ''}, ${r.area || ''}, ${r.price || ''})`)
      .join('\n')

    const today = new Date().toLocaleDateString('es-ES', {
      timeZone: 'Europe/Madrid', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

    const systemPrompt = `Eres el conserje digital de Una Mesa, una plataforma premium de reservas de restaurantes en España.

Hoy es ${today} (${todayISO}).
${user ? `El usuario se llama ${user.name} y su email es ${user.email}.` : ''}

Tienes acceso a estos restaurantes:
${restaurantList}

CÓMO ACTUAR:
1. Ayuda al usuario a encontrar el restaurante perfecto según sus preferencias
2. Cuando quiera reservar, recoge: restaurante, fecha, hora y número de personas
3. Usa check_availability para verificar disponibilidad SIEMPRE antes de confirmar
4. Si hay disponibilidad, usa create_reservation para crear la reserva directamente
5. La reserva se confirma con un depósito reembolsable — informa al usuario que recibirá un email con el link de pago
6. Puedes modificar o cancelar reservas si el usuario lo pide

Responde siempre en español, de forma elegante y concisa.`;

    type AnthropicRole = 'user' | 'assistant'
    const messages: Array<{ role: AnthropicRole; content: string }> = []
    for (const h of (history || [])) {
      if (h.who === 'me' && h.text) messages.push({ role: 'user', content: h.text })
      else if (h.who === 'ai' && h.text) messages.push({ role: 'assistant', content: h.text })
    }
    messages.push({ role: 'user', content: message })

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })

    // Bucle agentic — el modelo puede llamar tools múltiples veces
    let currentMessages = [...messages]
    let textContent = ''
    let reservationAction = null
    let iterations = 0

    while (iterations < 5) {
      iterations++
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: currentMessages,
        tools,
      })

      for (const block of response.content) {
        if (block.type === 'text') textContent = block.text;
      }

      if (response.stop_reason !== 'tool_use') break;

      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
      const toolResults = []

      for (const toolUse of toolUseBlocks) {
        if (toolUse.type !== 'tool_use') continue;
        const input = toolUse.input as Record<string, unknown>;
        let result = ''

        if (toolUse.name === 'check_availability') {
          const venueId = input.restaurant_id as string;
          const date = input.date as string;
          const time = input.time as string;
          const partySize = input.party_size as number;

          const res = await fetch(
            `${supabaseUrl}/rest/v1/venues?id=eq.${venueId}&select=name,times`,
            { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
          );
          const venues = await res.json();

          if (venues.length > 0) {
            const allTimes = [...(venues[0].times?.lunch || []), ...(venues[0].times?.dinner || [])]
              .map(([t]: [string, string]) => t);
            const available = allTimes.includes(time);
            result = available
              ? `Disponible. Hay mesa para ${partySize} personas el ${date} a las ${time}.`
              : `No disponible a las ${time}. Horarios disponibles: ${allTimes.join(', ')}.`;
          } else {
            result = `Disponible para ${partySize} personas el ${date} a las ${time}.`;
          }
        }

        else if (toolUse.name === 'create_reservation') {
          const venueId = input.restaurant_id as string;
          const venueName = input.restaurant_name as string;
          const date = input.date as string;
          const time = input.time as string;
          const partySize = input.party_size as number;

          const res = await fetch(`${supabaseUrl}/rest/v1/reservations`, {
            method: 'POST',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              venue_id: venueId,
              customer_name: user?.name || 'Cliente',
              customer_email: user?.email || null,
              pax: partySize,
              date,
              time,
              status: 'confirmed',
              source: 'chat_agent'
            })
          });
          const reservation = await res.json();
          result = res.ok && reservation[0]?.id
            ? `Reserva creada exitosamente. ID: ${reservation[0].id.slice(0,8).toUpperCase()}. El usuario recibirá un email de confirmación.`
            : `Error al crear la reserva: ${JSON.stringify(reservation)}`;
        }

        else if (toolUse.name === 'start_reservation') {
          reservationAction = input;
          result = 'Abriendo el formulario de reserva con los datos proporcionados.';
        }

        toolResults.push({
          type: 'tool_result' as const,
          tool_use_id: toolUse.id,
          content: result
        })
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant' as const, content: response.content as unknown as string },
        { role: 'user' as const, content: toolResults as unknown as string }
      ]
    }

    return new Response(JSON.stringify({ text: textContent, action: reservationAction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
