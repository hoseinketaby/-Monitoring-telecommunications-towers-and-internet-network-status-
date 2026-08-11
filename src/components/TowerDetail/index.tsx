import { X } from 'lucide-react'
import { useMonitorStore } from '../../store'
import { WeatherBadge } from '../WeatherBadge'
import { PowerSection } from './PowerSection'

const statusLabel = { online: 'فعال', degraded: 'ناپایدار', offline: 'قطع' }

export function TowerDetail() {
  const tower = useMonitorStore((state) => state.towers.find((item) => item.id === state.selectedTowerId))
  const selectTower = useMonitorStore((state) => state.selectTower)
  if (!tower) return null
  return (
    <aside dir="rtl" className="absolute right-4 top-4 z-[1000] w-80 rounded-2xl border border-line bg-panel/95 p-4 text-right shadow-2xl backdrop-blur">
      <button onClick={() => selectTower(null)} className="float-left text-slate-400 hover:text-white" aria-label="بستن"><X className="h-5 w-5" /></button>
      <h2 className="text-lg font-bold">{tower.name}</h2>
      <p className="mb-4 text-xs text-slate-400">{tower.id} · {tower.region}</p>
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <p>وضعیت: <b className={tower.status === 'online' ? 'text-emerald-400' : tower.status === 'offline' ? 'text-rose-400' : 'text-amber-400'}>{statusLabel[tower.status]}</b></p>
        <p>سیگنال: <b>{Math.round(tower.signalStrength)}٪</b></p>
        <p>افت بسته: <b>{tower.packetLoss.toFixed(1)}٪</b></p>
        <WeatherBadge weather={tower.weather} />
      </div>
      <PowerSection tower={tower} />
    </aside>
  )
}
