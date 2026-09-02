import { createReadStream, existsSync, readFileSync } from 'node:fs'
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
