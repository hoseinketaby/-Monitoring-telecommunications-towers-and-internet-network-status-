import { Cable, Radio, RadioTower } from 'lucide-react'
import type { MapTool } from '../../types'

const tools: Array<{ id: MapTool; label: string; caption: string; icon: typeof RadioTower }> = [
  { id: 'tower', label: 'دکل مخابراتی', caption: 'پایش سلامت و برق', icon: RadioTower },
  { id: 'relay', label: 'رله رادیویی', caption: 'لینک نقطه‌به‌نقطه', icon: Radio },
  { id: 'fiber', label: 'گره فیبر نوری', caption: 'اتصال فیبر', icon: Cable },
]

export function Toolbox() {
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <h2 className="font-bold">ابزارهای شبکه</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">هر تجهیز را بکشید و روی نقشه رها کنید.</p>
      <div className="mt-4 space-y-2">
        {tools.map(({ id, label, caption, icon: Icon }) => (
          <div key={id} draggable onDragStart={(event) => {
            event.dataTransfer.setData('application/telecom-tool', id)
            event.dataTransfer.effectAllowed = 'copy'
          }} className="cursor-grab rounded-xl border border-line bg-slate-950/40 p-3 active:cursor-grabbing">
            <div className="flex items-center gap-3"><Icon className="h-5 w-5 text-sky-300" /><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-slate-400">{caption}</p></div></div>
          </div>
        ))}
      </div>
    </section>
  )
}
