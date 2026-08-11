import { Battery, BatteryWarning, CircleOff, Zap } from 'lucide-react'
import type { TowerState } from '../types'

export function PowerBadge({ tower }: { tower: TowerState }) {
  if (tower.status === 'offline') return <span title="دکل قطع است"><CircleOff className="h-4 w-4 text-rose-400" /></span>
  if (tower.isGridPowerActive) return <span title="برق شبکه فعال است"><Zap className="h-4 w-4 text-amber-300" /></span>
  if (tower.batteryLevel < 20) return <span title="باتری بحرانی است"><BatteryWarning className="h-4 w-4 animate-pulse text-rose-400" /></span>
  return <span title="برق از باتری تأمین می‌شود"><Battery className="h-4 w-4 text-yellow-300" /></span>
}
