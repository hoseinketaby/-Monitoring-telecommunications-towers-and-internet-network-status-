import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { useMonitorStore } from '../../store'
import type { MapTool, TowerState } from '../../types'
import { PowerBadge } from '../PowerBadge'
import { TowerDetail } from '../TowerDetail'
import 'leaflet/dist/leaflet.css'

const markerIcon = (tower: TowerState) =>
  L.divIcon({
    className: 'tower-marker',
    html: `<div class="tower-dot ${tower.status}">${tower.status === 'offline' ? '×' : tower.isGridPowerActive ? '⚡' : Math.round(tower.batteryLevel)}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

function DropTarget() {
  const map = useMap()
  const addMapAsset = useMonitorStore((state) => state.addMapAsset)
  useEffect(() => {
    const container = map.getContainer()
    const allowDrop = (event: DragEvent) => event.preventDefault()
    const drop = (event: DragEvent) => {
      event.preventDefault()
      const tool = event.dataTransfer?.getData('application/telecom-tool') as MapTool
      if (!['tower', 'relay', 'fiber'].includes(tool)) return
      const bounds = container.getBoundingClientRect()
      const point = L.point(event.clientX - bounds.left, event.clientY - bounds.top)
      const position = map.containerPointToLatLng(point)
      addMapAsset(tool, position.lat, position.lng)
    }
    container.addEventListener('dragover', allowDrop)
    container.addEventListener('drop', drop)
    return () => {
      container.removeEventListener('dragover', allowDrop)
      container.removeEventListener('drop', drop)
    }
  }, [addMapAsset, map])
  return null
}

export function TowerMap({ showDropHint = false }: { showDropHint?: boolean }) {
  const towers = useMonitorStore((state) => state.towers)
  const selectTower = useMonitorStore((state) => state.selectTower)
  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-2xl border border-line">
      <MapContainer center={[35.6892, 51.389]} zoom={9} scrollWheelZoom className="h-[560px] w-full">
        <DropTarget />
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {towers.map((tower) => (
          <Marker key={tower.id} position={[tower.lat, tower.lng]} icon={markerIcon(tower)} eventHandlers={{ click: () => selectTower(tower.id) }}>
            <Popup>
              <div dir="rtl" className="min-w-40">
                <b>{tower.name}</b>
                <p>{tower.region} · {tower.status}</p>
                <span className="inline-flex items-center gap-1"><PowerBadge tower={tower} /> {Math.round(tower.batteryLevel)}٪</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {showDropHint && <div className="pointer-events-none absolute bottom-4 right-4 z-[900] rounded-lg bg-slate-950/85 px-3 py-2 text-xs text-slate-200 shadow">تجهیز را روی نقشه رها کنید</div>}
      <TowerDetail />
    </section>
  )
}
