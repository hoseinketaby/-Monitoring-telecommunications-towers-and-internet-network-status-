import { describe, expect, it } from 'vitest'
import { defaultWeather } from '../data/mockGenerator'
import type { TowerState } from '../types'
import { simulatePower } from './power'

const tower: TowerState = {
  id: 'TEST-001',
  name: 'دکل تست',
  lat: 35.7,
  lng: 51.4,
  region: 'تهران',
  status: 'online',
  signalStrength: 90,
  packetLoss: 0,
  cpuTemp: 30,
  connectedUsers: 10,
  bandwidthUsageMbps: 2,
  weather: defaultWeather,
  isGridPowerActive: false,
  batteryLevel: 50,
  batteryHealth: 100,
  estimatedRuntimeMinutes: null,
  outageStartedAt: new Date().toISOString(),
  installedAt: '2025-01-01T00:00:00.000Z',
  dataSource: 'mock',
  lastUpdated: new Date().toISOString(),
}

describe('simulatePower', () => {
  it('does not divide by zero when battery drain is zero', () => {
    const updated = simulatePower(tower, 1, {
      chargeRatePerTick: 0.5,
      baseDrainPerTick: 0,
      criticalThreshold: 20,
      tickIntervalMs: 60_000,
    })

    expect(updated.batteryLevel).toBe(50)
    expect(updated.estimatedRuntimeMinutes).toBeNull()
  })
})
