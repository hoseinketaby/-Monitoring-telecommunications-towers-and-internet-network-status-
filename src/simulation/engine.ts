import type { TowerState } from '../types'
import { weatherOutageRiskMultiplier } from '../weather/impact'
import { computeLoadFactor } from './loadFactor'
import { defaultPowerConfig, simulatePower, type PowerConfig } from './power'

interface OutageRecord {
  endsAt: number
  cumulativeDischarge: number
}

export interface SimulationConfig extends PowerConfig {
  baseOutageProbabilityPerTick: number
}

export const defaultSimulationConfig: SimulationConfig = {
  ...defaultPowerConfig,
  baseOutageProbabilityPerTick: 0.0005,
}

const outages = new Map<string, OutageRecord>()
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

export function simulateNetwork(towers: TowerState[], config = defaultSimulationConfig): TowerState[] {
  const now = Date.now()
  return towers.map((tower) => {
    let next = { ...tower }
    let outage = outages.get(next.id)

    if (outage && now >= outage.endsAt) {
      outages.delete(next.id)
      outage = undefined
      next.isGridPowerActive = true
      next.outageStartedAt = null
      if (next.status === 'offline' && next.batteryLevel > 0) next.status = 'degraded'
    }

    if (!outage && next.isGridPowerActive) {
      const risk = config.baseOutageProbabilityPerTick * weatherOutageRiskMultiplier(next.weather)
      if (Math.random() < risk) {
        outage = { endsAt: now + randomBetween(30, 480) * 60_000, cumulativeDischarge: 0 }
        outages.set(next.id, outage)
        next.isGridPowerActive = false
        next.outageStartedAt = new Date(now).toISOString()
      }
    }

    const before = next.batteryLevel
    next = simulatePower(next, computeLoadFactor(next), config)
    if (!next.isGridPowerActive && outage) {
      outage.cumulativeDischarge += Math.max(0, before - next.batteryLevel)
      if (outage.cumulativeDischarge >= 100) {
        next.batteryHealth = Math.max(0, next.batteryHealth - 0.1 * (outage.cumulativeDischarge / 100))
        outage.cumulativeDischarge %= 100
      }
    }
    next.lastUpdated = new Date().toISOString()
    return next
  })
}
