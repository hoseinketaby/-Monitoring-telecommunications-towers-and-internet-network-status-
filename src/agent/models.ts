export const fallbackGapGptModels = [
  'deepseek-chat',
  'qwen3-235b-a22b',
  'gemini-2.0-flash',
  'gpt-4o-mini',
  'grok-3-mini',
  'claude-sonnet-4-20250514',
]

export async function getGapGptModels() {
  try {
    const response = await fetch('/api/ai/models')
    const payload = await response.json()
    return Array.isArray(payload.models) && payload.models.length ? payload.models : fallbackGapGptModels
  } catch {
    return fallbackGapGptModels
  }
}
