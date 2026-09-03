import { ExportButton } from '../components/Dashboard/ExportButton'
import { KpiCards } from '../components/Dashboard/KpiCards'
import { RiskTable } from '../components/Dashboard/RiskTable'
import { UptimeChart } from '../components/Dashboard/UptimeChart'
import { TowerMap } from '../components/Map'
import { useMonitorStore } from '../store'
import { useI18n } from '../i18n'

export function Dashboard() {
  const towers = useMonitorStore((state) => state.towers)
  const { t } = useI18n()
  const online = towers.filter((tower) => tower.status === 'online').length
  const health = Math.round(towers.reduce((sum, tower) => sum + tower.batteryHealth, 0) / Math.max(towers.length, 1))
  const tone = online === towers.length && health >= 80 ? 'emerald' : online / Math.max(towers.length, 1) > .7 ? 'amber' : 'rose'
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold">{t('managementDashboard')}</h1><p className="text-sm text-slate-400">{t('dashboardSubtitle')}</p></div>
        <ExportButton towers={towers} />
      </div>
      <KpiCards towers={towers} />
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${tone === 'emerald' ? 'border-emerald-800/60 bg-emerald-950/20' : tone === 'amber' ? 'border-amber-800/60 bg-amber-950/20' : 'border-rose-800/60 bg-rose-950/20'}`}>
        <div><p className="text-xs uppercase tracking-[.18em] text-slate-400">{t('networkPulse')}</p><p className="mt-1 text-sm text-slate-200">{tone === 'emerald' ? t('healthy') : tone === 'amber' ? t('attention') : t('critical')}</p></div>
        <div className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />{t('live')} · {online}/{towers.length}</div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2"><UptimeChart towers={towers} /><RiskTable towers={towers} /></div>
      <TowerMap />
    </div>
  )
}
