import { BatteryWarning, Zap } from 'lucide-react'
import type { TowerState } from '../../types'

const formatDuration = (minutes: number | null) => {
  if (minutes === null) return '—'
  const total = Math.max(0, Math.round(minutes))
  return `${Math.floor(total / 60)} ساعت و ${total % 60} دقیقه`
}

export function PowerSection({ tower }: { tower: TowerState }) {
  const batteryColor = tower.batteryLevel < 20 ? 'bg-rose-500 animate-pulse' : tower.batteryLevel <= 60 ? 'bg-amber-400' : 'bg-emerald-500'
  const outageMinutes = tower.outageStartedAt ? (Date.now() - new Date(tower.outageStartedAt).getTime()) / 60_000 : null
  return (
    <section className="rounded-xl border border-line bg-slate-950/30 p-4">
      <h3 className="mb-3 font-semibold">برق و باتری</h3>
      <div className="space-y-3 text-sm text-slate-300">
        <p className="flex items-center gap-2">
          {tower.isGridPowerActive ? <Zap className="h-4 w-4 text-amber-300" /> : <BatteryWarning className="h-4 w-4 text-amber-300" />}
          منبع: {tower.isGridPowerActive ? 'برق شبکه' : `باتری${outageMinutes ? ` (قطعی: ${formatDuration(outageMinutes)})` : ''}`}
        </p>
        <div><div className="mb-1 flex justify-between"><span>باتری</span><b>{Math.round(tower.batteryLevel)}٪</b></div><div className="h-2 overflow-hidden rounded bg-slate-800"><div className={`h-full ${batteryColor}`} style={{ width: `${tower.batteryLevel}%` }} /></div></div>
        <div><div className="mb-1 flex justify-between"><span>سلامت</span><b>{Math.round(tower.batteryHealth)}٪</b></div><div className="h-2 overflow-hidden rounded bg-slate-800"><div className="h-full bg-sky-400" style={{ width: `${tower.batteryHealth}%` }} /></div></div>
        <p>زمان باقی‌مانده: <b>{formatDuration(tower.estimatedRuntimeMinutes)}</b></p>
      </div>
    </section>
  )
}
