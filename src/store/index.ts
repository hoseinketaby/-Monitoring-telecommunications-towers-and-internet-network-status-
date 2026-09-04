import { create } from 'zustand'
import { analyzeNetwork } from '../agent/monitor'
import { generateTopologyWithAi, interpretTopologyWithAi } from '../agent/topology'
import { appEnv } from '../config/env'
import { fetchHistory, postHistorySnapshot, saveTelegramAutoAlerts, sendTelegramAlert } from '../data/historyClient'
import { getActiveDataSource, getTowerData, isLiveDataSource } from '../data/towerDataSource'
import { simulateNetwork } from '../simulation/engine'
import { analyzeTopology, distanceKm, nodeProfiles, suggestedMedium, validateLink } from '../simulation/topology'
import { attachWeather } from '../weather/api'
import type { AppPage, DataSource, MapTool, MonitorEvent, NetworkLink, NetworkLog, NetworkNode, SimulationTarget, TowerState, TopologyAnalysis } from '../types'
import type { HistorySnapshot } from '../utils/prediction'

interface MonitorStore {
  towers: TowerState[]
  events: MonitorEvent[]
  networkLogs: NetworkLog[]
  selectedTowerId: string | null
  activePage: AppPage
  simulationTarget: SimulationTarget | null
  dataSource: DataSource
  loading: boolean
  lastRefresh: string | null
  networkNodes: NetworkNode[]
  networkLinks: NetworkLink[]
  selectedNodeId: string | null
  topologyAnalysis: TopologyAnalysis | null
  topologyAiAdvice: string | null
  history: HistorySnapshot[]
  telegramAutoAlerts: boolean
  refreshIntervalMs: number
  autoRefreshEnabled: boolean
  dashboardQuery: string
  setDashboardQuery: (query: string) => void
  setRefreshIntervalMs: (value: number) => void
  setAutoRefreshEnabled: (enabled: boolean) => void
  initialize: () => Promise<void>
  refresh: () => Promise<void>
  selectTower: (towerId: string | null) => void
  setActivePage: (page: AppPage) => void
  openTowerSimulation: (towerId: string) => void
  openToolSimulation: (tool: MapTool) => void
  openNodeSimulation: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void
  addEvent: (event: Omit<MonitorEvent, 'id' | 'timestamp'>) => void
  addNetworkLog: (log: Omit<NetworkLog, 'id' | 'timestamp'>) => void
  clearNetworkLogs: () => void
  addMapAsset: (tool: MapTool, lat: number, lng: number) => void
  updateMapAssetPosition: (nodeId: string, lat: number, lng: number) => void
  removeMapAsset: (nodeId: string) => void
  connectNodes: (fromId: string, toId: string) => { ok: boolean; message: string }
  analyzeTopology: () => TopologyAnalysis
  interpretTopology: () => Promise<void>
  generateTopology: (prompt: string) => Promise<void>
  setTelegramAutoAlerts: (enabled: boolean) => Promise<void>
  loadHistory: () => Promise<void>
}

let previousTowers = new Map<string, TowerState>()
let monitoringStarted = false
const makeEvent = (event: Omit<MonitorEvent, 'id' | 'timestamp'>): MonitorEvent => ({ ...event, id: crypto.randomUUID(), timestamp: new Date().toISOString() })

