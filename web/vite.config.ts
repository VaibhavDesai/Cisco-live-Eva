import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

const iconsDir = path.resolve(
  __dirname,
  'node_modules/@momentum-design/icons/dist/svg'
)

/* ── Cisco EGAI token cache ── */
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getCiscoToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const auth = process.env.CISCO_AI_AUTH
  if (!auth) throw new Error('CISCO_AI_AUTH not set in .env')

  const res = await fetch('https://id.cisco.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': auth,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token request failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken!
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-momentum-icons',
      configureServer(server) {
        server.middlewares.use('/momentum-icons', (req, res, next) => {
          if (!req.url) return next()
          const fileName = req.url.replace(/^\//, '')
          const filePath = path.join(iconsDir, fileName)
          try {
            let data = fs.readFileSync(filePath, 'utf-8')
            data = data.replace('<svg ', '<svg fill="currentColor" ')
            res.setHeader('Content-Type', 'image/svg+xml')
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
            res.end(data)
          } catch {
            res.statusCode = 404
            res.end('Not found')
          }
        })
      },
    },
    {
      name: 'cisco-ai-proxy',
      configureServer(server) {
        server.middlewares.use('/api/chat', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const body = JSON.parse(Buffer.concat(chunks).toString())

          const appkey = process.env.CISCO_AI_APPKEY
          if (!appkey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'CISCO_AI_APPKEY not configured' }))
            return
          }

          try {
            const token = await getCiscoToken()

            const aiRes = await fetch(
              'https://chat-ai.cisco.com/openai/deployments/gpt-4o-mini/chat/completions',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'api-key': token,
                },
                body: JSON.stringify({
                  messages: body.messages,
                  user: JSON.stringify({ appkey }),
                  stop: ['<|im_end|>'],
                }),
              },
            )

            if (!aiRes.ok) {
              const errText = await aiRes.text()
              res.statusCode = aiRes.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `Cisco AI error (${aiRes.status})`, details: errText }))
              return
            }

            const aiData = await aiRes.json()
            const content = aiData.choices?.[0]?.message?.content ?? ''

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ content }))
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: message }))
          }
        })
      },
    },
  ],
  server: {
    allowedHosts: true,
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
})
