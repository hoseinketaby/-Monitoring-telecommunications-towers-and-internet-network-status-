import { useEffect, useMemo, useState } from 'react'
import { BarChart3, RefreshCw, Sparkles } from 'lucide-react'
import { useMonitorStore } from '../store'
import { useI18n } from '../i18n'

export function Analytics() {
  const towers = useMonitorStore((state) => state.towers)
  const { language } = useI18n()
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const chart = useMemo(() => ({
    type: 'bar',
    data: {
      labels: towers.map((tower) => tower.name),
      datasets: [
        { label: 'Signal strength', data: towers.map((tower) => Math.round(tower.signalStrength)), backgroundColor: '#38bdf8' },
        { label: 'Battery level', data: towers.map((tower) => Math.round(tower.batteryLevel)), backgroundColor: '#34d399' },
        { label: 'Packet loss', data: towers.map((tower) => Number(tower.packetLoss.toFixed(2))), backgroundColor: '#fb7185' },
      ],
    },
    options: { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } }, title: { display: true, text: language === 'fa' ? 'نمای کلی سلامت تجهیزات مخابراتی' : 'Telecom equipment health overview', color: '#f8fafc' } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { beginAtZero: true, ticks: { color: '#94a3b8' } } } },
  }), [language, towers])

  const renderChart = async () => {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/quickchart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chart, width: 1100, height: 520, format: 'png' }) })
      if (!response.ok) throw new Error('QuickChart request failed')
      const blob = await response.blob()
      setImageUrl(URL.createObjectURL(blob))
    } catch {
      const encoded = encodeURIComponent(JSON.stringify(chart))
      setImageUrl(`https://quickchart.io/chart?c=${encoded}&w=1100&h=520&f=png&bkg=%230f172a`)
      setError('')
    } finally { setLoading(false) }
  }
  useEffect(() => { if (towers.length) void renderChart() }, [towers.length])

  return <section className="space-y-4" dir={language === 'fa' ? 'rtl' : 'ltr'}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-violet-300">QUICKCHART ANALYTICS</p><h1 className="mt-1 text-2xl font-bold">{language === 'fa' ? 'تحلیل سلامت تجهیزات' : 'Equipment health analytics'}</h1><p className="mt-1 text-sm text-slate-400">{language === 'fa' ? 'نمودار زنده بر اساس مشخصات دکل‌ها و تجهیزات شبکه.' : 'Live chart generated from tower and network equipment specifications.'}</p></div><button onClick={() => void renderChart()} disabled={loading || !towers.length} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {language === 'fa' ? 'به‌روزرسانی تحلیل' : 'Refresh analysis'}</button></div>
    <div className="rounded-2xl border border-violet-900/60 bg-panel p-3">{imageUrl ? <img src={imageUrl} alt="QuickChart equipment health analysis" className="w-full rounded-xl bg-slate-950" /> : <div className="flex min-h-[360px] items-center justify-center text-slate-500"><BarChart3 className="mr-2 h-6 w-6" />{error || 'Chart will appear here'}</div>}</div>
  </section>
}
