interface Env {
  CISCO_AI_AUTH: string;
  CISCO_AI_APPKEY: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_AGENT_ID?: string;
  ALLOWED_ORIGIN: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getCiscoToken(auth: string): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch('https://id.cisco.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': auth,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  const data: { access_token: string; expires_in: number } = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function originMatchesAllowedEntry(origin: string, allowedEntry: string): boolean {
  if (allowedEntry === '*') return true;
  if (allowedEntry === origin) return true;

  if (!allowedEntry.includes('*')) return false;

  try {
    const requestOrigin = new URL(origin);
    const allowedOrigin = new URL(allowedEntry);

    if (requestOrigin.protocol !== allowedOrigin.protocol) return false;

    const allowedHost = allowedOrigin.hostname;
    if (!allowedHost.startsWith('*.')) return false;

    const suffix = allowedHost.slice(1);
    return requestOrigin.hostname.endsWith(suffix);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string, allowedOrigin: string): Record<string, string> {
  const allowed = allowedOrigin.split(',').map(o => o.trim()).filter(Boolean);
  const isAllowed = allowed.some(entry => originMatchesAllowedEntry(origin, entry));

  if (!isAllowed) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    try {
      if (url.pathname === '/convai/signed-url') {
        return await handleElevenLabsSignedUrl(env, cors);
      }

      if (url.pathname === '/transcribe') {
        return await handleTranscribe(request, env, cors);
      }

      if (url.pathname !== '/' && url.pathname !== '/chat') {
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const body: { messages: Array<{ role: string; content: string }> } = await request.json();

      if (!Array.isArray(body.messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const token = await getCiscoToken(env.CISCO_AI_AUTH);

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
            user: JSON.stringify({ appkey: env.CISCO_AI_APPKEY }),
            stop: ['<|im_end|>'],
          }),
        },
      );

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        return new Response(JSON.stringify({ error: `Cisco AI error (${aiRes.status})`, details: errText }), {
          status: aiRes.status,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      const aiData: { choices?: Array<{ message?: { content?: string } }> } = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content ?? '';

      return new Response(JSON.stringify({ content }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
  },
};

async function handleElevenLabsSignedUrl(
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  if (!env.ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  if (!env.ELEVENLABS_AGENT_ID) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_AGENT_ID not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const signedUrlRes = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(env.ELEVENLABS_AGENT_ID)}`,
    {
      method: 'GET',
      headers: {
        'xi-api-key': env.ELEVENLABS_API_KEY,
        Accept: 'application/json',
      },
    },
  );

  if (!signedUrlRes.ok) {
    const details = await signedUrlRes.text();
    return new Response(
      JSON.stringify({
        error: `ElevenLabs signed URL error (${signedUrlRes.status})`,
        details,
      }),
      {
        status: signedUrlRes.status,
        headers: { 'Content-Type': 'application/json', ...cors },
      },
    );
  }

  const data: { signed_url?: string } = await signedUrlRes.json();
  if (!data.signed_url) {
    return new Response(JSON.stringify({ error: 'ElevenLabs did not return a signed URL' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  return new Response(JSON.stringify({ signedUrl: data.signed_url }), {
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function handleTranscribe(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  if (!env.ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const audioBuffer = await request.arrayBuffer();
  if (audioBuffer.byteLength === 0) {
    return new Response(JSON.stringify({ error: 'Empty audio body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const maxBytes = 25 * 1024 * 1024;
  if (audioBuffer.byteLength > maxBytes) {
    return new Response(JSON.stringify({ error: 'Audio too large (>25MB)' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const incomingType = request.headers.get('Content-Type') || 'audio/webm';
  const ext = incomingType.includes('mp4')
    ? 'mp4'
    : incomingType.includes('ogg')
    ? 'ogg'
    : incomingType.includes('wav')
    ? 'wav'
    : incomingType.includes('mpeg') || incomingType.includes('mp3')
    ? 'mp3'
    : 'webm';

  const form = new FormData();
  form.append('file', new Blob([audioBuffer], { type: incomingType }), `audio.${ext}`);
  form.append('model_id', 'scribe_v2');
  form.append('tag_audio_events', 'false');
  form.append('no_verbatim', 'true');

  const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': env.ELEVENLABS_API_KEY,
      Accept: 'application/json',
    },
    body: form,
  });

  if (!sttRes.ok) {
    const details = await sttRes.text();
    return new Response(
      JSON.stringify({
        error: `ElevenLabs STT error (${sttRes.status})`,
        details,
      }),
      {
        status: sttRes.status,
        headers: { 'Content-Type': 'application/json', ...cors },
      },
    );
  }

  const data: { text?: string; language_code?: string } = await sttRes.json();
  return new Response(
    JSON.stringify({
      text: (data.text ?? '').trim(),
      language: data.language_code ?? null,
    }),
    {
      headers: { 'Content-Type': 'application/json', ...cors },
    },
  );
}
