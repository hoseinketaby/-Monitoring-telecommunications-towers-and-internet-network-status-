import { appEnv } from '../config/env'
import type { TowerState } from '../types'
import { defaultWeather } from './mockGenerator'

const withTimeout = async (url: string, options: RequestInit, timeout = 3_000) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

const asNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

export function mapTelecomApiToTowerState(raw: Record<string, unknown>): TowerState {
  const timestamp = new Date().toISOString()
  const status = raw.status === 'offline' || raw.status === 'degraded' ? raw.status : 'online'
  return {
    id: String(raw.id ?? raw.tower_id ?? raw.code ?? crypto.randomUUID()),
    name: String(raw.name ?? raw.title ?? 'دکل بدون نام'),
    lat: asNumber(raw.lat ?? raw.latitude, 35.6892),
    lng: asNumber(raw.lng ?? raw.longitude, 51.389),
    region: String(raw.region ?? raw.city ?? 'نامشخص'),
    status,
    signalStrength: Math.max(0, Math.min(100, asNumber(raw.signalStrength ?? raw.signal, 80))),
    packetLoss: Math.max(0, asNumber(raw.packetLoss ?? raw.packet_loss, 0)),
    cpuTemp: asNumber(raw.cpuTemp ?? raw.cpu_temp, 30),
    connectedUsers: Math.max(0, asNumber(raw.connectedUsers ?? raw.users, 0)),
    bandwidthUsageMbps: Math.max(0, asNumber(raw.bandwidthUsageMbps ?? raw.bandwidth, 0)),
    weather: defaultWeather,
    isGridPowerActive: raw.isGridPowerActive ?? raw.grid_power ?? true ? true : false,
    batteryLevel: Math.max(0, Math.min(100, asNumber(raw.batteryLevel ?? raw.battery_level, 100))),
    batteryHealth: Math.max(0, Math.min(100, asNumber(raw.batteryHealth ?? raw.battery_health, 100))),
    estimatedRuntimeMinutes: asNumber(raw.estimatedRuntimeMinutes ?? raw.runtime_minutes, 0) || null,
    outageStartedAt: typeof raw.outageStartedAt === 'string' ? raw.outageStartedAt : null,
    installedAt: typeof raw.installedAt === 'string' ? raw.installedAt : timestamp,
    dataSource: 'telecom-api',
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : timestamp,
  }
}

export async function getTelecomApiTowers(): Promise<TowerState[]> {
  if (!appEnv.telecomApiUrl) throw new Error('Telecom API is not configured')
  const response = await withTimeout(appEnv.telecomApiUrl, {
    headers: appEnv.telecomApiKey ? { Authorization: `Bearer ${appEnv.telecomApiKey}` } : {},
  })
  if (!response.ok) throw new Error(`Telecom API error: ${response.status}`)
  const payload: unknown = await response.json()
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { towers?: unknown[] }).towers)
      ? (payload as { towers: unknown[] }).towers
      : []
  if (rows.length === 0) throw new Error('Telecom API returned no towers')
  return rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object')).map(mapTelecomApiToTowerState)
}
