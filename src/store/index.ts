import { create } from 'zustand'
import { analyzeNetwork } from '../agent/monitor'
import { appEnv } from '../config/env'
import { getActiveDataSource, getTowerData, isLiveDataSource } from '../data/towerDataSource'
import { simulateNetwork } from '../simulation/engine'
import { attachWeather } from '../weather/api'
import type { DataSource, MapTool, MonitorEvent, TowerState } from '../types'

interface MonitorStore {
  towers: TowerState[]
  events: MonitorEvent[]
  selectedTowerId: string | null
  dataSource: DataSource
  loading: boolean
  lastRefresh: string | null
  initialize: () => Promise<void>
  refresh: () => Promise<void>
  selectTower: (towerId: string | null) => void
  addEvent: (event: Omit<MonitorEvent, 'id' | 'timestamp'>) => void
  addMapAsset: (tool: MapTool, lat: number, lng: number) => void
}

let previousTowers = new Map<string, TowerState>()
let monitoringStarted = false
const makeEvent = (event: Omit<MonitorEvent, 'id' | 'timestamp'>): MonitorEvent => ({ ...event, id: crypto.randomUUID(), timestamp: new Date().toISOString() })

const collectTransitions = (current: TowerState[], previous: Map<string, TowerState>) => {
  const events: Array<Omit<MonitorEvent, 'id' | 'timestamp'>> = []
  current.forEach((tower) => {
    const before = previous.get(tower.id)
    if (!before) return
    if (before.isGridPowerActive && !tower.isGridPowerActive) events.push({ type: 'power-outage', towerId: tower.id, message: `قطعی برق در ${tower.name}` })
    if (before.batteryLevel >= 20 && tower.batteryLevel < 20) events.push({ type: 'battery-critical', towerId: tower.id, message: `باتری ${tower.name} به سطح بحرانی رسید` })
    if (before.status === 'online' && tower.status !== 'online') events.push({ type: 'status-change', towerId: tower.id, message: `وضعیت ${tower.name} به ${tower.status === 'offline' ? 'قطع' : 'ناپایدار'} تغییر کرد` })
    if (!before.isGridPowerActive && tower.isGridPowerActive) events.push({ type: 'restored', towerId: tower.id, message: `برق شبکه در ${tower.name} بازگشت` })
  })
  return events
}

export const useMonitorStore = create<MonitorStore>((set, get) => ({
  towers: [], events: [], selectedTowerId: null, dataSource: 'mock', loading: true, lastRefresh: null,
  initialize: async () => {
    await get().refresh()
    if (monitoringStarted) return
    monitoringStarted = true
    window.setInterval(() => void get().refresh(), appEnv.pollIntervalMs)
    window.setInterval(async () => {
      const towers = get().towers
      if (!towers.length) return
      const analysis = await analyzeNetwork(towers, true)
      set((state) => ({ events: [makeEvent({ type: 'summary', message: 'خلاصه دوره‌ای شبکه', analysis }), ...state.events].slice(0, 100) }))
    }, 5 * 60_000)
  },
  refresh: async () => {
    set({ loading: true })
    try {
      const hadPreviousSnapshot = previousTowers.size > 0
      let towers = await getTowerData()
      const source = getActiveDataSource()
      if (!isLiveDataSource(source) && hadPreviousSnapshot) towers = get().towers
      towers = await attachWeather(towers)
      if (!isLiveDataSource(source)) towers = simulateNetwork(towers)
      const transitions = collectTransitions(towers, previousTowers)
      const initialWarnings = !hadPreviousSnapshot ? towers
        .filter((tower) => tower.status !== 'online' || !tower.isGridPowerActive || tower.batteryLevel < 20)
        .map((tower) => ({ type: tower.batteryLevel < 20 ? ('battery-critical' as const) : ('status-change' as const), towerId: tower.id, message: `هشدار اولیه برای ${tower.name}` })) : []
      previousTowers = new Map(towers.map((tower) => [tower.id, tower]))
      const newEvents = [...transitions, ...initialWarnings].map(makeEvent)
      set((state) => ({ towers, dataSource: source, loading: false, lastRefresh: new Date().toISOString(), events: [...newEvents, ...state.events].slice(0, 100) }))
      if (newEvents.some((event) => event.type !== 'restored')) {
        const analysis = await analyzeNetwork(towers)
        set((state) => ({ events: state.events.map((event) => newEvents.some((newEvent) => newEvent.id === event.id) ? { ...event, analysis } : event) }))
      }
    } catch (error) {
      console.error('Unable to refresh tower monitoring data', error)
      set({ loading: false })
    }
  },
  selectTower: (towerId) => set({ selectedTowerId: towerId }),
  addEvent: (event) => set((state) => ({ events: [makeEvent(event), ...state.events].slice(0, 100) })),
  addMapAsset: (tool, lat, lng) => {
    const labels: Record<MapTool, string> = { tower: 'دکل مخابراتی', relay: 'رله رادیویی', fiber: 'گره فیبر نوری' }
    const id = `${tool}-${Date.now()}`
    const name = `${labels[tool]} ${get().towers.length + 1}`
    const tower: TowerState = { id, name, lat, lng, region: 'موقعیت جدید', status: 'online', signalStrength: 92, packetLoss: 0.2, cpuTemp: 42, connectedUsers: 0, bandwidthUsageMbps: 0, weather: { temperature: 24, precipitation: 0, windspeed: 8, weathercode: 0, condition: 'صاف' }, isGridPowerActive: true, batteryLevel: 100, batteryHealth: 100, estimatedRuntimeMinutes: 720, outageStartedAt: null, installedAt: new Date().toISOString(), dataSource: 'mock', lastUpdated: new Date().toISOString() }
    set((state) => ({ towers: [...state.towers, tower], selectedTowerId: id, events: [makeEvent({ type: 'restored', towerId: id, message: `${name} به نقشه افزوده و پایش آن فعال شد` }), ...state.events].slice(0, 100) }))
  },
}))
