import type { LLMProvider } from './types'

export async function chatWithFallback(params: Parameters<LLMProvider['chat']>[0]) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.error || 'OpenRouter request failed')
  return { content: payload.content || '', provider: 'openrouter' as const }
}
