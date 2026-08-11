import type { TowerState } from '../types'

export function fallbackAnalysis(towers: TowerState[]): string {
  const critical = towers.filter((tower) => tower.status !== 'online' || !tower.isGridPowerActive || tower.batteryLevel < 20)
  if (!critical.length) return '• شبکه پایدار است؛ مورد فوری برای اقدام شناسایی نشد.'
  return critical.slice(0, 8).map((tower) => {
    const power = !tower.isGridPowerActive
      ? `روی باتری است${tower.estimatedRuntimeMinutes !== null ? ` و حدود ${Math.round(tower.estimatedRuntimeMinutes)} دقیقه زمان دارد` : ''}`
      : 'برق شبکه فعال است'
    const action = tower.batteryLevel < 20 ? 'اعزام فوری تیم برق یا ژنراتور سیار.' : 'بررسی میدانی و مسیر جایگزین ارتباطی.'
    return `• ${tower.name}: ${power}. ${action}`
  }).join('\n')
}
