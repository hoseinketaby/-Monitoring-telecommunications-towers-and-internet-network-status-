import { ExportButton } from '../components/Dashboard/ExportButton'
import { KpiCards } from '../components/Dashboard/KpiCards'
import { RiskTable } from '../components/Dashboard/RiskTable'
import { UptimeChart } from '../components/Dashboard/UptimeChart'
import { TowerMap } from '../components/Map'
import { useMonitorStore } from '../store'

export function Dashboard() {
  const towers = useMonitorStore((state) => state.towers)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold">داشبورد مدیریتی</h1><p className="text-sm text-slate-400">پایش سلامت، توان و ریسک عملیاتی شبکه</p></div>
        <ExportButton towers={towers} />
      </div>
      <KpiCards towers={towers} />
      <div className="grid gap-4 xl:grid-cols-2"><UptimeChart towers={towers} /><RiskTable towers={towers} /></div>
      <TowerMap />
    </div>
  )
}
