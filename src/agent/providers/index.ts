import type { LLMProvider } from './types'

export async function chatWithFallback(params: Parameters<LLMProvider['chat']>[0]) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const raw = await response.text()
  let payload: { content?: string; error?: string } = {}
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as typeof payload
    } catch {
      throw new Error(`AI server returned non-JSON (${response.status} ${response.statusText}).`)
    }
  }
  if (!response.ok) throw new Error(payload.error || 'OpenRouter request failed')
  return { content: payload.content || '', provider: 'openrouter' as const }
}
