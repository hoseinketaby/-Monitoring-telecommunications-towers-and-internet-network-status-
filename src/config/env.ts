const env = import.meta.env

const numberEnv = (key: string, fallback: number) => {
  const value = Number(env[key])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export const appEnv = {
  llmProvider: (env.VITE_LLM_PROVIDER ?? env.LLM_PROVIDER ?? 'openrouter') as
    | 'openrouter'
    | 'gapgpt'
    | 'avalai',
  llmFallbackOrder: (env.VITE_LLM_PROVIDER_FALLBACK_ORDER ??
    env.LLM_PROVIDER_FALLBACK_ORDER ??
    'gapgpt,avalai')
    .split(',')
    .map((value: string) => value.trim())
    .filter(Boolean) as Array<'openrouter' | 'gapgpt' | 'avalai'>,
  llmModel: env.VITE_LLM_MODEL ?? env.LLM_MODEL ?? '',
  openRouterKey: env.VITE_OPENROUTER_API_KEY ?? env.OPENROUTER_API_KEY ?? '',
  gapGptKey: env.VITE_GAPGPT_API_KEY ?? env.GAPGPT_API_KEY ?? '',
  avalAiKey: env.VITE_AVALAI_API_KEY ?? env.AVALAI_API_KEY ?? '',
  telecomApiUrl: env.VITE_TELECOM_API_URL ?? env.TELECOM_API_URL ?? '',
  telecomApiKey: env.VITE_TELECOM_API_KEY ?? env.TELECOM_API_KEY ?? '',
  databaseUrl: env.VITE_DATABASE_URL ?? env.DATABASE_URL ?? '',
  pollIntervalMs: numberEnv('VITE_POLL_INTERVAL_MS', numberEnv('POLL_INTERVAL_MS', 30_000)),
}
