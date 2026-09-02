import type { MapTool, NetworkLink, NetworkNode, TopologyAnalysis } from '../types'
import { distanceKm, nodeProfiles, suggestedMedium, validateLink } from '../simulation/topology'
import { chatWithFallback } from './providers'

export async function interpretTopologyWithAi(nodes: NetworkNode[], links: NetworkLink[], analysis: TopologyAnalysis) {
  const fallback = [analysis.summary, ...analysis.issues.map((issue) => `• ${issue.message}`)].join('\n')
  try {
    const response = await chatWithFallback({
      temperature: 0.15,
      maxTokens: 450,
      messages: [
        { role: 'system', content: 'شما مهندس ارشد طراحی شبکه اپراتور موبایل هستید. توپولوژی پیشنهادی را برای امکان برقراری سرویس بررسی کن. پاسخ فارسی، کوتاه و اجرایی باشد: نتیجه، گلوگاه‌ها، و حداکثر سه اقدام بعدی. هرگز ادعای بررسی فیزیکی مسیر، مجوز فرکانس یا دید مستقیم نکن.' },
        { role: 'user', content: JSON.stringify({
          result: analysis.summary,
          score: analysis.score,
          issues: analysis.issues,
          equipment: nodes.map((node) => ({ name: node.name, type: nodeProfiles[node.kind].label, capacityMbps: node.capacityMbps, status: node.status })),
          links: links.map((link) => ({ medium: link.medium, distanceKm: link.distanceKm, capacityMbps: link.capacityMbps, status: link.status })),
        }) },
      ],
    })
    return response.content || fallback
  } catch {
    return fallback
  }
}

type AiTopologyPlan = {
  nodes: Array<{ name?: string; kind?: MapTool; latOffset?: number; lngOffset?: number }>
  links: Array<{ from: number; to: number }>
}

const validKinds: MapTool[] = ['tower', 'bts', 'microwave', 'fiber', 'router', 'core', 'power']

function parsePlan(content: string): AiTopologyPlan | null {
  const normalized = content.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const plan = JSON.parse(normalized.slice(start, end + 1)) as AiTopologyPlan
    return Array.isArray(plan.nodes) && Array.isArray(plan.links) ? plan : null
  } catch {
    return null
  }
}

export async function generateTopologyWithAi(prompt: string, center = { lat: 35.6892, lng: 51.389 }) {
  const response = await chatWithFallback({
    temperature: 0.25,
    maxTokens: 900,
    messages: [
      {
        role: 'system',
        content: `You are a telecom topology planner. Design a practical, conceptual mobile-network topology from the user's Persian request. Return ONLY valid JSON:
{"nodes":[{"name":"string","kind":"tower|bts|microwave|fiber|router|core|power","latOffset":0,"lngOffset":0}],"links":[{"from":0,"to":1}]}
Use 2 to 12 nodes. Offsets are decimal degrees from the supplied map center and must be between -0.12 and 0.12. Include a core or router, appropriate access equipment, and power where useful. Links use zero-based node indices.`,
      },
      { role: 'user', content: JSON.stringify({ request: prompt, mapCenter: center }) },
    ],
  })
  const plan = parsePlan(response.content)
  const safePlan = plan || { nodes: [{ kind: 'core' as const }, { kind: 'bts' as const }, { kind: 'tower' as const }, { kind: 'power' as const }], links: [{ from: 0, to: 1 }] }

  const nodes: NetworkNode[] = safePlan.nodes.slice(0, 12).flatMap((item, index) => {
    if (!item.kind || !validKinds.includes(item.kind)) return []
    const profile = nodeProfiles[item.kind]
    return [{
      id: `ai-${Date.now()}-${index}`,
      name: typeof item.name === 'string' && item.name.trim() ? item.name.trim().slice(0, 50) : `${profile.label} ${index + 1}`,
      kind: item.kind,
      lat: center.lat + Math.max(-0.12, Math.min(0.12, Number(item.latOffset) || 0)),
      lng: center.lng + Math.max(-0.12, Math.min(0.12, Number(item.lngOffset) || 0)),
      capacityMbps: profile.capacityMbps,
      status: 'online',
      createdAt: new Date().toISOString(),
    }]
  })
  const links: NetworkLink[] = safePlan.links.flatMap((item, index) => {
    const from = nodes[item.from]
    const to = nodes[item.to]
    if (!from || !to || from.id === to.id) return []
    const medium = suggestedMedium(from, to)
    if (!validateLink(from, to, medium).valid) return []
    return [{
      id: `ai-link-${Date.now()}-${index}`,
      fromId: from.id,
      toId: to.id,
      medium,
      distanceKm: Math.round(distanceKm(from, to) * 100) / 100,
      capacityMbps: Math.min(from.capacityMbps, to.capacityMbps),
      status: 'active',
    }]
  })
  if (nodes.length < 2) throw new Error('مدل تجهیزات کافی برای ساخت توپولوژی پیشنهاد نداد.')
  return { nodes, links }
}
