import type { LinkMedium, NetworkLink, NetworkNode, TopologyAnalysis, TopologyIssue } from '../types'

const EARTH_RADIUS_KM = 6371

export const nodeProfiles: Record<NetworkNode['kind'], { label: string; capacityMbps: number; canSource: boolean; canCore: boolean }> = {
  tower: { label: 'دکل مخابراتی', capacityMbps: 1000, canSource: false, canCore: false },
  bts: { label: 'سایت BTS / 4G-5G', capacityMbps: 600, canSource: true, canCore: false },
  microwave: { label: 'رادیو مایکروویو', capacityMbps: 1000, canSource: false, canCore: false },
  fiber: { label: 'گره فیبر نوری', capacityMbps: 10000, canSource: false, canCore: false },
  router: { label: 'روتر انتقال / IP', capacityMbps: 10000, canSource: false, canCore: false },
  core: { label: 'هسته شبکه (EPC/5GC)', capacityMbps: 100000, canSource: false, canCore: true },
  power: { label: 'برق و ژنراتور', capacityMbps: 0, canSource: false, canCore: false },
}

export function distanceKm(a: Pick<NetworkNode, 'lat' | 'lng'>, b: Pick<NetworkNode, 'lat' | 'lng'>) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

export function suggestedMedium(from: NetworkNode, to: NetworkNode): LinkMedium {
  if (from.kind === 'fiber' || to.kind === 'fiber' || from.kind === 'core' || to.kind === 'core') return 'fiber'
  if (from.kind === 'router' || to.kind === 'router') return 'ethernet'
  return 'microwave'
}

export function validateLink(from: NetworkNode, to: NetworkNode, medium: LinkMedium) {
  const km = distanceKm(from, to)
  if (from.id === to.id) return { valid: false, reason: 'یک تجهیز نمی‌تواند به خودش متصل شود.' }
  if (from.kind === 'power' || to.kind === 'power') return { valid: false, reason: 'تجهیز برق را به‌عنوان لینک انتقال اضافه نکنید.' }
  if (medium === 'microwave' && km > 35) return { valid: false, reason: `فاصله ${km.toFixed(1)} کیلومتر است؛ لینک مایکروویو برای طراحی اولیه بیش از ۳۵ کیلومتر در نظر گرفته نشده است.` }
  if (medium === 'ethernet' && km > 2) return { valid: false, reason: 'اترنت فقط برای اتصال محلی تا ۲ کیلومتر پیشنهاد می‌شود.' }
  if (medium === 'fiber' && km > 120) return { valid: false, reason: `فاصله ${km.toFixed(1)} کیلومتر است؛ برای این مسیر فیبر به گره میانی نیاز دارید.` }
  return { valid: true, reason: '' }
}

export function analyzeTopology(nodes: NetworkNode[], links: NetworkLink[]): TopologyAnalysis {
  const issues: TopologyIssue[] = []
  const transportNodes = nodes.filter((node) => node.kind !== 'power')
  const cores = transportNodes.filter((node) => nodeProfiles[node.kind].canCore && node.status === 'online')
  const sources = transportNodes.filter((node) => nodeProfiles[node.kind].canSource)
  if (!transportNodes.length) {
    return { feasible: false, score: 0, summary: 'برای تحلیل، حداقل یک تجهیز مخابراتی روی نقشه قرار دهید.', reachableNodeIds: [], isolatedNodeIds: [], issues: [] }
  }
  if (!cores.length) issues.push({ severity: 'critical', message: 'هسته شبکه (EPC/5GC) فعال روی نقشه وجود ندارد؛ مسیر سرویس مشترکان کامل نمی‌شود.' })

  const adjacency = new Map<string, string[]>()
  transportNodes.forEach((node) => adjacency.set(node.id, []))
  links.filter((link) => link.status === 'active').forEach((link) => {
    adjacency.get(link.fromId)?.push(link.toId)
    adjacency.get(link.toId)?.push(link.fromId)
  })
  const reachable = new Set<string>(cores.map((node) => node.id))
  const queue = [...reachable]
  while (queue.length) {
    const current = queue.shift()!
    for (const neighbor of adjacency.get(current) || []) {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  const isolated = sources.filter((node) => !reachable.has(node.id))
  isolated.forEach((node) => issues.push({ severity: 'critical', nodeId: node.id, message: `${node.name} مسیر فعالی تا هسته شبکه ندارد.` }))
  if (!sources.length) issues.push({ severity: 'warning', message: 'هیچ سایت BTS/4G/5G تعریف نشده است؛ پوشش مشترک قابل ارزیابی نیست.' })
  transportNodes.filter((node) => node.status !== 'online').forEach((node) => issues.push({ severity: 'warning', nodeId: node.id, message: `${node.name} در وضعیت فعال نیست و افزونگی مسیر آن باید بررسی شود.` }))
  const activeLinks = links.filter((link) => link.status === 'active')
  if (sources.length > 1 && activeLinks.length < sources.length) issues.push({ severity: 'warning', message: 'تعداد لینک‌های انتقال کم است؛ برای پایداری، مسیر پشتیبان به گره فیبر یا روتر اضافه کنید.' })

  const feasible = cores.length > 0 && sources.length > 0 && isolated.length === 0
  const score = Math.max(0, Math.min(100, 100 - isolated.length * 30 - issues.filter((issue) => issue.severity === 'warning').length * 8 - (cores.length ? 0 : 35)))
  const summary = feasible
    ? `توپولوژی قابل برقراری است: ${sources.length} سایت دسترسی از طریق ${activeLinks.length} لینک فعال به هسته شبکه می‌رسند.`
    : `توپولوژی هنوز قابل برقراری کامل نیست؛ ${isolated.length} سایت دسترسی بدون مسیر تا هسته شبکه است.`
  return { feasible, score, summary, reachableNodeIds: [...reachable], isolatedNodeIds: isolated.map((node) => node.id), issues }
}
