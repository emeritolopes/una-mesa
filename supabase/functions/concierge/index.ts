import Anthropic from 'https://esm.sh/@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
    const { message, history, restaurants } = await req.json()

    const restaurantList = (restaurants || [])
      .map((r: { name: string; cuisine: string; area: string; price: string }) =>
        `${r.name} (${r.cuisine || ''}, ${r.area || ''}, ${r.price || ''})`)
      .join(', ')

    const systemPrompt =
      `Eres el conserje digital de Una Mesa, una plataforma premium de reservas de restaurantes en España. ` +
      `Tu objetivo es ayudar a los usuarios a encontrar el restaurante perfecto según sus preferencias. ` +
      `Tienes acceso a estos restaurantes: ${restaurantList}. ` +
      `Responde siempre en español, de forma elegante y concisa. ` +
      `Sugiere restaurantes específicos cuando sea relevante.`

    // Build messages: interleave history then add current user message
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

    const stream = anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    const body = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
