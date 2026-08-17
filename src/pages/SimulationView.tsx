import { Box, MousePointer2 } from 'lucide-react'
import { TowerSimulation } from '../components/TowerSimulation'
import { useMonitorStore } from '../store'
import type { MapTool, TowerState } from '../types'

const toolNames: Record<MapTool, string> = {
  tower: 'دکل مخابراتی',
  bts: 'سایت BTS / 4G-5G',
  microwave: 'رادیو مایکروویو',
  fiber: 'گره فیبر نوری',
  router: 'روتر انتقال IP',
  core: 'هسته شبکه EPC / 5GC',
  power: 'برق و ژنراتور',
}

const toolMetrics: Record<MapTool, Pick<TowerState, 'signalStrength' | 'bandwidthUsageMbps' | 'batteryLevel' | 'isGridPowerActive'>> = {
  tower: { signalStrength: 86, bandwidthUsageMbps: 430, batteryLevel: 88, isGridPowerActive: true },
  bts: { signalStrength: 92, bandwidthUsageMbps: 560, batteryLevel: 91, isGridPowerActive: true },
  microwave: { signalStrength: 82, bandwidthUsageMbps: 760, batteryLevel: 78, isGridPowerActive: true },
  fiber: { signalStrength: 99, bandwidthUsageMbps: 1800, batteryLevel: 100, isGridPowerActive: true },
  router: { signalStrength: 96, bandwidthUsageMbps: 1200, batteryLevel: 94, isGridPowerActive: true },
  core: { signalStrength: 99, bandwidthUsageMbps: 4500, batteryLevel: 100, isGridPowerActive: true },
  power: { signalStrength: 100, bandwidthUsageMbps: 0, batteryLevel: 74, isGridPowerActive: false },
}

export function SimulationView() {
  const towers = useMonitorStore((state) => state.towers)
  const target = useMonitorStore((state) => state.simulationTarget)
  const baseTower = towers[0]

  if (!target || !baseTower) {
    return (
      <section dir="rtl" className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-panel p-8 text-center">
        <Box className="mb-3 h-10 w-10 text-cyan-300" />
        <h1 className="text-xl font-bold">شبیه‌ساز ابزار</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">از نقشه یک دکل را انتخاب کنید یا در بخش «طراحی تجهیزات» روی ابزار دلخواه کلیک کنید تا در این تب شبیه‌سازی شود.</p>
      </section>
    )
  }

  const tower = target.type === 'tower'
    ? towers.find((item) => item.id === target.towerId) ?? baseTower
    : {
        ...baseTower,
        ...toolMetrics[target.tool],
        id: `simulation-${target.tool}`,
        name: `شبیه‌سازی ${toolNames[target.tool]}`,
        region: 'محیط آزمایشی',
        connectedUsers: target.tool === 'core' ? 42_000 : target.tool === 'bts' ? 1_800 : baseTower.connectedUsers,
      }

  return (
    <div className="space-y-3">
      <div dir="rtl" className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-50">
        <MousePointer2 className="h-4 w-4 text-cyan-300" />
        {target.type === 'tool' ? `در حال شبیه‌سازی: ${toolNames[target.tool]}` : `در حال شبیه‌سازی دکل: ${tower.name}`}
      </div>
      <TowerSimulation tower={tower} assetKind={target.type === 'tool' ? target.tool : 'tower'} embedded />
    </div>
  )
}
