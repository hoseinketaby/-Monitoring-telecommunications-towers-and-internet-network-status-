import type { TowerState, WeatherData } from '../types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function applyWeatherImpact(metrics: Partial<TowerState>, weather: WeatherData) {
  if (weather.windspeed > 60) metrics.signalStrength = (metrics.signalStrength ?? 100) - 15
  if (weather.precipitation > 5) metrics.packetLoss = (metrics.packetLoss ?? 0) + 3
  if (weather.weathercode >= 95) metrics.status = 'degraded'
  if (weather.temperature > 45) metrics.cpuTemp = (metrics.cpuTemp ?? 25) + 10
  if (metrics.signalStrength !== undefined) metrics.signalStrength = clamp(metrics.signalStrength, 0, 100)
  if (metrics.packetLoss !== undefined) metrics.packetLoss = Math.max(0, metrics.packetLoss)
  if (metrics.cpuTemp !== undefined) metrics.cpuTemp = clamp(metrics.cpuTemp, -50, 120)
  return metrics
}

export function weatherOutageRiskMultiplier(weather: WeatherData): number {
  let multiplier = 1
  if (weather.windspeed > 60) multiplier *= 3
  if (weather.weathercode >= 95) multiplier *= 4
  if (weather.precipitation > 20) multiplier *= 2
  return multiplier
}
