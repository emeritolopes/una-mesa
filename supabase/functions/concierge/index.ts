import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const tools = [
  {
    name: 'start_reservation',
    description: 'Inicia el proceso de reserva cuando el usuario quiere reservar una mesa. Úsalo cuando el usuario confirme que quiere reservar en un restaurante específico con fecha, hora y número de personas.',
    input_schema: {
      type: 'object',
      properties: {
        restaurant_name: { type: 'string', description: 'Nombre exacto del restaurante' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        time: { type: 'string', description: 'Hora en formato HH:MM' },
        party_size: { type: 'number', description: 'Número de personas' },
      },
      required: ['restaurant_name', 'date', 'time', 'party_size'],
    },
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { message, history, restaurants, customer_name, customer_email } = await req.json()

    const restaurantList = (restaurants || [])
      .map((r: { name: string; cuisine: string; area: string; price: string }) =>
        `${r.name} (${r.cuisine || ''}, ${r.area || ''}, ${r.price || ''})`)
      .join(', ')

    const today = new Date().toLocaleDateString('es-ES', {
      timeZone: 'Europe/Madrid',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })

    const systemPrompt =
      `Eres el conserje digital de Una Mesa, una plataforma premium de reservas de restaurantes en España. ` +
      `Tu objetivo es ayudar a los usuarios a encontrar el restaurante perfecto según sus preferencias. ` +
      `Tienes acceso a estos restaurantes: ${restaurantList}. ` +
      `Hoy es ${today} (${todayISO}). Cuando el usuario diga "mañana", "este fin de semana" u otras referencias relativas, calcula la fecha correcta automáticamente sin pedírsela. ` +
      `Responde siempre en español, de forma elegante y concisa. ` +
      `Sugiere restaurantes específicos cuando sea relevante. ` +
      `Cuando el usuario quiera reservar con datos concretos (restaurante, fecha, hora, personas), usa la herramienta start_reservation.`

    type AnthropicRole = 'user' | 'assistant'
    const messages: Array<{ role: AnthropicRole; content: string }> = []
    for (const h of (history || [])) {
      if (h.who === 'me' && h.text) {
        messages.push({ role: 'user', content: h.text })
      } else if (h.who === 'ai' && h.text) {
        messages.push({ role: 'assistant', content: h.text })
      }
    }
    messages.push({ role: 'user', content: message })

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: tools as Parameters<typeof anthropic.messages.create>[0]['tools'],
    })

    let textContent = ''
    let reservationAction = null

    for (const block of response.content) {
      if (block.type === 'text') {
        textContent = block.text
      } else if (block.type === 'tool_use' && block.name === 'start_reservation') {
        const input = block.input as {
          restaurant_name: string
          date: string
          time: string
          party_size: number
        }
        reservationAction = input
        textContent =
          `Perfecto, voy a preparar tu reserva en ${input.restaurant_name} para ` +
          `${input.party_size} personas el ${input.date} a las ${input.time}. Un momento...`
      }
    }

    if (!textContent) textContent = 'Lo siento, no pude procesar tu mensaje. ¿Puedes intentarlo de nuevo?'

    return new Response(JSON.stringify({ text: textContent, action: reservationAction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
