export type TowerStatus = 'online' | 'degraded' | 'offline'
export type DataSource = 'telecom-api' | 'database' | 'json-seed' | 'mock'
export type MapTool = 'tower' | 'bts' | 'microwave' | 'fiber' | 'router' | 'core' | 'power'
export type NetworkNodeKind = MapTool
export type LinkMedium = 'fiber' | 'microwave' | 'ethernet'
export type AppPage = 'dashboard' | 'map' | 'simulation'
export type SimulationTarget =
  | { type: 'tower'; towerId: string }
  | { type: 'tool'; tool: MapTool }

export interface NetworkNode {
  id: string
  name: string
  kind: NetworkNodeKind
  lat: number
  lng: number
  capacityMbps: number
  status: TowerStatus
  createdAt: string
}

export interface NetworkLink {
  id: string
  fromId: string
  toId: string
  medium: LinkMedium
  distanceKm: number
  capacityMbps: number
  status: 'active' | 'blocked'
}

export interface TopologyIssue {
  severity: 'critical' | 'warning' | 'info'
  message: string
  nodeId?: string
}

export interface TopologyAnalysis {
  feasible: boolean
  score: number
  summary: string
  reachableNodeIds: string[]
  isolatedNodeIds: string[]
  issues: TopologyIssue[]
}

export interface WeatherData {
  temperature: number
  precipitation: number
  windspeed: number
  weathercode: number
  condition: string
}

export interface TowerState {
  id: string
  name: string
  lat: number
  lng: number
  region: string
  status: TowerStatus
  signalStrength: number
  packetLoss: number
  cpuTemp: number
  connectedUsers: number
  bandwidthUsageMbps: number
  weather: WeatherData
  isGridPowerActive: boolean
  batteryLevel: number
  batteryHealth: number
  estimatedRuntimeMinutes: number | null
  outageStartedAt: string | null
  installedAt: string
  dataSource: DataSource
  lastUpdated: string
}

export type MonitorEventType =
  | 'power-outage'
  | 'battery-critical'
  | 'weather'
  | 'status-change'
  | 'restored'
  | 'summary'

export interface MonitorEvent {
  id: string
  type: MonitorEventType
  towerId?: string
  timestamp: string
  message: string
  analysis?: string
}
