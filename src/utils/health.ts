import type { TowerState } from '../types'

export function towerHealthScore(tower: TowerState) {
  const availability = tower.status === 'online' ? 100 : tower.status === 'degraded' ? 55 : 10
  const power = tower.isGridPowerActive ? 100 : Math.min(100, tower.batteryLevel + 15)
  const signal = Math.max(0, Math.min(100, tower.signalStrength))
  const packet = Math.max(0, 100 - tower.packetLoss * 10)
  const thermal = Math.max(0, 100 - Math.max(0, tower.cpuTemp - 55) * 2)
  return Math.round(availability * .35 + power * .2 + signal * .2 + packet * .15 + thermal * .1)
}

export function towerRiskLabel(score: number) {
  return score >= 80 ? 'healthy' : score >= 55 ? 'attention' : 'critical'
}
