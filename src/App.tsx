import { useEffect } from 'react'
import { Activity, LayoutDashboard, Map, RefreshCw, RadioTower } from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { MapView } from './pages/MapView'
import { SimulationView } from './pages/SimulationView'
import { useMonitorStore } from './store'
import type { DataSource } from './types'

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

  useEffect(() => { void initialize() }, [initialize])

  return (
    <main dir="rtl" className="min-h-screen bg-canvas text-slate-100">
      <header className="sticky top-0 z-[1100] border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto flex items-center gap-2"><RadioTower className="h-6 w-6 text-accent" /><div><h1 className="font-bold">پایش هوشمند دکل‌ها</h1><p className="text-xs text-slate-400">Telecom Network Intelligence</p></div></div>
          <span className="rounded-full border border-sky-900 bg-sky-950/70 px-3 py-1 text-xs text-sky-200">{dataSourceLabels[dataSource]}</span>
          <nav className="flex flex-wrap rounded-lg border border-line p-1 text-sm">
            <button onClick={() => setActivePage('dashboard')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'dashboard' ? 'bg-slate-700' : 'text-slate-400'}`}><LayoutDashboard className="h-4 w-4" /> داشبورد</button>
            <button onClick={() => setActivePage('map')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'map' ? 'bg-slate-700' : 'text-slate-400'}`}><Map className="h-4 w-4" /> نقشه و هشدارها</button>
            <button onClick={() => setActivePage('simulation')} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 ${page === 'simulation' ? 'bg-cyan-700 text-white' : 'text-slate-400'}`}><Activity className="h-4 w-4" /> شبیه‌ساز ابزار</button>
          </nav>
          <button onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> به‌روزرسانی</button>
          {lastRefresh && <span className="text-xs text-slate-500">آخرین به‌روزرسانی: {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastRefresh))}</span>}
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] p-4">{page === 'dashboard' ? <Dashboard /> : page === 'map' ? <MapView /> : <SimulationView />}</div>
    </main>
  )
}
