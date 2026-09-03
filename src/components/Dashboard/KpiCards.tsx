import { Activity, BatteryCharging, RadioTower, ZapOff } from 'lucide-react'
import type { TowerState } from '../../types'
import { useI18n } from '../../i18n'

export function KpiCards({ towers }: { towers: TowerState[] }) {
  const { t } = useI18n()
  const online = towers.filter((tower) => tower.status === 'online').length
  const avgHealth = towers.reduce((total, tower) => total + tower.batteryHealth, 0) / Math.max(towers.length, 1)
  const outages = towers.filter((tower) => !tower.isGridPowerActive).length
  const items = [
    [t('towerCount'), towers.length, RadioTower, 'text-sky-300'],
    [t('online'), `${Math.round((online / Math.max(towers.length, 1)) * 100)}%`, Activity, 'text-emerald-400'],
    [t('avgBattery'), `${Math.round(avgHealth)}%`, BatteryCharging, 'text-amber-300'],
    [t('outages'), outages, ZapOff, 'text-rose-400'],
  ] as const
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value, Icon, color]) => <article key={label} className="rounded-2xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-sky-700"><Icon className={`mb-3 h-5 w-5 ${color}`} /><p className="text-sm text-slate-400">{label}</p><b className="text-2xl">{value}</b></article>)}</div>
}
