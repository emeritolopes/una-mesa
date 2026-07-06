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
    name: 'start_reservation',
    description: 'Abre el formulario de reserva en la app cuando el usuario quiere reservar. Úsalo SIEMPRE que el usuario quiera confirmar una reserva — el formulario recoge el pago del depósito, que es obligatorio para toda reserva. Nunca confirmes una reserva sin pasar por aquí.',
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
    const { message, history, restaurants, user, lang: langRaw } = await req.json()
    const lang: 'es' | 'en' = langRaw === 'en' ? 'en' : 'es'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Extraer email del JWT si el usuario está autenticado — no confiar únicamente en el body
    let jwtEmail: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        jwtEmail = payload.email || null;
      } catch (_) { /* JWT malformado o anon token — ignorar */ }
    }
    const trustedEmail = jwtEmail ?? user?.email ?? null;

    // Cap de contexto para controlar coste por llamada
    const cappedHistory = (history || []).slice(-10);
    const cappedRestaurants = (restaurants || []).slice(0, 20);

    const restaurantList = cappedRestaurants
      .map((r: { id: string; name: string; cuisine: string; area: string; price: string }) =>
        `${r.name} (ID: ${r.id}, ${r.cuisine || ''}, ${r.area || ''}, ${r.price || ''})`)
      .join('\n')

    const today = new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', {
      timeZone: 'Europe/Madrid', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });

    const systemPrompt = lang === 'en' ? `You are the digital concierge for Una Mesa, a premium restaurant booking platform in the UK.

Today is ${today} (${todayISO}).
${user?.name ? `The user's name is ${user.name}${trustedEmail ? ` and their email is ${trustedEmail}` : ''}.` : ''}

You have access to these restaurants:
${restaurantList}

HOW TO ACT:
1. Help the user find the perfect restaurant based on their preferences
2. When they want to book, collect: restaurant, date, time, and party size
3. Use check_availability to verify availability ALWAYS before proceeding
4. If available, use start_reservation to hand off to the app's booking form — this is the ONLY way to book. Never tell the user their booking is confirmed yourself; the deposit payment in that form is what actually confirms it.
5. Explain that a refundable deposit is required to secure the table, and that the booking form will guide them through it
6. You can help the user understand or plan changes to an existing booking, but cancellations and modifications happen in the app's own booking screen, not through you

Always respond in English, elegantly and concisely.` : `Eres el conserje digital de Una Mesa, una plataforma premium de reservas de restaurantes en España.

Hoy es ${today} (${todayISO}).
${user?.name ? `El usuario se llama ${user.name}${trustedEmail ? ` y su email es ${trustedEmail}` : ''}.` : ''}

Tienes acceso a estos restaurantes:
${restaurantList}

CÓMO ACTUAR:
1. Ayuda al usuario a encontrar el restaurante perfecto según sus preferencias
2. Cuando quiera reservar, recoge: restaurante, fecha, hora y número de personas
3. Usa check_availability para verificar disponibilidad SIEMPRE antes de continuar
4. Si hay disponibilidad, usa start_reservation para pasar el testigo al formulario de reserva de la app — es la ÚNICA forma de reservar. Nunca le digas al usuario que su reserva está confirmada tú mismo; el pago del depósito en ese formulario es lo que realmente la confirma.
5. Explica que hace falta un depósito reembolsable para asegurar la mesa, y que el formulario le va a guiar por ese paso
6. Puedes ayudar al usuario a entender o planear cambios sobre una reserva existente, pero las cancelaciones y modificaciones se hacen en la pantalla de reservas de la app, no a través de ti

Responde siempre en español, de forma elegante y concisa.`;

    type AnthropicRole = 'user' | 'assistant'
    const messages: Array<{ role: AnthropicRole; content: string }> = []
    for (const h of cappedHistory) {
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

    while (iterations < 3) {
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
            result = lang === 'en'
              ? (available
                  ? `Available. There's a table for ${partySize} people on ${date} at ${time}.`
                  : `Not available at ${time}. Available times: ${allTimes.join(', ')}.`)
              : (available
                  ? `Disponible. Hay mesa para ${partySize} personas el ${date} a las ${time}.`
                  : `No disponible a las ${time}. Horarios disponibles: ${allTimes.join(', ')}.`);
          } else {
            result = lang === 'en'
              ? `Available for ${partySize} people on ${date} at ${time}.`
              : `Disponible para ${partySize} personas el ${date} a las ${time}.`;
          }
        }

        else if (toolUse.name === 'start_reservation') {
          reservationAction = input;
          result = lang === 'en'
            ? 'Opening the booking form with the provided details.'
            : 'Abriendo el formulario de reserva con los datos proporcionados.';
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