const summarizeTowers = (towers: TowerState[]) => ({
  total: towers.length,
  online: towers.filter((tower) => tower.status === 'online').length,
  degraded: towers.filter((tower) => tower.status === 'degraded').length,
  offline: towers.filter((tower) => tower.status === 'offline').length,
  gridOutages: towers.filter((tower) => !tower.isGridPowerActive).length,
  avgBattery: Math.round(towers.reduce((sum, tower) => sum + tower.batteryLevel, 0) / Math.max(1, towers.length)),
  avgSignal: Math.round(towers.reduce((sum, tower) => sum + tower.signalStrength, 0) / Math.max(1, towers.length)),
})

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
  towers: [], events: [], networkLogs: [], selectedTowerId: null, activePage: 'dashboard', simulationTarget: null, dataSource: 'mock', loading: true, lastRefresh: null,
  networkNodes: [], networkLinks: [], selectedNodeId: null, topologyAnalysis: null, topologyAiAdvice: null,
  history: [], telegramAutoAlerts: false,
  refreshIntervalMs: appEnv.pollIntervalMs,
  autoRefreshEnabled: true,
  dashboardQuery: '',
  setDashboardQuery: (query) => set({ dashboardQuery: query }),
  setRefreshIntervalMs: (value) => set({ refreshIntervalMs: Math.max(5_000, Math.round(value)) }),
  setAutoRefreshEnabled: (enabled) => set({ autoRefreshEnabled: enabled }),
  initialize: async () => {
    await get().refresh()
    void get().loadHistory()
    if (monitoringStarted) return
    monitoringStarted = true
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
      set((state) => ({
        towers, dataSource: source, loading: false, lastRefresh: new Date().toISOString(),
        events: [...newEvents, ...state.events].slice(0, 100),
        networkLogs: [
          ...newEvents.map((event) => ({ id: event.id, timestamp: event.timestamp, level: event.type === 'battery-critical' || event.type === 'power-outage' ? 'warning' as const : 'info' as const, source: 'monitor', message: event.message })),
          ...state.networkLogs,
        ].slice(0, 300),
      }))
      if (newEvents.length) {
        void postHistorySnapshot(towers)
        const alertEvents = newEvents.filter((event) => event.type === 'power-outage' || event.type === 'battery-critical' || event.type === 'status-change')
        const alertMessage = alertEvents.map((event) => `• ${event.message}`).join('\n')
        if (alertMessage && get().telegramAutoAlerts) {
          void sendTelegramAlert(alertMessage).catch(() => undefined)
        }
        set((state) => ({ history: [...state.history, { timestamp: new Date().toISOString(), summary: summarizeTowers(towers), towers: towers.map((tower) => ({ id: tower.id, name: tower.name, status: tower.status, batteryLevel: Math.round(tower.batteryLevel), isGridPowerActive: tower.isGridPowerActive })) }].slice(-200) }))
      }
      if (newEvents.some((event) => event.type !== 'restored')) {
        const analysis = await analyzeNetwork(towers)
        set((state) => ({ events: state.events.map((event) => newEvents.some((newEvent) => newEvent.id === event.id) ? { ...event, analysis } : event) }))
      }
    } catch (error) {
      console.error('Unable to refresh tower monitoring data', error)
      set({ loading: false })
    }
  },
  selectTower: (towerId) => set({ selectedTowerId: towerId, selectedNodeId: null }),
  setActivePage: (page) => set({ activePage: page }),
  openTowerSimulation: (towerId) => set({ simulationTarget: { type: 'tower', towerId }, activePage: 'simulation' }),
  openToolSimulation: (tool) => set({ simulationTarget: { type: 'tool', tool }, activePage: 'simulation' }),
  openNodeSimulation: (nodeId) => set({ simulationTarget: { type: 'node', nodeId }, activePage: 'simulation' }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedTowerId: null }),
  addEvent: (event) => set((state) => ({ events: [makeEvent(event), ...state.events].slice(0, 100) })),
  addNetworkLog: (log) => set((state) => ({ networkLogs: [{ ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...state.networkLogs].slice(0, 300) })),
  clearNetworkLogs: () => set({ networkLogs: [] }),
  addMapAsset: (tool, lat, lng) => {
    const profile = nodeProfiles[tool]
    const node: NetworkNode = {
      id: `${tool}-${Date.now()}`,
      name: `${profile.label} ${get().networkNodes.length + 1}`,
      kind: tool, lat, lng, capacityMbps: profile.capacityMbps, status: 'online', createdAt: new Date().toISOString(),
    }
    set((state) => ({ networkNodes: [...state.networkNodes, node], selectedNodeId: node.id, topologyAnalysis: null, topologyAiAdvice: null }))
  },
  updateMapAssetPosition: (nodeId, lat, lng) => set((state) => ({
    towers: state.towers.map((tower) => tower.id === nodeId ? { ...tower, lat, lng } : tower),
    networkNodes: state.networkNodes.map((node) => node.id === nodeId ? { ...node, lat, lng } : node),
    topologyAnalysis: null,
    topologyAiAdvice: null,
  })),
  removeMapAsset: (nodeId) => set((state) => ({
    towers: state.towers.filter((tower) => tower.id !== nodeId),
    networkNodes: state.networkNodes.filter((node) => node.id !== nodeId),
    networkLinks: state.networkLinks.filter((link) => link.fromId !== nodeId && link.toId !== nodeId),
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    topologyAnalysis: null,
    topologyAiAdvice: null,
  })),
  connectNodes: (fromId, toId) => {
    const { networkNodes, networkLinks } = get()
    const from = networkNodes.find((node) => node.id === fromId)
    const to = networkNodes.find((node) => node.id === toId)
    if (!from || !to) return { ok: false, message: 'هر دو تجهیز را روی نقشه انتخاب کنید.' }
    if (networkLinks.some((link) => (link.fromId === fromId && link.toId === toId) || (link.fromId === toId && link.toId === fromId))) return { ok: false, message: 'این دو تجهیز از قبل متصل هستند.' }
    const medium = suggestedMedium(from, to)
    const validation = validateLink(from, to, medium)
    if (!validation.valid) return { ok: false, message: validation.reason }
    const link: NetworkLink = {
      id: `link-${Date.now()}`, fromId, toId, medium, distanceKm: Math.round(distanceKm(from, to) * 100) / 100,
      capacityMbps: Math.min(from.capacityMbps, to.capacityMbps), status: 'active',
    }
    set((state) => ({ networkLinks: [...state.networkLinks, link], selectedNodeId: null, topologyAnalysis: null, topologyAiAdvice: null }))
    return { ok: true, message: `لینک ${medium === 'fiber' ? 'فیبر' : medium === 'microwave' ? 'مایکروویو' : 'اترنت'} برقرار شد.` }
  },
  analyzeTopology: () => {
    const result = analyzeTopology(get().networkNodes, get().networkLinks)
    set({ topologyAnalysis: result, topologyAiAdvice: null })
    return result
  },
  interpretTopology: async () => {
    const result = get().topologyAnalysis || get().analyzeTopology()
    const advice = await interpretTopologyWithAi(get().networkNodes, get().networkLinks, result)
    set({ topologyAiAdvice: advice })
  },
  generateTopology: async (prompt) => {
    const text = prompt.trim()
    if (!text) throw new Error('لطفاً نیازمندی توپولوژی را بنویسید.')
    const result = await generateTopologyWithAi(text)
    const analysis = analyzeTopology(result.nodes, result.links)
    const actionSummary = [
      'چیدمان هوشمند برای درخواست شما ایجاد شد.',
      `تعداد ${result.nodes.length} عنصر روی نقشه قرار گرفت.`,
      `${result.links.length} مسیر ارتباطی بین عناصر ساخته شد.`,
      `مدار برق با ${result.nodes.filter((node) => node.kind === 'power').length} منبع برق روی نقشه نمایش داده شد.`,
    ].join('\n')
    set({
      networkNodes: result.nodes,
      networkLinks: result.links,
      selectedNodeId: null,
      topologyAnalysis: analysis,
      topologyAiAdvice: actionSummary,
    })
    get().addEvent({ type: 'summary', message: 'گزارش اجرای چیدمان هوشمند روی نقشه', analysis: actionSummary })
  },
  setTelegramAutoAlerts: async (enabled) => {
    set({ telegramAutoAlerts: enabled })
    try {
      const status = await saveTelegramAutoAlerts(enabled)
      set({ telegramAutoAlerts: status.autoAlerts })
    } catch (error) {
      console.error('Unable to update Telegram auto alerts', error)
    }
  },
  loadHistory: async () => {
    try {
      const snapshots = await fetchHistory()
      set({ history: snapshots.slice(-200) })
    } catch (error) {
      console.error('Unable to load tower history', error)
    }
  },
}))
