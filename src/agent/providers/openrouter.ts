import { appEnv } from '../../config/env'
import { getAiSettings } from '../../config/runtime'
import type { LLMProvider } from './types'

export const openRouterProvider: LLMProvider = {
  name: 'openrouter',
  async chat(params) {
    const apiKey = getAiSettings().openRouterKey || appEnv.openRouterKey
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured')
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })
    if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`)
    const payload = await response.json()
    return {
      content: payload.choices?.[0]?.message?.content ?? '',
      usage: payload.usage
        ? { promptTokens: payload.usage.prompt_tokens ?? 0, completionTokens: payload.usage.completion_tokens ?? 0 }
        : undefined,
    }
  },
}
