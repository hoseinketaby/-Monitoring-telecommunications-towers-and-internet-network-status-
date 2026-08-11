import { appEnv } from '../../config/env'
import type { LLMProvider } from './types'

export const avalAiProvider: LLMProvider = {
  name: 'avalai',
  async chat(params) {
    if (!appEnv.avalAiKey) throw new Error('AVALAI_API_KEY is not configured')
    const response = await fetch('https://api.avalai.ir/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${appEnv.avalAiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: params.model, messages: params.messages, temperature: params.temperature, max_tokens: params.maxTokens }),
    })
    if (!response.ok) throw new Error(`AvalAI error: ${response.status}`)
    const payload = await response.json()
    return { content: payload.choices?.[0]?.message?.content ?? '' }
  },
}
