import { Bot, CircleCheckBig, CircleX, Link2, Sparkles, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useMonitorStore } from '../../store'
import { nodeProfiles } from '../../simulation/topology'

export function TopologyPanel() {
  const nodes = useMonitorStore((state) => state.networkNodes)
  const links = useMonitorStore((state) => state.networkLinks)
  const selectedNodeId = useMonitorStore((state) => state.selectedNodeId)
  const analysis = useMonitorStore((state) => state.topologyAnalysis)
  const aiAdvice = useMonitorStore((state) => state.topologyAiAdvice)
  const analyze = useMonitorStore((state) => state.analyzeTopology)
  const interpret = useMonitorStore((state) => state.interpretTopology)
  const [interpreting, setInterpreting] = useState(false)
  const selected = nodes.find((node) => node.id === selectedNodeId)
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-violet-300" /><h2 className="font-bold">تحلیل‌گر توپولوژی</h2></div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-slate-950/50 p-2"><b className="block text-base">{nodes.length}</b>تجهیز</div>
        <div className="rounded-lg bg-slate-950/50 p-2"><b className="block text-base">{links.length}</b>لینک</div>
        <div className="rounded-lg bg-slate-950/50 p-2"><b className="block text-base">{nodes.filter((node) => node.kind === 'bts').length}</b>سایت BTS</div>
      </div>
      <div className="mt-3 rounded-lg border border-dashed border-slate-600 p-2 text-xs text-slate-300">
        <Link2 className="ml-1 inline h-4 w-4 text-sky-300" />
        {selected ? `مبدأ اتصال: ${selected.name}. حالا تجهیز دوم را روی نقشه انتخاب کنید.` : 'برای ساخت لینک، روی تجهیز اول و سپس تجهیز دوم در نقشه کلیک کنید.'}
      </div>
      <button onClick={analyze} className="mt-3 w-full rounded-lg bg-violet-500 px-3 py-2 text-sm font-bold text-white hover:bg-violet-400">تحلیل امکان برقراری ارتباط</button>
      {analysis && (
        <div className={`mt-3 rounded-xl border p-3 text-sm ${analysis.feasible ? 'border-emerald-700 bg-emerald-950/30' : 'border-rose-800 bg-rose-950/25'}`}>
          <div className="flex items-center gap-2 font-bold">{analysis.feasible ? <CircleCheckBig className="h-5 w-5 text-emerald-400" /> : <CircleX className="h-5 w-5 text-rose-400" />}{analysis.feasible ? 'قابل برقراری' : 'نیازمند تکمیل' } <span className="mr-auto text-xs">{analysis.score}/100</span></div>
          <p className="mt-2 text-xs leading-5 text-slate-200">{analysis.summary}</p>
          {analysis.issues.slice(0, 4).map((issue, index) => <p key={`${issue.nodeId}-${index}`} className="mt-2 flex gap-1 text-xs leading-5 text-slate-300"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />{issue.message}</p>)}
          {nodes.length > 0 && <p className="mt-3 border-t border-white/10 pt-2 text-[11px] text-slate-400">مدل تجهیزات: {nodes.map((node) => nodeProfiles[node.kind].label).slice(0, 4).join('، ')}{nodes.length > 4 ? '…' : ''}</p>}
        </div>
      )}
      {analysis && <button disabled={interpreting} onClick={async () => { setInterpreting(true); await interpret(); setInterpreting(false) }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-700 px-3 py-2 text-sm text-violet-200 hover:bg-violet-950/40 disabled:opacity-50"><Sparkles className="h-4 w-4" />{interpreting ? 'در حال تفسیر…' : 'تفسیر با ایجنت هوش مصنوعی'}</button>}
      {aiAdvice && <div className="mt-3 whitespace-pre-line rounded-xl border border-violet-900 bg-violet-950/20 p-3 text-xs leading-6 text-slate-200">{aiAdvice}</div>}
    </section>
  )
}
