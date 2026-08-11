import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TowerState } from '../../types'

export function UptimeChart({ towers }: { towers: TowerState[] }) {
  const onlineRatio = Math.round((towers.filter((tower) => tower.status === 'online').length / Math.max(1, towers.length)) * 100)
  const points = Array.from({ length: 24 }, (_, index) => ({ hour: `${String(index).padStart(2, '0')}:00`, uptime: Math.max(78, Math.min(100, onlineRatio + Math.round(Math.sin(index / 3) * 4))) }))
  return <section className="rounded-2xl border border-line bg-panel p-4"><h2 className="mb-4 font-bold">روند پایداری در ۲۴ ساعت</h2><div className="h-64"><ResponsiveContainer><AreaChart data={points}><defs><linearGradient id="uptime" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} /><stop offset="100%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={3} /><YAxis domain={[70, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} /><Tooltip /><Area type="monotone" dataKey="uptime" stroke="#38bdf8" fill="url(#uptime)" /></AreaChart></ResponsiveContainer></div></section>
}
