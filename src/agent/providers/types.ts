export type ProviderName = 'gapgpt'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMProvider {
  name: ProviderName
  chat(params: {
    messages: ChatMessage[]
    temperature?: number
    maxTokens?: number
  }): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number } }>
}
