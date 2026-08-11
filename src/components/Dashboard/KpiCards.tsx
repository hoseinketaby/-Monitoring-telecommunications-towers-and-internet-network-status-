import { Activity, BatteryCharging, RadioTower, ZapOff } from 'lucide-react'
import type { TowerState } from '../../types'

export function KpiCards({ towers }: { towers: TowerState[] }) {
  const online = towers.filter((tower) => tower.status === 'online').length
  const avgHealth = towers.reduce((total, tower) => total + tower.batteryHealth, 0) / Math.max(towers.length, 1)
  const outages = towers.filter((tower) => !tower.isGridPowerActive).length
  const items = [
    ['کل دکل‌ها', towers.length, RadioTower, 'text-sky-300'],
    ['آنلاین', `${Math.round((online / Math.max(towers.length, 1)) * 100)}٪`, Activity, 'text-emerald-400'],
    ['میانگین سلامت باتری', `${Math.round(avgHealth)}٪`, BatteryCharging, 'text-amber-300'],
    ['قطعی برق فعال', outages, ZapOff, 'text-rose-400'],
  ] as const
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value, Icon, color]) => <article key={label} className="rounded-2xl border border-line bg-panel p-4"><Icon className={`mb-3 h-5 w-5 ${color}`} /><p className="text-sm text-slate-400">{label}</p><b className="text-2xl">{value}</b></article>)}</div>
}
