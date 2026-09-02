import { useMemo, useState, type FormEvent } from 'react'
import { Activity, CheckCircle2, CircleSlash2, Clipboard, Download, Eraser, Play, Terminal, TriangleAlert } from 'lucide-react'
import { useMonitorStore } from '../store'
import type { NetworkLogLevel } from '../types'

const levelConfig: Record<NetworkLogLevel, { label: string; color: string; icon: typeof Activity }> = {
  info: { label: 'INFO', color: 'text-sky-300', icon: Activity },
  success: { label: 'OK', color: 'text-emerald-300', icon: CheckCircle2 },
  warning: { label: 'WARN', color: 'text-amber-300', icon: TriangleAlert },
  error: { label: 'ERROR', color: 'text-rose-300', icon: CircleSlash2 },
}

export function NetworkLogs() {
  const logs = useMonitorStore((state) => state.networkLogs)
  const nodes = useMonitorStore((state) => state.networkNodes)
  const links = useMonitorStore((state) => state.networkLinks)
  const addAsset = useMonitorStore((state) => state.addMapAsset)
  const connect = useMonitorStore((state) => state.connectNodes)
  const addLog = useMonitorStore((state) => state.addNetworkLog)
  const clearLogs = useMonitorStore((state) => state.clearNetworkLogs)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<'all' | NetworkLogLevel>('all')
  const [command, setCommand] = useState('')
  const [terminalLines, setTerminalLines] = useState<string[]>([
    'Network Console v1.0 — type "help" for available commands.',
  ])

  const filtered = useMemo(() => logs.filter((log) =>
    (level === 'all' || log.level === level) &&
    (!query.trim() || `${log.source} ${log.message}`.toLowerCase().includes(query.toLowerCase())),
  ), [logs, level, query])

  const runCommand = (event: FormEvent) => {
    event.preventDefault()
    const raw = command.trim()
    if (!raw) return
    const [verb, ...args] = raw.split(/\s+/)
    const output: string[] = [`> ${raw}`]
    if (verb === 'help') {
      output.push('status | nodes | links | add <tower|bts|microwave|fiber|router|core|power> | connect <node-a> <node-b> | clear')
    } else if (verb === 'status') {
      output.push(`nodes=${nodes.length} links=${links.length} online=${nodes.filter((node) => node.status === 'online').length}`)
    } else if (verb === 'nodes') {
      output.push(...(nodes.length ? nodes.map((node) => `${node.id.padEnd(24)} ${node.kind.padEnd(10)} ${node.status}`) : ['No network nodes configured.']))
    } else if (verb === 'links') {
      output.push(...(links.length ? links.map((link) => `${link.fromId} <-> ${link.toId}  ${link.medium}  ${link.capacityMbps} Mbps`) : ['No links configured.']))
    } else if (verb === 'add' && args[0] && ['tower', 'bts', 'microwave', 'fiber', 'router', 'core', 'power'].includes(args[0])) {
      const kind = args[0] as Parameters<typeof addAsset>[0]
      addAsset(kind, 35.7 + Math.random() * 0.08, 51.35 + Math.random() * 0.08)
      output.push(`Added ${kind} node.`)
      addLog({ level: 'success', source: 'terminal', message: `Added ${kind} node from network console` })
    } else if (verb === 'connect' && args[0] && args[1]) {
      const result = connect(args[0], args[1])
      output.push(result.message)
      addLog({ level: result.ok ? 'success' : 'error', source: 'terminal', message: result.message })
    } else if (verb === 'clear') {
      clearLogs()
      output.push('Network logs cleared.')
    } else {
      output.push(`Unknown command: ${verb}. Type "help".`)
    }
    setTerminalLines((lines) => [...lines, ...output].slice(-80))
    setCommand('')
  }

  const exportLogs = () => {
    const text = filtered.map((log) => `${log.timestamp}\t${log.level}\t${log.source}\t${log.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'network-logs.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="network-logs-page" dir="rtl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[.2em] text-cyan-300">NETWORK OBSERVABILITY</p><h2 className="mt-1 text-2xl font-bold">لاگ شبکه و کنسول پیکربندی</h2><p className="mt-1 text-sm text-slate-400">رویدادهای مانیتورینگ را ببینید و توپولوژی را با ترمینال مدیریت کنید.</p></div>
        <div className="flex gap-2"><button onClick={exportLogs} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-slate-800"><Download className="h-4 w-4" />خروجی</button><button onClick={clearLogs} className="inline-flex items-center gap-2 rounded-lg border border-rose-900/60 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/40"><Eraser className="h-4 w-4" />پاک‌سازی</button></div>
      </div>
      <div className="network-logs-layout">
        <div className="rounded-xl border border-line bg-panel">
          <div className="flex flex-wrap gap-2 border-b border-line p-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو در لاگ‌ها..." className="min-w-[200px] flex-1 rounded-lg border border-line bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-500" /><select value={level} onChange={(event) => setLevel(event.target.value as typeof level)} className="rounded-lg border border-line bg-slate-950 px-3 py-2 text-sm"><option value="all">همه سطوح</option><option value="info">INFO</option><option value="success">OK</option><option value="warning">WARN</option><option value="error">ERROR</option></select></div>
          <div className="max-h-[560px] overflow-auto font-mono text-xs" dir="ltr">{filtered.length ? filtered.map((log) => { const config = levelConfig[log.level]; const Icon = config.icon; return <div key={log.id} className="flex gap-3 border-b border-slate-800/70 px-3 py-3"><span className="shrink-0 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span><span className={`inline-flex w-14 items-center gap-1 ${config.color}`}><Icon className="h-3.5 w-3.5" />{config.label}</span><span className="shrink-0 text-cyan-400">[{log.source}]</span><span className="text-slate-300">{log.message}</span></div> }) : <div className="p-8 text-center text-slate-500">لاگی برای نمایش وجود ندارد.</div>}</div>
        </div>
        <div className="network-terminal rounded-xl border border-cyan-900/60 bg-[#060b12]"><div className="flex items-center justify-between border-b border-cyan-900/60 px-4 py-3"><span className="inline-flex items-center gap-2 text-sm text-cyan-200"><Terminal className="h-4 w-4" />Network Console</span><span className="flex items-center gap-1 text-xs text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />connected</span></div><div className="min-h-[420px] max-h-[560px] overflow-auto p-4 font-mono text-xs leading-6 text-slate-300" dir="ltr">{terminalLines.map((line, index) => <div key={`${line}-${index}`} className={line.startsWith('>') ? 'text-cyan-300' : ''}>{line}</div>)}</div><form onSubmit={runCommand} className="flex items-center gap-2 border-t border-cyan-900/60 p-3" dir="ltr"><span className="text-cyan-400">$</span><input autoFocus value={command} onChange={(event) => setCommand(event.target.value)} placeholder="type a command..." className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white outline-none" /><button className="rounded-md bg-cyan-700 p-2 text-white hover:bg-cyan-600" title="Run command"><Play className="h-4 w-4" /></button></form></div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Clipboard className="h-3.5 w-3.5" />دستورهای تغییر توپولوژی از طریق store محلی اجرا می‌شوند و در لاگ ثبت خواهند شد.</div>
    </section>
  )
}
