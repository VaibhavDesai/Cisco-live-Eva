import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import tls from 'node:tls'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '.env') })
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

// Optionally merge the OS-level CA store (e.g. macOS Keychain — which on
// some corporate machines includes an intercepting root CA) into Node's
// bundled CA list. This is opt-in because some macOS/Node combinations can
// crash while reading Keychain certificates.
// `tls.setDefaultCACertificates` (Node 22.10+) replaces the default bundle —
// we explicitly merge bundled + system so we don't accidentally drop public
// CAs like ISRG Root X1 / DigiCert.
if (process.env.NODE_ENV !== 'production' && process.env.MERGE_SYSTEM_CAS === '1') {
  try {
    const bundled = tls.rootCertificates ?? []
    const system: readonly string[] =
      typeof tls.getCACertificates === 'function' ? tls.getCACertificates('system') : []
    if (typeof tls.setDefaultCACertificates === 'function' && system.length > 0) {
      const merged = Array.from(new Set([...bundled, ...system]))
      tls.setDefaultCACertificates(merged)
      // eslint-disable-next-line no-console
      console.log(
        `◇ TLS CAs: bundled=${bundled.length}, system=${system.length}, merged=${merged.length}`,
      )
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Could not merge system CAs into Node default trust store:', err)
  }
}

const iconsDir = path.resolve(
  __dirname,
  'node_modules/@momentum-design/icons/dist/svg'
)

function normalizeDeepgramApiKey(configuredKey: string): string {
  return configuredKey
    .trim()
    .replace(/^DEEPGRAM_API_KEY\s*=\s*/i, '')
    .replace(/^Authorization:\s*/i, '')
    .replace(/^Token\s+/i, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/\s+/g, '')
    .trim()
}

function getDeepgramAuthorization(): string | null {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) return null

  const normalized = normalizeDeepgramApiKey(apiKey)
  return normalized ? `Token ${normalized}` : null
}

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
  base: process.env.VITE_BASE_PATH || '/',
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
      // Dev-only signed URL proxy for ElevenLabs Conversational AI. Used by
      // the voice preview call flow.
      name: 'elevenlabs-convai-signed-url-proxy',
      configureServer(server) {
        server.middlewares.use('/api/convai/signed-url', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const apiKey = process.env.ELEVENLABS_API_KEY
          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured in .env or web/.env.local' }))
            return
          }

          const agentId = process.env.ELEVENLABS_AGENT_ID
          if (!agentId) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'ELEVENLABS_AGENT_ID not configured in .env or web/.env.local' }))
            return
          }

          try {
            const signedUrlRes = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
              {
                method: 'GET',
                headers: {
                  'xi-api-key': apiKey,
                  Accept: 'application/json',
                },
              },
            )

            if (!signedUrlRes.ok) {
              const errText = await signedUrlRes.text()
              res.statusCode = signedUrlRes.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: `ElevenLabs signed URL error (${signedUrlRes.status})`, details: errText }))
              return
            }

            const data = (await signedUrlRes.json()) as { signed_url?: string }
            if (!data.signed_url) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'ElevenLabs did not return a signed URL' }))
              return
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ signedUrl: data.signed_url }))
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: message }))
          }
        })
      },
    },
    {
      // Proxy for Deepgram Speech-to-Text. Keeps the API key on the dev
      // server side so it never ships in the client bundle. The browser
      // POSTs the recorded audio as a raw binary blob with its own
      // Content-Type (e.g. audio/webm); this middleware forwards it to
      // Deepgram and returns `{ text }`.
      // NOTE: This is a dev-only proxy. For production deployment the
      // same endpoint needs to be re-implemented in whatever runtime
      // serves the app (Edge Function, Node server, etc.) — the client
      // calls `/api/transcribe` so the proxy can be swapped without
      // touching the React code.
      name: 'deepgram-stt-proxy',
      configureServer(server) {
        server.middlewares.use('/api/transcribe', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const authorization = getDeepgramAuthorization()
          if (!authorization) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'DEEPGRAM_API_KEY not configured in .env or web/.env.local' }))
            return
          }

          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const audioBuffer = Buffer.concat(chunks)

            if (audioBuffer.length === 0) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Empty audio body' }))
              return
            }

            // Cap incoming clip size to avoid runaway uploads. For a chat
            // composer mic, a single utterance over ~25MB is almost
            // certainly accidental.
            const MAX_BYTES = 25 * 1024 * 1024
            if (audioBuffer.length > MAX_BYTES) {
              res.statusCode = 413
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Audio too large (>25MB)' }))
              return
            }

            const incomingType = (req.headers['content-type'] as string) || 'audio/webm'
            const deepgramUrl = new URL('https://api.deepgram.com/v1/listen')
            deepgramUrl.searchParams.set('model', 'nova-3')
            deepgramUrl.searchParams.set('smart_format', 'true')
            deepgramUrl.searchParams.set('detect_language', 'true')

            const sttRes = await fetch(deepgramUrl.toString(), {
              method: 'POST',
              headers: {
                Authorization: authorization,
                'Content-Type': incomingType,
                Accept: 'application/json',
              },
              body: audioBuffer,
            })

            if (!sttRes.ok) {
              const errText = await sttRes.text()
              res.statusCode = sttRes.status
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: `Deepgram STT error (${sttRes.status})`,
                  details: errText,
                }),
              )
              return
            }

            const data = (await sttRes.json()) as {
              results?: {
                channels?: Array<{
                  detected_language?: string
                  alternatives?: Array<{
                    transcript?: string
                    languages?: string[]
                  }>
                }>
              }
            }
            const channel = data.results?.channels?.[0]
            const alternative = channel?.alternatives?.[0]
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                text: (alternative?.transcript ?? '').trim(),
                language: channel?.detected_language ?? alternative?.languages?.[0] ?? null,
              }),
            )
          } catch (err: unknown) {
            // Surface the underlying network/fetch error too. Node's
            // undici throws a generic "fetch failed" with the actual
            // diagnostic (DNS / TLS / abort / etc.) tucked into `cause`,
            // so we unwrap it here for the client and log the full chain
            // to the dev server console for easier debugging.
            const baseMessage = err instanceof Error ? err.message : 'Unknown error'
            const cause =
              err && typeof err === 'object' && 'cause' in err
                ? (err as { cause?: unknown }).cause
                : undefined
            const causeMessage =
              cause instanceof Error
                ? cause.message
                : typeof cause === 'string'
                ? cause
                : undefined
            const causeCode =
              cause && typeof cause === 'object' && 'code' in cause
                ? (cause as { code?: unknown }).code
                : undefined
            const fullMessage = causeMessage ? `${baseMessage}: ${causeMessage}` : baseMessage

            // eslint-disable-next-line no-console
            console.error('[deepgram-stt-proxy] error:', err, 'cause:', cause)

            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: fullMessage,
                code: causeCode ?? null,
              }),
            )
          }
        })
      },
    },
    {
      // Proxy for ElevenLabs Speech-to-Text. Used by the Agents build-flow
      // mic so that path behaves like the original demo.
      name: 'elevenlabs-stt-proxy',
      configureServer(server) {
        server.middlewares.use('/api/elevenlabs/transcribe', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
            return
          }

          const apiKey = process.env.ELEVENLABS_API_KEY
          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured in .env or web/.env.local' }))
            return
          }

          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const audioBuffer = Buffer.concat(chunks)

            if (audioBuffer.length === 0) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Empty audio body' }))
              return
            }

            const MAX_BYTES = 25 * 1024 * 1024
            if (audioBuffer.length > MAX_BYTES) {
              res.statusCode = 413
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Audio too large (>25MB)' }))
              return
            }

            const incomingType = (req.headers['content-type'] as string) || 'audio/webm'
            const ext = incomingType.includes('mp4')
              ? 'mp4'
              : incomingType.includes('ogg')
              ? 'ogg'
              : incomingType.includes('wav')
              ? 'wav'
              : incomingType.includes('mpeg') || incomingType.includes('mp3')
              ? 'mp3'
              : 'webm'

            const form = new FormData()
            form.append('file', new Blob([audioBuffer], { type: incomingType }), `audio.${ext}`)
            form.append('model_id', 'scribe_v2')
            form.append('tag_audio_events', 'false')
            form.append('no_verbatim', 'true')

            const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
              method: 'POST',
              headers: {
                'xi-api-key': apiKey,
                Accept: 'application/json',
              },
              body: form,
            })

            if (!sttRes.ok) {
              const errText = await sttRes.text()
              res.statusCode = sttRes.status
              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  error: `ElevenLabs STT error (${sttRes.status})`,
                  details: errText,
                }),
              )
              return
            }

            const data = (await sttRes.json()) as { text?: string; language_code?: string }
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                text: (data.text ?? '').trim(),
                language: data.language_code ?? null,
              }),
            )
          } catch (err: unknown) {
            const baseMessage = err instanceof Error ? err.message : 'Unknown error'
            const cause =
              err && typeof err === 'object' && 'cause' in err
                ? (err as { cause?: unknown }).cause
                : undefined
            const causeMessage =
              cause instanceof Error
                ? cause.message
                : typeof cause === 'string'
                ? cause
                : undefined
            const causeCode =
              cause && typeof cause === 'object' && 'code' in cause
                ? (cause as { code?: unknown }).code
                : undefined
            const fullMessage = causeMessage ? `${baseMessage}: ${causeMessage}` : baseMessage

            // eslint-disable-next-line no-console
            console.error('[elevenlabs-stt-proxy] error:', err, 'cause:', cause)

            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify({
                error: fullMessage,
                code: causeCode ?? null,
              }),
            )
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
              'https://chat-ai.cisco.com/openai/deployments/gpt-5-nano/chat/completions',
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
