import { CloudLightning, CloudRain, CloudSun } from 'lucide-react'
import type { WeatherData } from '../types'

export function WeatherBadge({ weather }: { weather: WeatherData }) {
  const Icon = weather.weathercode >= 95 ? CloudLightning : weather.precipitation > 0 ? CloudRain : CloudSun
  return <span className="inline-flex items-center gap-1 text-xs text-slate-300" title={weather.condition}><Icon className="h-4 w-4 text-sky-300" />{Math.round(weather.temperature)}° · {weather.condition}</span>
}
