const express = require('express')
const path = require('path')
const https = require('https')

const app = express()
const PORT = process.env.PORT || 5000
const STATIC_DIR = path.join(__dirname, 'web', 'dist')

app.use(express.raw({ type: '*/*', limit: '30mb' }))

let cachedToken = null
let tokenExpiresAt = 0

async function getCiscoToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken
  const auth = process.env.CISCO_AI_AUTH
  if (!auth) throw new Error('CISCO_AI_AUTH not configured')
  const res = await fetch('https://id.cisco.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: auth,
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
  return cachedToken
}

function normalizeDeepgramApiKey(key) {
  return key
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim()
    .replace(/^DEEPGRAM_API_KEY\s*=\s*/i, '')
    .replace(/^Authorization:\s*/i, '')
    .replace(/^(Token|Bearer)\s+/i, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/[\u0000-\u001F\u007F\s]+/g, '')
    .trim()
}

function getDeepgramAuthorization() {
  const key = process.env.DEEPGRAM_API_KEY
  if (!key) return null
  const normalized = normalizeDeepgramApiKey(key)
  return normalized ? `Token ${normalized}` : null
}

function json(res, status, data) {
  res.status(status).json(data)
}

app.post('/api/transcribe', async (req, res) => {
  const authorization = getDeepgramAuthorization()
  if (!authorization) return json(res, 500, { error: 'DEEPGRAM_API_KEY not configured' })

  const audioBuffer = req.body
  if (!audioBuffer || audioBuffer.length === 0) return json(res, 400, { error: 'Empty audio body' })
  if (audioBuffer.length > 25 * 1024 * 1024) return json(res, 413, { error: 'Audio too large (>25MB)' })

  const incomingType = req.headers['content-type'] || 'audio/webm'
  const url = new URL('https://api.deepgram.com/v1/listen')
  url.searchParams.set('model', 'nova-3')
  url.searchParams.set('smart_format', 'true')
  url.searchParams.set('detect_language', 'true')

  try {
    const sttRes = await fetch(url.toString(), {
      method: 'POST',
      headers: { Authorization: authorization, 'Content-Type': incomingType, Accept: 'application/json' },
      body: audioBuffer,
    })
    const data = await sttRes.json()
    if (!sttRes.ok) return json(res, sttRes.status, { error: `Deepgram STT error (${sttRes.status})`, details: JSON.stringify(data) })
    const channel = data.results?.channels?.[0]
    const alt = channel?.alternatives?.[0]
    json(res, 200, { text: (alt?.transcript ?? '').trim(), language: channel?.detected_language ?? alt?.languages?.[0] ?? null })
  } catch (err) {
    json(res, 502, { error: err.message })
  }
})

app.post('/api/elevenlabs/transcribe', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return json(res, 500, { error: 'ELEVENLABS_API_KEY not configured' })

  const audioBuffer = req.body
  if (!audioBuffer || audioBuffer.length === 0) return json(res, 400, { error: 'Empty audio body' })
  if (audioBuffer.length > 25 * 1024 * 1024) return json(res, 413, { error: 'Audio too large (>25MB)' })

  const incomingType = req.headers['content-type'] || 'audio/webm'
  const ext = incomingType.includes('mp4') ? 'mp4'
    : incomingType.includes('ogg') ? 'ogg'
    : incomingType.includes('wav') ? 'wav'
    : incomingType.includes('mpeg') || incomingType.includes('mp3') ? 'mp3'
    : 'webm'

  try {
    const form = new FormData()
    form.append('file', new Blob([audioBuffer], { type: incomingType }), `audio.${ext}`)
    form.append('model_id', 'scribe_v2')
    form.append('tag_audio_events', 'false')
    form.append('no_verbatim', 'true')

    const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, Accept: 'application/json' },
      body: form,
    })
    const data = await sttRes.json()
    if (!sttRes.ok) return json(res, sttRes.status, { error: `ElevenLabs STT error (${sttRes.status})`, details: JSON.stringify(data) })
    json(res, 200, { text: (data.text ?? '').trim(), language: data.language_code ?? null })
  } catch (err) {
    json(res, 502, { error: err.message })
  }
})

app.post('/api/convai/signed-url', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const agentId = process.env.ELEVENLABS_AGENT_ID
  if (!apiKey) return json(res, 500, { error: 'ELEVENLABS_API_KEY not configured' })
  if (!agentId) return json(res, 500, { error: 'ELEVENLABS_AGENT_ID not configured' })

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { method: 'GET', headers: { 'xi-api-key': apiKey, Accept: 'application/json' } },
    )
    const data = await r.json()
    if (!r.ok) return json(res, r.status, { error: `ElevenLabs signed URL error (${r.status})`, details: JSON.stringify(data) })
    if (!data.signed_url) return json(res, 502, { error: 'ElevenLabs did not return a signed URL' })
    json(res, 200, { signedUrl: data.signed_url })
  } catch (err) {
    json(res, 502, { error: err.message })
  }
})

app.post('/api/chat', async (req, res) => {
  const appkey = process.env.CISCO_AI_APPKEY
  if (!appkey) return json(res, 500, { error: 'CISCO_AI_APPKEY not configured' })

  let body
  try {
    body = JSON.parse(req.body.toString())
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' })
  }

  if (!Array.isArray(body.messages)) return json(res, 400, { error: 'Invalid request: messages array required' })

  try {
    const token = await getCiscoToken()
    const aiRes = await fetch('https://chat-ai.cisco.com/openai/deployments/gpt-5-nano/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'api-key': token },
      body: JSON.stringify({ messages: body.messages, user: JSON.stringify({ appkey }), stop: ['<|im_end|>'] }),
    })
    const aiData = await aiRes.json()
    if (!aiRes.ok) return json(res, aiRes.status, { error: `Cisco AI error (${aiRes.status})`, details: JSON.stringify(aiData) })
    json(res, 200, { content: aiData.choices?.[0]?.message?.content ?? '' })
  } catch (err) {
    json(res, 502, { error: err.message })
  }
})

app.use(express.static(STATIC_DIR))

app.use((req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
