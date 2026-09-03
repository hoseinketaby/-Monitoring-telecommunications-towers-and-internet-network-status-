import { useMonitorStore } from '../../store'
import type { TowerState } from '../../types'
import { useI18n } from '../../i18n'
import { PowerBadge } from '../PowerBadge'

const riskScore = (tower: TowerState) => (tower.status === 'offline' ? 100 : tower.status === 'degraded' ? 50 : 0) + (tower.isGridPowerActive ? 0 : 25) + (100 - tower.batteryLevel) * 0.4 + tower.weather.windspeed * 0.3 + tower.weather.precipitation
const statusLabel = { online: { fa: 'فعال', en: 'Online' }, degraded: { fa: 'ناپایدار', en: 'Degraded' }, offline: { fa: 'قطع', en: 'Offline' } }

export function RiskTable({ towers }: { towers: TowerState[] }) {
  const selectTower = useMonitorStore((state) => state.selectTower)
  const { language, t } = useI18n()
  const sorted = [...towers].sort((a, b) => riskScore(b) - riskScore(a)).slice(0, 8)
  return <section className="rounded-2xl border border-line bg-panel p-4"><h2 className="mb-4 font-bold">{t('riskyTowers')}</h2><div className="overflow-auto"><table className="w-full text-right text-sm"><thead className="text-slate-400"><tr><th className="pb-3">{t('tower')}</th><th>{t('status')}</th><th>{t('power')}</th><th>{t('battery')}</th><th>{t('risk')}</th></tr></thead><tbody>{sorted.map((tower) => <tr key={tower.id} onClick={() => selectTower(tower.id)} className="cursor-pointer border-t border-line hover:bg-slate-800/40"><td className="py-3">{tower.name}</td><td>{statusLabel[tower.status][language]}</td><td><PowerBadge tower={tower} /></td><td>{Math.round(tower.batteryLevel)}%</td><td className="text-amber-300">{Math.round(riskScore(tower))}</td></tr>)}</tbody></table></div></section>
}
