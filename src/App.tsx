import { useEffect } from 'react'
import { Activity, BarChart3, Languages, LayoutDashboard, Map, RefreshCw, RadioTower, ScrollText, Sparkles, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { MapView } from './pages/MapView'
import { SimulationView } from './pages/SimulationView'
import { NetworkLogs } from './pages/NetworkLogs'
import { useMonitorStore } from './store'
import type { DataSource } from './types'
import { useI18n } from './i18n'
import { Analytics } from './pages/Analytics'
import { Admin } from './pages/Admin'
import { Investor } from './pages/Investor'

const dataSourceLabels: Record<DataSource, string> = {
  'telecom-api': 'متصل به API مخابرات',
  database: 'دیتابیس',
  'json-seed': 'داده نمونه محلی',
  mock: 'حالت آزمایشی',
}

export default function App() {
  const initialize = useMonitorStore((state) => state.initialize)
  const refresh = useMonitorStore((state) => state.refresh)
  const dataSource = useMonitorStore((state) => state.dataSource)
  const loading = useMonitorStore((state) => state.loading)
  const lastRefresh = useMonitorStore((state) => state.lastRefresh)
  const page = useMonitorStore((state) => state.activePage)
  const setActivePage = useMonitorStore((state) => state.setActivePage)
  const autoRefreshEnabled = useMonitorStore((state) => state.autoRefreshEnabled)
  const refreshIntervalMs = useMonitorStore((state) => state.refreshIntervalMs)
  const setAutoRefreshEnabled = useMonitorStore((state) => state.setAutoRefreshEnabled)
  const setRefreshIntervalMs = useMonitorStore((state) => state.setRefreshIntervalMs)
  const { language, toggleLanguage, t } = useI18n()

  useEffect(() => { void initialize() }, [initialize])
  useEffect(() => {
    if (!autoRefreshEnabled) return undefined
    const timer = window.setInterval(() => { void refresh() }, refreshIntervalMs)
    return () => window.clearInterval(timer)
  }, [autoRefreshEnabled, refresh, refreshIntervalMs])
  if (window.location.pathname === '/admin') return <Admin />

  return (
    <main dir={language === 'fa' ? 'rtl' : 'ltr'} className="min-h-screen bg-canvas text-slate-100">
      <header className="sticky top-0 z-[1100] border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto flex items-center gap-2"><RadioTower className="h-6 w-6 text-accent" /><div><h1 className="font-bold">{t('brand')}</h1><p className="text-xs text-slate-400">Telecom Network Intelligence</p></div></div>
          <span className="rounded-full border border-sky-900 bg-sky-950/70 px-3 py-1 text-xs text-sky-200">{dataSourceLabels[dataSource]}</span>
          <nav className="flex flex-wrap rounded-lg border border-line p-1 text-sm">
            <button onClick={() => setActivePage('dashboard')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'dashboard' ? 'bg-slate-700' : 'text-slate-400'}`}><LayoutDashboard className="h-4 w-4" /> {t('dashboard')}</button>
            <button onClick={() => setActivePage('map')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'map' ? 'bg-slate-700' : 'text-slate-400'}`}><Map className="h-4 w-4" /> {t('map')}</button>
            <button onClick={() => setActivePage('simulation')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'simulation' ? 'bg-cyan-700 text-white' : 'text-slate-400'}`}><Activity className="h-4 w-4" /> {t('simulation')}</button>
            <button onClick={() => setActivePage('network-logs')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'network-logs' ? 'bg-emerald-700 text-white' : 'text-slate-400'}`}><ScrollText className="h-4 w-4" /> {t('logs')}</button>
            <button onClick={() => setActivePage('analytics')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'analytics' ? 'bg-violet-700 text-white' : 'text-slate-400'}`}><BarChart3 className="h-4 w-4" /> {t('analytics')}</button>
            <button onClick={() => setActivePage('investor')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'investor' ? 'bg-amber-700 text-white' : 'text-slate-400'}`}><TrendingUp className="h-4 w-4" /> {t('investor')}</button>
          </nav>
          <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {t('refresh')}</button>
          <button onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)} className="inline-flex items-center gap-2 rounded-lg border border-amber-800/70 bg-amber-950/20 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-900/40"><SlidersHorizontal className="h-4 w-4" /> {t('autoRefresh')}</button>
          <label className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-slate-300">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span>{t('refreshEvery')}</span>
            <input type="number" min={5} step={5} value={Math.round(refreshIntervalMs / 1000)} onChange={(event) => setRefreshIntervalMs(Number(event.target.value) * 1000)} className="w-16 bg-transparent text-right outline-none" />
          </label>
          <button onClick={toggleLanguage} aria-label="Change language" className="inline-flex items-center gap-2 rounded-lg border border-cyan-800/70 bg-cyan-950/30 px-3 py-2 text-sm text-cyan-200 transition hover:bg-cyan-900/50"><Languages className="h-4 w-4" /> {t('language')}</button>
          {lastRefresh && <span className="text-xs text-slate-500">{t('lastRefresh')}: {new Intl.DateTimeFormat(language === 'fa' ? 'fa-IR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastRefresh))}</span>}
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] p-4">{page === 'dashboard' ? <Dashboard /> : page === 'map' ? <MapView /> : page === 'simulation' ? <SimulationView /> : page === 'analytics' ? <Analytics /> : page === 'investor' ? <Investor /> : <NetworkLogs />}</div>
    </main>
  )
}
