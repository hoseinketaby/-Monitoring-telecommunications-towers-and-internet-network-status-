import { appEnv } from '../config/env'
import type { TowerState } from '../types'
import { mapTelecomApiToTowerState } from './telecomApiClient'

export async function getDatabaseTowers(): Promise<TowerState[]> {
  if (!appEnv.databaseUrl) throw new Error('Database URL is not configured')
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 3_000)
  try {
    const response = await fetch(appEnv.databaseUrl, { signal: controller.signal })
    if (!response.ok) throw new Error(`Database endpoint error: ${response.status}`)
    const rows: unknown = await response.json()
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Database returned no towers')
    return rows
      .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
      .map((row) => ({ ...mapTelecomApiToTowerState(row), dataSource: 'database' as const }))
  } finally {
    window.clearTimeout(timer)
  }
}
