import { getAiSettings } from '../config/runtime'
import { appEnv } from '../config/env'
import type { NetworkLink, NetworkNode, TopologyAnalysis } from '../types'
import { nodeProfiles } from '../simulation/topology'
import { chatWithFallback } from './providers'

export async function interpretTopologyWithAi(nodes: NetworkNode[], links: NetworkLink[], analysis: TopologyAnalysis) {
  const fallback = [analysis.summary, ...analysis.issues.map((issue) => `• ${issue.message}`)].join('\n')
  try {
    const response = await chatWithFallback({
      model: getAiSettings().model || appEnv.llmModel || 'nvidia/nemotron-3-ultra-550b-a55b:free',
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
