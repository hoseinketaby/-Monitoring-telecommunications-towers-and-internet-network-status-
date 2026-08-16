import type { TowerState } from '../types'
import { fallbackAnalysis } from './fallbackAnalysis'
import { alertSystemPrompt, reportSystemPrompt } from './prompts'
import { chatWithFallback } from './providers'

export function createNetworkSnapshot(towers: TowerState[]) {
  const healthy = towers.filter((tower) => tower.status === 'online' && tower.isGridPowerActive && tower.batteryLevel >= 20)
  const critical = towers.filter((tower) => !healthy.includes(tower))
  return {
    summary: {
      totalTowers: towers.length,
      healthy: healthy.length,
      degraded: towers.filter((tower) => tower.status === 'degraded').length,
      offline: towers.filter((tower) => tower.status === 'offline').length,
      averageSignal: Math.round(towers.reduce((sum, tower) => sum + tower.signalStrength, 0) / Math.max(1, towers.length)),
    },
    criticalTowers: critical.map((tower) => ({
      id: tower.id,
      name: tower.name,
      region: tower.region,
      status: tower.status,
      isGridPowerActive: tower.isGridPowerActive,
      batteryLevel: Math.round(tower.batteryLevel),
      batteryHealth: Math.round(tower.batteryHealth),
      estimatedRuntimeMinutes: tower.estimatedRuntimeMinutes && Math.round(tower.estimatedRuntimeMinutes),
      outageStartedMinutesAgo: tower.outageStartedAt
        ? Math.round((Date.now() - new Date(tower.outageStartedAt).getTime()) / 60_000)
        : null,
      weather: {
        condition: tower.weather.condition,
        windspeed: tower.weather.windspeed,
        precipitation: tower.weather.precipitation,
      },
    })),
  }
}

let lastCallAt = 0
let pending: Promise<string> | null = null

export async function analyzeNetwork(towers: TowerState[], report = false): Promise<string> {
  if (pending) return pending
  const waitMs = Math.max(0, 10_000 - (Date.now() - lastCallAt))
  pending = (async () => {
    if (waitMs) await new Promise((resolve) => window.setTimeout(resolve, waitMs))
    lastCallAt = Date.now()
    const snapshot = createNetworkSnapshot(towers)
    try {
      const response = await chatWithFallback({
        temperature: 0.2,
        maxTokens: report ? 800 : 500,
        messages: [
          { role: 'system', content: report ? reportSystemPrompt : alertSystemPrompt },
          { role: 'user', content: JSON.stringify(snapshot) },
        ],
      })
      return response.content || fallbackAnalysis(towers)
    } catch {
      return fallbackAnalysis(towers)
    } finally {
      pending = null
    }
  })()
  return pending
}
