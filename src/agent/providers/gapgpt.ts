import { appEnv } from '../../config/env'
import type { LLMProvider } from './types'

export const gapGptProvider: LLMProvider = {
  name: 'gapgpt',
  async chat(params) {
    if (!appEnv.gapGptKey) throw new Error('GAPGPT_API_KEY is not configured')
    const response = await fetch('https://api.gapgpt.app/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${appEnv.gapGptKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: params.model, messages: params.messages, temperature: params.temperature, max_tokens: params.maxTokens }),
    })
    if (!response.ok) throw new Error(`GapGPT error: ${response.status}`)
    const payload = await response.json()
    return { content: payload.choices?.[0]?.message?.content ?? '' }
  },
}
