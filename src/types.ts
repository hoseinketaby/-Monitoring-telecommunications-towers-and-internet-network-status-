export type TowerStatus = 'online' | 'degraded' | 'offline'
export type DataSource = 'telecom-api' | 'database' | 'json-seed' | 'mock'
export type MapTool = 'tower' | 'relay' | 'fiber'

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
