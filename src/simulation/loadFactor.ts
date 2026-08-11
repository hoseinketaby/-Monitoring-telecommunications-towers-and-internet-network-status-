import type { TowerState } from '../types'

export function computeLoadFactor(tower: TowerState): number {
  const userLoad = Math.min(1.5, tower.connectedUsers / 500)
  const tempLoad = tower.cpuTemp > 40 ? 1.2 : 1
  return Math.max(0.5, userLoad * tempLoad)
}
