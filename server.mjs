import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import dns from 'node:dns/promises'
import net from 'node:net'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

function loadEnv() {
  for (const filename of ['.env.local', '.env']) {
    const file = join(process.cwd(), filename)
    if (!existsSync(file)) continue
    for (const rawLine of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue
      const separator = line.indexOf('=')
      if (separator < 1) continue
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }
}

loadEnv()

const port = Number(process.env.PORT || 8787)
const execFileAsync = promisify(execFile)
const distDir = join(process.cwd(), 'dist')
const dataDir = join(process.cwd(), '.data')
mkdirSync(dataDir, { recursive: true })
const telegramConfigPath = join(dataDir, 'telegram-config.json')
const historyPath = join(dataDir, 'tower-history.jsonl')
const historyLimit = Number(process.env.HISTORY_LIMIT || 2000)
const openRouterBaseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '')
const openRouterModel = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })
    request.on('error', reject)
  })
}

function loadTelegramConfig() {
  try {
    const config = JSON.parse(readFileSync(telegramConfigPath, 'utf8'))
    if (typeof config.token === 'string' && typeof config.chatId === 'string') return config
  } catch {}
  return { token: '', chatId: '', autoAlerts: false }
}

function saveTelegramConfig(config) {
  writeFileSync(telegramConfigPath, JSON.stringify(config, null, 2), 'utf8')
}

async function sendTelegramMessage(token, chatId, text) {
  const telegram = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  let result = {}
  try { result = await telegram.json() } catch {}
  if (!telegram.ok || !result.ok) throw new Error(result.description || 'Telegram rejected the request.')
}

function readHistory() {
  try {
    return readFileSync(historyPath, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line))
  } catch {
    return []
  }
}

function appendHistory(entry) {
  const lines = readHistory()
  lines.push(entry)
  const overflow = lines.length - historyLimit
  writeFileSync(historyPath, lines.slice(Math.max(0, overflow)).map((item) => JSON.stringify(item)).join('\n') + '\n', 'utf8')
}

function requireApiKey(response) {
  if (process.env.OPENROUTER_API_KEY) return true
  sendJson(response, 503, { error: 'OPENROUTER_API_KEY is not configured on the server.' })
  return false
}

