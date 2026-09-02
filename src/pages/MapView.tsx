import { AgentFeed } from '../components/AgentFeed'
import { TowerMap } from '../components/Map'
import { TopologyPanel } from '../components/Map/TopologyPanel'
import { Toolbox } from '../components/Map/Toolbox'
import { MapAssetList } from '../components/Map/MapAssetList'

export function MapView() {
  return <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><div className="space-y-4"><TowerMap showDropHint /><MapAssetList /></div><aside className="space-y-4"><Toolbox /><TopologyPanel /><AgentFeed /></aside></div>
}
