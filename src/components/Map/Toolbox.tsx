import { Cable, Cpu, Radio, RadioTower, Router, ServerCog, TowerControl, Zap } from 'lucide-react'
import type { MapTool } from '../../types'

const tools: Array<{ id: MapTool; label: string; caption: string; icon: typeof RadioTower }> = [
  { id: 'tower', label: 'دکل مخابراتی', caption: 'سازه و محل نصب رادیو', icon: RadioTower },
  { id: 'bts', label: 'سایت BTS / 4G-5G', caption: 'سایت دسترسی مشترکان', icon: TowerControl },
  { id: 'microwave', label: 'رادیو مایکروویو', caption: 'انتقال نقطه‌به‌نقطه', icon: Radio },
  { id: 'fiber', label: 'گره فیبر نوری', caption: 'بک‌هاول پرظرفیت', icon: Cable },
  { id: 'router', label: 'روتر انتقال IP', caption: 'تجمیع و مسیریابی', icon: Router },
  { id: 'core', label: 'هسته EPC / 5GC', caption: 'مرکز شبکه اپراتور', icon: ServerCog },
  { id: 'power', label: 'برق و ژنراتور', caption: 'تجهیز پشتیبان سایت', icon: Zap },
]

export function Toolbox() {
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-center gap-2"><Cpu className="h-5 w-5 text-sky-300" /><h2 className="font-bold">طراحی تجهیزات</h2></div>
      <p className="mt-1 text-xs leading-5 text-slate-400">هر تجهیز را بکشید و روی نقشه رها کنید. سپس برای ساخت لینک، دو تجهیز را پشت سر هم انتخاب کنید.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {tools.map(({ id, label, caption, icon: Icon }) => (
          <div key={id} draggable onDragStart={(event) => {
            event.dataTransfer.setData('application/telecom-tool', id)
            event.dataTransfer.effectAllowed = 'copy'
          }} className="cursor-grab rounded-xl border border-line bg-slate-950/40 p-3 active:cursor-grabbing">
            <div className="flex items-center gap-3"><Icon className="h-5 w-5 shrink-0 text-sky-300" /><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-slate-400">{caption}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  )
}
