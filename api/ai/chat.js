const baseUrl = (process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '')
const model = process.env.GAPGPT_MODEL || 'gapgpt-qwen-3.5'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed.' })
  }
  if (!process.env.GAPGPT_API_KEY) return response.status(503).json({ error: 'GAPGPT_API_KEY is not configured on the server.' })

  const { messages, temperature = 0.2, maxTokens = 600 } = request.body || {}
  if (!Array.isArray(messages)) return response.status(400).json({ error: 'Messages are required.' })

  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GAPGPT_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: typeof temperature === 'number' ? temperature : 0.2, max_tokens: typeof maxTokens === 'number' ? maxTokens : 600 }),
    })
    const payload = await upstream.json()
    if (!upstream.ok) return response.status(upstream.status).json({ error: payload.error?.message || 'GapGPT request failed.' })
    return response.status(200).json({ content: payload.choices?.[0]?.message?.content || '' })
  } catch {
    return response.status(502).json({ error: 'Unable to reach GapGPT.' })
  }
}
