import type { TowerState } from '../types'

export interface HistorySnapshot {
  timestamp: string
  summary: {
    total: number
    online: number
    degraded: number
    offline: number
    gridOutages: number
    avgBattery: number
    avgSignal: number
  }
  towers: Array<{ id: string; name: string; status: string; batteryLevel: number; isGridPowerActive: boolean }>
}

export interface BatteryPrediction {
  drainPerHour: number | null
  minutesToCritical: number | null
  risk: 'critical' | 'warning' | 'stable' | 'unknown'
  label: string
}

export const CRITICAL_BATTERY = 20

/** Least-squares slope of battery level over time, in percent per hour. */
export function batteryDrainRate(samples: Array<{ timestamp: string; batteryLevel: number }>): number | null {
  const points = samples
    .map((sample) => ({ t: new Date(sample.timestamp).getTime(), y: sample.batteryLevel }))
    .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.y))
    .sort((a, b) => a.t - b.t)
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]
  if (last.t === first.t) return null
  const hourSpan = (last.t - first.t) / 3_600_000
  if (hourSpan < 0.05) return null
  const meanT = points.reduce((sum, point) => sum + point.t, 0) / points.length
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length
  let numerator = 0
  let denominator = 0
  for (const point of points) {
    numerator += (point.t - meanT) * (point.y - meanY)
    denominator += (point.t - meanT) ** 2
  }
  if (denominator === 0) return null
  return Math.abs(numerator / denominator) < 1e-6 ? (last.y - first.y) / hourSpan : (numerator / denominator) * 3_600_000
}

export function predictBattery(tower: TowerState, history: HistorySnapshot[]): BatteryPrediction {
  const samples = history
    .map((snapshot) => {
      const entry = snapshot.towers.find((item) => item.id === tower.id)
      return entry ? { timestamp: snapshot.timestamp, batteryLevel: entry.batteryLevel } : null
    })
    .filter((entry): entry is { timestamp: string; batteryLevel: number } => entry !== null)
  const current = Math.round(tower.batteryLevel)
  if (samples.length < 2) {
    return {
      drainPerHour: null,
      minutesToCritical: tower.estimatedRuntimeMinutes,
      risk: current < CRITICAL_BATTERY ? 'critical' : tower.isGridPowerActive ? 'stable' : 'unknown',
      label: samples.length ? 'داده کافی برای پیش‌بینی نیست' : 'هنوز تاریخچه‌ای ثبت نشده',
    }
  }
  const drain = batteryDrainRate(samples)
  if (drain === null) return { drainPerHour: null, minutesToCritical: tower.estimatedRuntimeMinutes, risk: current < CRITICAL_BATTERY ? 'critical' : 'stable', label: 'روند تخلیه مشخص نیست' }
  const remaining = current - CRITICAL_BATTERY
  if (drain <= 0) return { drainPerHour: drain, minutesToCritical: null, risk: current < CRITICAL_BATTERY ? 'critical' : 'stable', label: 'باتری در حال شارژ یا پایدار' }
  const hoursToCritical = remaining / drain
  const minutesToCritical = hoursToCritical <= 0 ? 0 : Math.round(hoursToCritical * 60)
  const risk = minutesToCritical <= 60 || current < CRITICAL_BATTERY ? 'critical' : minutesToCritical <= 240 ? 'warning' : 'stable'
  const label = minutesToCritical <= 0 ? 'از آستانه بحرانی گذشته' : `حدود ${Math.floor(minutesToCritical / 60)} ساعت و ${minutesToCritical % 60} دقیقه تا آستانه بحرانی`
  return { drainPerHour: drain, minutesToCritical, risk, label }
}
