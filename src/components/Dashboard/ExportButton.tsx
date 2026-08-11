import Papa from 'papaparse'
import { Download } from 'lucide-react'
import type { TowerState } from '../../types'

export function ExportButton({ towers }: { towers: TowerState[] }) {
  const exportCsv = () => {
    const csv = Papa.unparse(towers.map((tower) => ({
      id: tower.id, name: tower.name, region: tower.region, status: tower.status,
      signalStrength: tower.signalStrength, packetLoss: tower.packetLoss,
      gridPower: tower.isGridPowerActive ? 'active' : 'battery',
      batteryLevel: tower.batteryLevel, batteryHealth: tower.batteryHealth, lastUpdated: tower.lastUpdated,
    })))
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tower-status-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return <div className="flex gap-2"><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"><Download className="h-4 w-4" /> خروجی CSV</button><button onClick={() => window.print()} className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-slate-800">چاپ / PDF</button></div>
}
