const env = import.meta.env

const numberEnv = (key: string, fallback: number) => {
  const value = Number(env[key])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export const appEnv = {
  telecomApiUrl: env.VITE_TELECOM_API_URL ?? env.TELECOM_API_URL ?? '',
  telecomApiKey: env.VITE_TELECOM_API_KEY ?? env.TELECOM_API_KEY ?? '',
  databaseUrl: env.VITE_DATABASE_URL ?? env.DATABASE_URL ?? '',
  pollIntervalMs: numberEnv('VITE_POLL_INTERVAL_MS', numberEnv('POLL_INTERVAL_MS', 30_000)),
}
