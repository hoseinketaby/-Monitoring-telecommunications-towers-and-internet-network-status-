import { MapPin, Trash2 } from 'lucide-react'
import { useMonitorStore } from '../../store'
import { analyzeTopology, distanceKm, nodeProfiles } from '../../simulation/topology'

export function MapAssetList() {
  const towers = useMonitorStore((state) => state.towers)
  const nodes = useMonitorStore((state) => state.networkNodes)
  const removeMapAsset = useMonitorStore((state) => state.removeMapAsset)
  const selectTower = useMonitorStore((state) => state.selectTower)
  const selectNode = useMonitorStore((state) => state.selectNode)
  const links = useMonitorStore((state) => state.networkLinks)
  const topology = analyzeTopology(nodes, links)
  const btsNodes = nodes.filter((node) => node.kind === 'bts')
  const uncoveredTowers = towers.filter((tower) => !btsNodes.some((bts) => distanceKm(tower, bts) <= 8))
  const unreachableBts = btsNodes.filter((node) => topology.isolatedNodeIds.includes(node.id))

  return (
    <section dir="rtl" className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">عناصر روی نقشه</h2>
          <p className="mt-1 text-xs text-slate-400">دکل‌ها و تجهیزاتی که روی نقشه قرار دارند</p>
        </div>
        <span className="rounded-full bg-cyan-950/60 px-3 py-1 text-xs font-bold text-cyan-200">{towers.length + nodes.length} عنصر</span>
      </div>
      <div className={`mt-4 rounded-xl border p-3 ${uncoveredTowers.length || unreachableBts.length ? 'border-amber-700/70 bg-amber-950/20' : 'border-emerald-700/70 bg-emerald-950/20'}`}>
        <div className="flex items-center justify-between gap-2"><h3 className="font-bold">بررسی مناطق خارج از تیررس شبکه</h3><span className="text-xs text-slate-300">{uncoveredTowers.length + unreachableBts.length} مورد</span></div>
        <p className="mt-1 text-xs leading-5 text-slate-300">پوشش BTS تا شعاع ۸ کیلومتر و مسیر فعال تا هسته بررسی می‌شود؛ با افزودن، جابه‌جایی یا حذف هر عنصر، این گزارش خودکار به‌روزرسانی می‌شود.</p>
        {!uncoveredTowers.length && !unreachableBts.length && <p className="mt-2 text-xs text-emerald-300">همه دکل‌ها و سایت‌های دسترسی در تیررس شبکه هستند.</p>}
        {uncoveredTowers.map((tower) => <p key={tower.id} className="mt-2 text-xs text-amber-200">• {tower.name}: هیچ سایت BTS در شعاع پوشش قرار ندارد.</p>)}
        {unreachableBts.map((node) => <p key={node.id} className="mt-2 text-xs text-amber-200">• {node.name}: مسیر فعالی تا هسته شبکه ندارد.</p>)}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-right text-xs">
          <thead className="border-b border-line text-slate-400">
            <tr>
              <th className="px-3 py-2">نام</th><th className="px-3 py-2">نوع</th><th className="px-3 py-2">وضعیت</th><th className="px-3 py-2">مختصات</th><th className="px-3 py-2">جزئیات</th><th className="px-3 py-2">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {towers.map((tower) => (
              <tr key={tower.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-3 font-medium">{tower.name}</td><td className="px-3 py-3">دکل مخابراتی</td><td className="px-3 py-3">{tower.status}</td>
                <td className="px-3 py-3 font-mono" dir="ltr">{tower.lat.toFixed(5)}, {tower.lng.toFixed(5)}</td><td className="px-3 py-3">{tower.region} · باتری {Math.round(tower.batteryLevel)}٪</td>
                <td className="px-3 py-3"><button type="button" onClick={() => selectTower(tower.id)} className="ml-2 text-cyan-300 hover:text-cyan-100">نمایش</button><button type="button" onClick={() => removeMapAsset(tower.id)} className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-100"><Trash2 className="h-3.5 w-3.5" />حذف</button></td>
              </tr>
            ))}
            {nodes.map((node) => (
              <tr key={node.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-3 py-3 font-medium">{node.name}</td><td className="px-3 py-3">{nodeProfiles[node.kind].label}</td><td className="px-3 py-3">{node.status}</td>
                <td className="px-3 py-3 font-mono" dir="ltr">{node.lat.toFixed(5)}, {node.lng.toFixed(5)}</td><td className="px-3 py-3">ظرفیت {node.capacityMbps.toLocaleString('fa-IR')} Mbps · ایجاد {new Date(node.createdAt).toLocaleDateString('fa-IR')}</td>
                <td className="px-3 py-3"><button type="button" onClick={() => selectNode(node.id)} className="ml-2 text-cyan-300 hover:text-cyan-100">نمایش</button><button type="button" onClick={() => removeMapAsset(node.id)} className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-100"><Trash2 className="h-3.5 w-3.5" />حذف</button></td>
              </tr>
            ))}
            {!towers.length && !nodes.length && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400"><MapPin className="mx-auto mb-2 h-5 w-5" />هنوز عنصری روی نقشه وجود ندارد.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
