import type { TowerState, WeatherData } from '../types'
import { readWeatherCache, writeWeatherCache } from './cache'

const descriptions: Record<number, string> = { 0: 'صاف', 1: 'عمدتاً صاف', 2: 'نیمه‌ابری', 3: 'ابری', 45: 'مه‌آلود', 61: 'باران', 71: 'برف', 80: 'رگبار', 95: 'رعدوبرق' }

const requestWeather = async (lat: number, lng: number): Promise<WeatherData> => {
  const cached = readWeatherCache(lat, lng)
  if (cached) return cached
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lng), current: 'temperature_2m,precipitation,windspeed_10m,weathercode' }).toString()
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`)
  const current = (await response.json()).current
  const weathercode = Number(current.weathercode ?? 0)
  const weather: WeatherData = { temperature: Number(current.temperature_2m ?? 25), precipitation: Number(current.precipitation ?? 0), windspeed: Number(current.windspeed_10m ?? 0), weathercode, condition: descriptions[weathercode] ?? 'نامشخص' }
  writeWeatherCache(lat, lng, weather)
  return weather
}

export async function attachWeather(towers: TowerState[]): Promise<TowerState[]> {
  const unique = new Map<string, Promise<WeatherData>>()
  const queue = [...towers]
  const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
    while (queue.length) {
      const tower = queue.shift()
      if (!tower) break
      const key = `${Math.round(tower.lat * 10) / 10}:${Math.round(tower.lng * 10) / 10}`
      if (!unique.has(key)) unique.set(key, requestWeather(tower.lat, tower.lng))
      try { await unique.get(key) } catch { /* Keep last known weather. */ }
    }
  })
  await Promise.all(workers)
  return Promise.all(towers.map(async (tower) => {
    const key = `${Math.round(tower.lat * 10) / 10}:${Math.round(tower.lng * 10) / 10}`
    try { return { ...tower, weather: await unique.get(key)! } } catch { return tower }
  }))
}
