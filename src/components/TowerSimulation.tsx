import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { Activity, CloudRain, CloudSun, Gauge, MapPinned, Radio, ThermometerSun, Wind, X, Zap } from 'lucide-react'
import { useMonitorStore } from '../store'
import type { TowerState } from '../types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function MapFocus({ tower }: { tower: TowerState }) {
  const map = useMap()
  useEffect(() => {
    map.setView([tower.lat, tower.lng], 15, { animate: true })
  }, [map, tower.lat, tower.lng])
  return null
}

const simulationIcon = (active: boolean) => L.divIcon({
  className: 'simulation-map-marker',
  html: `<div class="simulation-map-pin ${active ? 'active' : ''}"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

function CoverageMap({ tower }: { tower: TowerState }) {
  const towers = useMonitorStore((state) => state.towers)
  const nodes = useMonitorStore((state) => state.networkNodes)
  const nearbyTowers = towers.filter((item) => item.id !== tower.id && Math.abs(item.lat - tower.lat) < 0.08 && Math.abs(item.lng - tower.lng) < 0.08)
  const nearbyNodes = nodes.filter((item) => Math.abs(item.lat - tower.lat) < 0.04 && Math.abs(item.lng - tower.lng) < 0.04)
  const sector = (angle: number) => {
    const radius = 0.018
    const point = (degrees: number): [number, number] => {
      const radians = (degrees * Math.PI) / 180
      return [tower.lat + Math.cos(radians) * radius, tower.lng + Math.sin(radians) * radius]
    }
    return [[tower.lat, tower.lng], point(angle - 16), point(angle + 16)] as [number, number][]
  }

  return (
    <div className="simulation-map">
      <MapContainer center={[tower.lat, tower.lng]} zoom={15} zoomControl={false} scrollWheelZoom className="h-full w-full">
        <MapFocus tower={tower} />
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={[tower.lat, tower.lng]} radius={1400} pathOptions={{ color: '#22d3ee', fillColor: '#0891b2', fillOpacity: 0.08, weight: 1.5, dashArray: '5 8' }} />
        <Circle center={[tower.lat, tower.lng]} radius={700} pathOptions={{ color: '#38bdf8', fillColor: '#0ea5e9', fillOpacity: 0.13, weight: 1.5 }} />
        {[20, 140, 260].map((angle) => <Polyline key={angle} positions={sector(angle)} pathOptions={{ color: '#67e8f9', fillOpacity: 0.06, fillColor: '#22d3ee', weight: 1, opacity: 0.75 }} />)}
        <Marker position={[tower.lat, tower.lng]} icon={simulationIcon(true)} />
        {nearbyTowers.map((item) => <Marker key={item.id} position={[item.lat, item.lng]} icon={simulationIcon(false)} />)}
        {nearbyNodes.map((node) => <Circle key={node.id} center={[node.lat, node.lng]} radius={55} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.7, weight: 1 }} />)}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-md border border-cyan-400/30 bg-slate-950/80 px-2 py-1 text-[10px] text-cyan-100">
        شعاع پوشش: ۱٫۴ کیلومتر
      </div>
    </div>
  )
}

const weatherClass = (tower: TowerState) => {
  if (tower.weather.weathercode >= 95) return 'storm'
  if (tower.weather.precipitation > 0.4) return 'rain'
  if (tower.weather.windspeed > 35) return 'windy'
  return 'clear'
}

export function TowerSimulation({ tower, onClose }: { tower: TowerState; onClose: () => void }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000)
    return () => window.clearInterval(timer)
  }, [])

  const hour = now.getHours() + now.getMinutes() / 60
  const isNight = hour < 6 || hour >= 19
  const weatherPenalty = tower.weather.windspeed * 0.12 + tower.weather.precipitation * 1.8 + (tower.weather.weathercode >= 95 ? 12 : 0)
  const liveSignal = clamp(tower.signalStrength - weatherPenalty + Math.sin(Date.now() / 4000) * 2, 0, 100)
  const liveLoad = clamp(tower.bandwidthUsageMbps * (0.84 + Math.sin((hour / 24) * Math.PI * 2) * 0.16), 0, 9999)
  const risk = clamp(8 + weatherPenalty + (isNight ? 3 : 0) + (100 - tower.batteryLevel) * 0.15, 0, 100)
  const signalPoints = useMemo(() => Array.from({ length: 24 }, (_, index) => {
    const factor = 0.78 + Math.sin((index / 23) * Math.PI * 2 + 0.7) * 0.13
    return clamp(liveSignal * factor - tower.weather.windspeed * (index % 5 === 0 ? 0.1 : 0), 8, 100)
  }), [liveSignal, tower.weather.windspeed])
  const polyline = signalPoints.map((point, index) => `${(index / (signalPoints.length - 1)) * 100},${100 - point}`).join(' ')

  return (
    <div dir="rtl" className="simulation-overlay" role="dialog" aria-modal="true" aria-label={`شبیه‌سازی زنده ${tower.name}`}>
      <section className={`simulation-shell ${weatherClass(tower)}`}>
        <header className="simulation-header">
          <div>
            <p className="simulation-kicker"><Activity className="h-4 w-4" /> شبیه‌سازی عملیاتی زنده</p>
            <h2>{tower.name}</h2>
            <p className="text-xs text-slate-400">{tower.id} · {tower.region} · مختصات {tower.lat.toFixed(4)}، {tower.lng.toFixed(4)}</p>
          </div>
          <button onClick={onClose} className="simulation-close" aria-label="بستن شبیه‌سازی"><X className="h-5 w-5" /></button>
        </header>

        <div className="simulation-layout">
          <section className="simulation-stage">
            <div className={`simulation-sky ${isNight ? 'night' : ''}`}>
              <div className="simulation-orb" />
              <div className="simulation-cloud cloud-one" />
              <div className="simulation-cloud cloud-two" />
              <div className="simulation-rain">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ left: `${(index * 17) % 100}%`, animationDelay: `${(index % 7) * -0.35}s` }} />)}</div>
              <div className="simulation-waves wave-one" />
              <div className="simulation-waves wave-two" />
              <div className="simulation-ground" />
              <div className="tower-visual" aria-hidden="true">
                <div className="tower-beacon" />
                <div className="tower-antenna antenna-left" />
                <div className="tower-antenna antenna-right" />
                <div className="tower-mast"><i /><i /><i /><i /></div>
                <div className="tower-base" />
              </div>
              <div className="simulation-live-label"><span className="live-dot" /> LIVE · {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now)}</div>
            </div>
            <div className="simulation-stage-footer">
              <span><CloudSun className="h-4 w-4 text-amber-300" /> {tower.weather.condition}</span>
              <span><ThermometerSun className="h-4 w-4 text-rose-300" /> {tower.weather.temperature.toFixed(1)}°C</span>
              <span><Wind className="h-4 w-4 text-cyan-300" /> {tower.weather.windspeed.toFixed(0)} km/h</span>
            </div>
          </section>

          <section className="simulation-side">
            <div className="simulation-stat-grid">
              <div className="simulation-stat"><Radio className="text-cyan-300" /><span>کیفیت سیگنال</span><b>{liveSignal.toFixed(0)}٪</b></div>
              <div className="simulation-stat"><Gauge className="text-violet-300" /><span>بار لحظه‌ای</span><b>{liveLoad.toFixed(0)} Mbps</b></div>
              <div className="simulation-stat"><Zap className={tower.isGridPowerActive ? 'text-amber-300' : 'text-rose-300'} /><span>منبع تغذیه</span><b>{tower.isGridPowerActive ? 'شبکه' : 'باتری'}</b></div>
              <div className="simulation-stat"><CloudRain className="text-sky-300" /><span>ریسک محیطی</span><b className={risk > 45 ? 'text-amber-300' : 'text-emerald-300'}>{risk.toFixed(0)}٪</b></div>
            </div>
            <div className="simulation-chart">
              <div className="mb-2 flex items-center justify-between"><b>نمودار پایداری سیگنال</b><span>۲۴ دقیقهٔ اخیر</span></div>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="نمودار سیگنال">
                <defs><linearGradient id="signal-fill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22d3ee" stopOpacity=".42" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient></defs>
                <path d={`M 0 100 L ${polyline.replace(/ /g, ' L ')} L 100 100 Z`} fill="url(#signal-fill)" />
                <polyline points={polyline} fill="none" stroke="#67e8f9" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="simulation-map-wrap">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><MapPinned className="h-4 w-4 text-cyan-300" /> نقشهٔ محیط اطراف</div>
              <CoverageMap tower={tower} />
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
