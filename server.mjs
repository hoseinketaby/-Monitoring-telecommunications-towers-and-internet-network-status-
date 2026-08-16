import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

function loadEnv() {
  const file = join(process.cwd(), '.env')
  if (!existsSync(file)) return
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

loadEnv()

const port = Number(process.env.PORT || 8787)
const distDir = join(process.cwd(), 'dist')
const gapGptBaseUrl = (process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '')
const gapGptModel = process.env.GAPGPT_MODEL || 'gapgpt-qwen-3.5'
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
  if (process.env.GAPGPT_API_KEY) return true
  sendJson(response, 503, { error: 'GAPGPT_API_KEY is not configured on the server.' })
  return false
}

async function gapGpt(path, options = {}) {
  return fetch(`${gapGptBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GAPGPT_API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
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
        const upstream = await gapGpt('/chat/completions', {
          method: 'POST',
          body: JSON.stringify({
            model: gapGptModel,
            messages: input.messages,
            temperature: typeof input.temperature === 'number' ? input.temperature : 0.2,
            max_tokens: typeof input.maxTokens === 'number' ? input.maxTokens : 600,
          }),
        })
        const payload = await upstream.json()
        if (!upstream.ok) {
          sendJson(response, upstream.status, { error: payload.error?.message || 'GapGPT request failed.' })
          return
        }
        sendJson(response, 200, { content: payload.choices?.[0]?.message?.content || '' })
      } catch {
        sendJson(response, 400, { error: 'Invalid AI request.' })
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
