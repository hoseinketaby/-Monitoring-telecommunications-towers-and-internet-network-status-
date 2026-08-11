import type { TowerState } from '../types'

export interface PowerConfig {
  chargeRatePerTick: number
  baseDrainPerTick: number
  criticalThreshold: number
  tickIntervalMs: number
}

export const defaultPowerConfig: PowerConfig = {
  chargeRatePerTick: 0.5,
  baseDrainPerTick: 0.3,
  criticalThreshold: 20,
  tickIntervalMs: 60_000,
}

export function simulatePower(tower: TowerState, loadFactor: number, config: PowerConfig): TowerState {
  const updated = { ...tower }
  const healthPenalty = 1 + (1 - updated.batteryHealth / 100) * 0.5

  if (!updated.isGridPowerActive) {
    const drain = config.baseDrainPerTick * loadFactor * healthPenalty
    updated.batteryLevel = Math.max(0, updated.batteryLevel - drain)
    updated.estimatedRuntimeMinutes =
      drain > 0 ? (updated.batteryLevel / drain) * (config.tickIntervalMs / 60_000) : null
    if (updated.batteryLevel <= 0) {
      updated.status = 'offline'
      updated.estimatedRuntimeMinutes = 0
    }
  } else {
    updated.batteryLevel = Math.min(100, updated.batteryLevel + config.chargeRatePerTick)
    updated.estimatedRuntimeMinutes = null
  }
  return updated
}
