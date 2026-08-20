const baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')
const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }
  if (!process.env.OPENROUTER_API_KEY) return response.status(503).json({ error: 'OPENROUTER_API_KEY is not configured on the server.' })

  const { messages, temperature = 0.2, maxTokens = 600 } = request.body || {}
  if (!Array.isArray(messages)) return response.status(400).json({ error: 'Messages are required.' })

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_HTTP_REFERER ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER } : {}),
        ...(process.env.OPENROUTER_X_TITLE ? { 'X-Title': process.env.OPENROUTER_X_TITLE } : {}),
      },
      body: JSON.stringify({ model, messages, temperature: typeof temperature === 'number' ? temperature : 0.2, max_tokens: typeof maxTokens === 'number' ? maxTokens : 600 }),
    })
    const payload = await upstream.json()
    if (!upstream.ok) return response.status(upstream.status).json({ error: payload.error?.message || 'OpenRouter request failed.' })
    return response.status(200).json({ content: payload.choices?.[0]?.message?.content || '' })
  } catch {
    return response.status(502).json({ error: 'Unable to reach OpenRouter.' })
  }
}
