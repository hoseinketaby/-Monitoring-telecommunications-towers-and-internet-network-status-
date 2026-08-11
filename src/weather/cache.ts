import type { WeatherData } from '../types'

interface CachedWeather {
  value: WeatherData
  expiresAt: number
}

const cache = new Map<string, CachedWeather>()
const CACHE_TTL_MS = 10 * 60_000

export const weatherCacheKey = (lat: number, lng: number) =>
  `${Math.round(lat * 10) / 10}:${Math.round(lng * 10) / 10}`

export function readWeatherCache(lat: number, lng: number) {
  const key = weatherCacheKey(lat, lng)
  const entry = cache.get(key)
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

export function writeWeatherCache(lat: number, lng: number, value: WeatherData) {
  cache.set(weatherCacheKey(lat, lng), { value, expiresAt: Date.now() + CACHE_TTL_MS })
}
