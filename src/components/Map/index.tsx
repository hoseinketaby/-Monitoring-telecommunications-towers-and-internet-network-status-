import L from 'leaflet'
import { useEffect, useState } from 'react'
import { Play, Trash2 } from 'lucide-react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { nodeProfiles } from '../../simulation/topology'
import { useMonitorStore } from '../../store'
import type { MapTool, NetworkNode, TowerState } from '../../types'
import { PowerBadge } from '../PowerBadge'
import { TowerDetail } from '../TowerDetail'
import 'leaflet/dist/leaflet.css'

const markerIcon = (tower: TowerState) => L.divIcon({
  className: 'tower-marker',
  html: `<div class="tower-dot ${tower.status}">${tower.status === 'offline' ? '×' : tower.isGridPowerActive ? '⚡' : Math.round(tower.batteryLevel)}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

const networkIcon = (node: NetworkNode, selected: boolean) => L.divIcon({
  className: 'tower-marker',
  html: `<div class="network-asset-icon ${node.kind} ${selected ? 'selected' : ''}" aria-label="${node.kind}"><span></span><i></i></div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
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
      if (!['tower', 'bts', 'microwave', 'fiber', 'router', 'core', 'power'].includes(tool)) return
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
  const [message, setMessage] = useState('')
  const towers = useMonitorStore((state) => state.towers)
  const nodes = useMonitorStore((state) => state.networkNodes)
  const links = useMonitorStore((state) => state.networkLinks)
  const selectedNodeId = useMonitorStore((state) => state.selectedNodeId)
  const selectTower = useMonitorStore((state) => state.selectTower)
  const selectNode = useMonitorStore((state) => state.selectNode)
  const connectNodes = useMonitorStore((state) => state.connectNodes)
  const openNodeSimulation = useMonitorStore((state) => state.openNodeSimulation)
  const updateMapAssetPosition = useMonitorStore((state) => state.updateMapAssetPosition)
  const removeMapAsset = useMonitorStore((state) => state.removeMapAsset)

  const nodeClick = (id: string) => {
    if (selectedNodeId && selectedNodeId !== id) {
      const result = connectNodes(selectedNodeId, id)
      setMessage(result.message)
      window.setTimeout(() => setMessage(''), 5000)
    } else {
      selectNode(id)
    }
  }

  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-2xl border border-line">
      <MapContainer center={[35.6892, 51.389]} zoom={9} scrollWheelZoom className="h-[560px] w-full">
        <DropTarget />
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {links.map((link) => {
          const from = nodes.find((node) => node.id === link.fromId)
          const to = nodes.find((node) => node.id === link.toId)
          return from && to ? <Polyline key={link.id} positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: link.medium === 'fiber' ? '#38bdf8' : link.medium === 'microwave' ? '#fbbf24' : '#a78bfa', weight: 4, dashArray: link.medium === 'microwave' ? '8 7' : undefined }} /> : null
        })}
        {towers.map((tower) => (
          <Marker
            key={tower.id}
            position={[tower.lat, tower.lng]}
            icon={markerIcon(tower)}
            draggable
            eventHandlers={{
              click: () => selectTower(tower.id),
              dragend: (event) => {
                const position = event.target.getLatLng()
                updateMapAssetPosition(tower.id, position.lat, position.lng)
              },
            }}
          >
            <Popup>
              <div dir="rtl" className="min-w-48 text-right">
                <b>{tower.name}</b>
                <p>{tower.region}</p>
                <span><PowerBadge tower={tower} /> {Math.round(tower.batteryLevel)}٪</span>
                <button type="button" onClick={() => removeMapAsset(tower.id)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-500 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-rose-400">
                  <Trash2 className="h-3.5 w-3.5" /> حذف عنصر
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {nodes.map((node) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={networkIcon(node, node.id === selectedNodeId)}
            draggable
            eventHandlers={{
              click: () => nodeClick(node.id),
              dragend: (event) => {
                const position = event.target.getLatLng()
                updateMapAssetPosition(node.id, position.lat, position.lng)
              },
            }}
          >
            <Popup>
              <div dir="rtl" className="min-w-48 text-right">
                <b>{node.name}</b>
                <p>{nodeProfiles[node.kind].label}</p>
                <p>ظرفیت: {node.capacityMbps.toLocaleString('fa-IR')} Mbps</p>
                <p>مختصات: {node.lat.toFixed(5)}، {node.lng.toFixed(5)}</p>
                <button type="button" onClick={() => openNodeSimulation(node.id)} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-2.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400">
                  <Play className="h-3.5 w-3.5 fill-current" /> شبیه‌ساز تجهیز
                </button>
                <button type="button" onClick={() => removeMapAsset(node.id)} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-500 px-2.5 py-2 text-xs font-bold text-white transition hover:bg-rose-400">
                  <Trash2 className="h-3.5 w-3.5" /> حذف عنصر
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {showDropHint && <div className="pointer-events-none absolute bottom-4 right-4 z-[900] rounded-lg bg-slate-950/85 px-3 py-2 text-xs text-slate-200 shadow">تجهیز را روی نقشه رها کنید</div>}
      {message && <div className="absolute bottom-4 left-4 z-[1000] max-w-sm rounded-lg bg-slate-950/95 px-3 py-2 text-xs text-slate-100 shadow">{message}</div>}
      <TowerDetail />
    </section>
  )
}
