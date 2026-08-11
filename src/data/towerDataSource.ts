import seedRows from './towers.seed.json'
import { getDatabaseTowers } from './dbClient'
import { defaultWeather, generateMockTowers } from './mockGenerator'
import { getTelecomApiTowers } from './telecomApiClient'
import type { DataSource, TowerState } from '../types'

let activeDataSource: DataSource = 'mock'

const clamp = (value: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, value))

const normalizeSeed = (row: (typeof seedRows)[number]): TowerState => ({
  ...row,
  status: row.status === 'offline' || row.status === 'degraded' ? row.status : 'online',
  signalStrength: clamp(row.signalStrength, 0, 100),
  packetLoss: Math.max(0, row.packetLoss),
  weather: defaultWeather,
  estimatedRuntimeMinutes: row.isGridPowerActive ? null : row.batteryLevel * 3,
  outageStartedAt: row.isGridPowerActive ? null : new Date(Date.now() - 4 * 60 * 60_000).toISOString(),
  dataSource: 'json-seed',
  lastUpdated: new Date().toISOString(),
})

export async function getTowerData(): Promise<TowerState[]> {
  const candidates: Array<[DataSource, () => Promise<TowerState[]>]> = [
    ['telecom-api', getTelecomApiTowers],
    ['database', getDatabaseTowers],
    ['json-seed', async () => seedRows.map(normalizeSeed)],
    ['mock', async () => generateMockTowers()],
  ]

  for (const [source, fetcher] of candidates) {
    try {
      const towers = await fetcher()
      if (towers.length) {
        activeDataSource = source
        return towers
      }
    } catch (error) {
      console.info(`Tower data source ${source} unavailable`, error)
    }
  }
  activeDataSource = 'mock'
  return generateMockTowers()
}

export const getActiveDataSource = () => activeDataSource
export const isLiveDataSource = (source = activeDataSource) =>
  source === 'telecom-api' || source === 'database'