async function openRouter(path, options = {}) {
  return fetch(`${openRouterBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      ...(process.env.OPENROUTER_HTTP_REFERER ? { 'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER } : {}),
      ...(process.env.OPENROUTER_X_TITLE ? { 'X-Title': process.env.OPENROUTER_X_TITLE } : {}),
      ...(options.headers || {}),
    },
  })
}

async function readJson(response) {
  const raw = await response.text()
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return { error: `OpenRouter returned a non-JSON response (HTTP ${response.status}).` }
  }
}

async function pingHost(host) {
  const startedAt = Date.now()
  const isWindows = process.platform === 'win32'
  const args = isWindows ? ['-n', '1', '-w', '2000', host] : ['-c', '1', '-W', '2', host]
  try {
    await execFileAsync(isWindows ? 'ping.exe' : 'ping', args, { timeout: 5000, windowsHide: true })
    return { ok: true, host, latencyMs: Date.now() - startedAt }
  } catch (error) {
    return { ok: false, host, latencyMs: Date.now() - startedAt, error: error?.code === 'ETIMEDOUT' ? 'timeout' : 'unreachable' }
  }
}

function validateTarget(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 253 && /^[a-zA-Z0-9.:[\]-]+$/.test(value.trim())
}

async function runNetworkCommand(input) {
  const command = String(input.command || '').toLowerCase()
  const target = typeof input.target === 'string' ? input.target.trim() : ''
  if (!validateTarget(target) && command !== 'curl') throw new Error('A valid hostname or IP address is required.')
  if (command === 'ping') return pingHost(target)
  if (command === 'dns') {
    const addresses = await dns.lookup(target, { all: true })
    return { ok: true, host: target, addresses: addresses.map((entry) => entry.address) }
  }
  if (command === 'curl' || command === 'http-status') {
    if (!/^https?:\/\/[^\s]+$/i.test(target)) throw new Error('Only valid http:// or https:// URLs are allowed.')
    const startedAt = Date.now()
    const response = await fetch(target, { method: input.head ? 'HEAD' : 'GET', redirect: 'manual', signal: AbortSignal.timeout(8000) })
    return { ok: response.ok, url: target, status: response.status, statusText: response.statusText, latencyMs: Date.now() - startedAt, headers: input.head ? Object.fromEntries(response.headers.entries()) : undefined }
  }
  if (command === 'port') {
    const port = Number(input.port)
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Port must be an integer between 1 and 65535.')
    const startedAt = Date.now()
    return await new Promise((resolve) => {
      const socket = net.createConnection({ host: target, port, timeout: 3000 })
      const finish = (ok, error) => { socket.destroy(); resolve({ ok, host: target, port, latencyMs: Date.now() - startedAt, error }) }
      socket.once('connect', () => finish(true))
      socket.once('timeout', () => finish(false, 'timeout'))
      socket.once('error', () => finish(false, 'closed'))
    })
  }
  if (command === 'traceroute') {
    const tracerouteBin = process.platform === 'win32' ? 'tracert.exe' : 'traceroute'
    const args = process.platform === 'win32' ? ['-h', '8', '-w', '1000', target] : ['-m', '8', '-w', '1', target]
    const result = await execFileAsync(tracerouteBin, args, { timeout: 12000, windowsHide: true, maxBuffer: 20000 }).catch((error) => ({ stdout: error.stdout || '', stderr: error.stderr || error.message }))
    return { ok: true, host: target, output: `${result.stdout || ''}${result.stderr ? `\n${result.stderr}` : ''}`.trim() }
  }
  throw new Error(`Unsupported network command: ${command}`)
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)

  if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
    if (!requireApiKey(response)) return
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const input = JSON.parse(body)
        if (!Array.isArray(input.messages)) {
          sendJson(response, 400, { error: 'Messages are required.' })
          return
        }
        const upstream = await openRouter('/chat/completions', {
          method: 'POST',
          body: JSON.stringify({
            model: openRouterModel,
            messages: input.messages,
            temperature: typeof input.temperature === 'number' ? input.temperature : 0.2,
            max_tokens: typeof input.maxTokens === 'number' ? input.maxTokens : 600,
          }),
        })
        const payload = await readJson(upstream)
        if (!upstream.ok) {
          sendJson(response, upstream.status, { error: payload.error?.message || 'OpenRouter request failed.' })
          return
        }
        sendJson(response, 200, { content: payload.choices?.[0]?.message?.content || '' })
      } catch {
        sendJson(response, 400, { error: 'Invalid AI request.' })
      }
    })
    return
  }

  if (url.pathname === '/api/network/ping' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const input = JSON.parse(body)
        const host = typeof input.host === 'string' ? input.host.trim() : ''
        if (!host || host.length > 253 || !/^[a-zA-Z0-9.:[\]-]+$/.test(host)) {
          sendJson(response, 400, { error: 'A valid hostname or IP address is required.' })
          return
        }
        sendJson(response, 200, await pingHost(host))
      } catch {
        sendJson(response, 400, { error: 'Invalid ping request.' })
      }
    })
    return
  }

  if (url.pathname === '/api/network/command' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const input = JSON.parse(body)
        sendJson(response, 200, await runNetworkCommand(input))
      } catch (error) {
        sendJson(response, 400, { error: error instanceof Error ? error.message : 'Network command failed.' })
      }
    })
    return
  }

  if (url.pathname === '/api/quickchart' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const input = JSON.parse(body)
        if (!input?.chart) return sendJson(response, 400, { error: 'Chart configuration is required.' })
        const upstream = await fetch('https://quickchart.io/chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chart: input.chart, width: input.width || 1100, height: input.height || 520, format: input.format || 'png', backgroundColor: '#0f172a' }) })
        if (!upstream.ok) throw new Error(`QuickChart upstream returned ${upstream.status}`)
        const buffer = Buffer.from(await upstream.arrayBuffer())
        response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'image/png', 'Cache-Control': 'no-store' })
        response.end(buffer)
      } catch { sendJson(response, 502, { error: 'QuickChart request failed.' }) }
    })
    return
  }

  if (url.pathname === '/api/admin/telegram/send' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const input = JSON.parse(body)
        if (typeof input.token !== 'string' || typeof input.chatId !== 'string' || !input.token || !input.chatId) return sendJson(response, 400, { error: 'Bot token and chat ID are required.' })
        const towers = Array.isArray(input.towers) ? input.towers : []
        const critical = towers.filter((tower) => Number(tower.batteryLevel ?? 100) < 20 || tower.status === 'offline')
        const text = [`📡 Telecom Tower Monitor`, `🕒 ${new Date().toISOString()}`, `📊 Total towers: ${towers.length}`, `✅ Online: ${towers.filter((tower) => tower.status === 'online').length}`, `🚨 Critical: ${critical.length}`, ...critical.slice(0, 10).map((tower) => `• ${tower.name} — ${tower.status}, battery ${Math.round(tower.batteryLevel ?? 0)}%`)].join('\n')
        const telegram = await fetch(`https://api.telegram.org/bot${encodeURIComponent(input.token)}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: input.chatId, text }) })
        const result = await telegram.json()
        if (!telegram.ok || !result.ok) return sendJson(response, 502, { error: result.description || 'Telegram rejected the request.' })
        sendJson(response, 200, { ok: true })
      } catch (error) { sendJson(response, 400, { error: error instanceof Error ? error.message : 'Telegram request failed.' }) }
    })
    return
  }

  if (url.pathname === '/api/admin/telegram/config' && request.method === 'GET') {
    const config = loadTelegramConfig()
    sendJson(response, 200, { connected: Boolean(config.token && config.chatId), autoAlerts: Boolean(config.autoAlerts) })
    return
  }

  if (url.pathname === '/api/admin/telegram/config' && request.method === 'POST') {
    try {
      const input = await readBody(request)
      const config = loadTelegramConfig()
      const next = {
        token: typeof input.token === 'string' && input.token ? input.token : config.token,
        chatId: typeof input.chatId === 'string' && input.chatId ? input.chatId : config.chatId,
        autoAlerts: typeof input.autoAlerts === 'boolean' ? input.autoAlerts : Boolean(config.autoAlerts),
      }
      saveTelegramConfig(next)
      sendJson(response, 200, { connected: Boolean(next.token && next.chatId), autoAlerts: next.autoAlerts })
    } catch (error) { sendJson(response, 400, { error: error instanceof Error ? error.message : 'Invalid config update.' }) }
    return
  }

  if (url.pathname === '/api/admin/telegram/alert' && request.method === 'POST') {
    try {
      const input = await readBody(request)
      const config = loadTelegramConfig()
      if (!config.token || !config.chatId) return sendJson(response, 400, { error: 'Telegram bot is not configured yet.' })
      if (!config.autoAlerts) return sendJson(response, 200, { ok: true, skipped: true })
      const text = [`🚨 هشدار خودکار`, `🕒 ${new Date().toLocaleString('fa-IR')}`, String(input.message || '').trim()].filter(Boolean).join('\n')
      await sendTelegramMessage(config.token, config.chatId, text)
      sendJson(response, 200, { ok: true, skipped: false })
    } catch (error) { sendJson(response, 400, { error: error instanceof Error ? error.message : 'Telegram alert failed.' }) }
    return
  }

  if (url.pathname === '/api/history' && request.method === 'POST') {
    try {
      const input = await readBody(request)
      const towers = Array.isArray(input.towers) ? input.towers : []
      appendHistory({
        timestamp: typeof input.timestamp === 'string' ? input.timestamp : new Date().toISOString(),
        summary: {
          total: towers.length,
          online: towers.filter((tower) => tower.status === 'online').length,
          degraded: towers.filter((tower) => tower.status === 'degraded').length,
          offline: towers.filter((tower) => tower.status === 'offline').length,
          gridOutages: towers.filter((tower) => !tower.isGridPowerActive).length,
          avgBattery: Math.round(towers.reduce((sum, tower) => sum + Number(tower.batteryLevel ?? 0), 0) / Math.max(1, towers.length)),
          avgSignal: Math.round(towers.reduce((sum, tower) => sum + Number(tower.signalStrength ?? 0), 0) / Math.max(1, towers.length)),
        },
        towers: towers.map((tower) => ({ id: tower.id, name: tower.name, status: tower.status, batteryLevel: Math.round(Number(tower.batteryLevel ?? 0)), isGridPowerActive: Boolean(tower.isGridPowerActive) })),
      })
      sendJson(response, 200, { ok: true })
    } catch (error) { sendJson(response, 400, { error: error instanceof Error ? error.message : 'History snapshot failed.' }) }
    return
  }

  if (url.pathname === '/api/history' && request.method === 'GET') {
    sendJson(response, 200, { snapshots: readHistory() })
    return
  }

  const safePath = normalize(url.pathname).replace(/^(\.\.(\/|\\|$))+/, '')
  const requestedFile = join(distDir, safePath === '/' ? 'index.html' : safePath)
  const file = existsSync(requestedFile) ? requestedFile : join(distDir, 'index.html')
  if (!existsSync(file)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Build the frontend first with npm run build.')
    return
  }
  response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(response)
}).listen(port, () => {
  console.log(`Telecom monitor server is running on http://localhost:${port}`)
})
