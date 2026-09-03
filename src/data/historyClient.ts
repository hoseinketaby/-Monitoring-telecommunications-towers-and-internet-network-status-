import type { TowerState } from '../types'
import type { HistorySnapshot } from '../utils/prediction'

export interface TelegramStatus {
  connected: boolean
  autoAlerts: boolean
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((payload as { error?: string }).error || `Request to ${url} failed`)
  return payload as T
}

export async function fetchTelegramStatus(): Promise<TelegramStatus> {
  const response = await fetch('/api/admin/telegram/config')
  if (!response.ok) return { connected: false, autoAlerts: false }
  return response.json()
}

export async function saveTelegramAutoAlerts(autoAlerts: boolean): Promise<TelegramStatus> {
  return postJson<TelegramStatus>('/api/admin/telegram/config', { autoAlerts })
}

export async function sendTelegramAlert(message: string): Promise<{ ok: boolean; skipped: boolean }> {
  return postJson<{ ok: boolean; skipped: boolean }>('/api/admin/telegram/alert', { message })
}

export async function postHistorySnapshot(towers: TowerState[]): Promise<void> {
  await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timestamp: new Date().toISOString(), towers }),
  }).catch(() => undefined)
}

export async function fetchHistory(): Promise<HistorySnapshot[]> {
  const response = await fetch('/api/history')
  if (!response.ok) return []
  const payload = await response.json() as { snapshots?: HistorySnapshot[] }
  return Array.isArray(payload.snapshots) ? payload.snapshots : []
}
