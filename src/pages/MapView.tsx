import { AgentFeed } from '../components/AgentFeed'
import { TowerMap } from '../components/Map'
import { Toolbox } from '../components/Map/Toolbox'

export function MapView() {
  return <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><TowerMap showDropHint /><aside className="space-y-4"><Toolbox /><AgentFeed /></aside></div>
}
