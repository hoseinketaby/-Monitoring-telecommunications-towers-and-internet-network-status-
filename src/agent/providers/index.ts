import { appEnv } from '../../config/env'
import { avalAiProvider } from './avalai'
import { gapGptProvider } from './gapgpt'
import { openRouterProvider } from './openrouter'
import type { LLMProvider, ProviderName } from './types'

const providers: Record<ProviderName, LLMProvider> = {
  openrouter: openRouterProvider,
  gapgpt: gapGptProvider,
  avalai: avalAiProvider,
}

export async function chatWithFallback(params: Parameters<LLMProvider['chat']>[0]) {
  const order = [...new Set([appEnv.llmProvider, ...appEnv.llmFallbackOrder])]
  let lastError: unknown
  for (const name of order) {
    const provider = providers[name]
    if (!provider) continue
    try {
      const result = await provider.chat(params)
      console.info(`LLM response received from ${name}`)
      return { ...result, provider: name }
    } catch (error) {
      lastError = error
      console.warn(`LLM provider ${name} failed; attempting fallback.`, error)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No LLM provider succeeded')
}
