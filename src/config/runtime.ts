const storageKey = 'telecom-ai-settings'

export interface AiSettings {
  model: string
}

const defaults: AiSettings = { model: 'deepseek-chat' }

export function getAiSettings(): AiSettings {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  } catch {
    return defaults
  }
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(storageKey, JSON.stringify(settings))
}
