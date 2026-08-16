import { useState } from 'react'
import { Bot, CheckCircle2, CloudLightning, PlugZap, TriangleAlert } from 'lucide-react'
import { analyzeNetwork } from '../../agent/monitor'
import { useMonitorStore } from '../../store'

const icons = { 'power-outage': PlugZap, 'battery-critical': TriangleAlert, weather: CloudLightning, 'status-change': TriangleAlert, restored: CheckCircle2, summary: Bot }

export function AgentFeed() {
  const events = useMonitorStore((state) => state.events)
  const towers = useMonitorStore((state) => state.towers)
  const selectTower = useMonitorStore((state) => state.selectTower)
  const addEvent = useMonitorStore((state) => state.addEvent)
  const [filter, setFilter] = useState<'all' | 'power-outage' | 'battery-critical' | 'weather' | 'restored'>('all')
  const [creatingReport, setCreatingReport] = useState(false)
  const visibleEvents = filter === 'all' ? events : events.filter((event) => event.type === filter)
  const createReport = async () => {
    setCreatingReport(true)
    const analysis = await analyzeNetwork(towers, true)
    addEvent({ type: 'summary', message: 'گزارش مدیریتی شبکه', analysis })
    setCreatingReport(false)
  }
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Bot className="h-5 w-5 text-accent" /><h2 className="ml-auto font-bold">پایش با ایجنت هوش مصنوعی</h2>
        <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded border border-line bg-slate-900 px-2 py-1 text-xs">
          <option value="all">همه رویدادها</option><option value="power-outage">قطعی برق</option><option value="battery-critical">باتری بحرانی</option><option value="weather">آب‌وهوا</option><option value="restored">بازگشت عادی</option>
        </select>
        <button disabled={creatingReport} onClick={() => void createReport()} className="rounded border border-line px-2 py-1 text-xs hover:bg-slate-800 disabled:opacity-50">{creatingReport ? 'در حال تهیه…' : 'گزارش مدیریتی'}</button>
      </div>
      <div className="mt-4 max-h-[500px] space-y-3 overflow-auto">
        {visibleEvents.length === 0 && <p className="text-sm text-slate-400">رویدادی با این فیلتر وجود ندارد.</p>}
        {visibleEvents.map((event) => {
          const Icon = icons[event.type]
          const tower = towers.find((item) => item.id === event.towerId)
          return (
            <button key={event.id} onClick={() => event.towerId && selectTower(event.towerId)} className="w-full rounded-xl border border-line bg-slate-950/40 p-3 text-right transition hover:border-slate-500">
              <div className="flex items-start gap-2"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><div><p className="text-sm">{event.message}</p>{tower && <p className="mt-1 text-xs text-slate-400">⚡ {tower.isGridPowerActive ? 'شبکه' : 'باتری'} · {Math.round(tower.batteryLevel)}٪</p>}</div></div>
              {event.analysis && <p className="mt-2 whitespace-pre-line border-t border-line pt-2 text-xs leading-6 text-slate-300">{event.analysis}</p>}
            </button>
          )
        })}
      </div>
    </section>
  )
}
