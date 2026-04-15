interface Env {
  CISCO_AI_AUTH: string;
  CISCO_AI_APPKEY: string;
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

function corsHeaders(origin: string, allowedOrigin: string): Record<string, string> {
  const allowed = allowedOrigin.split(',').map(o => o.trim());
  const isAllowed = allowed.includes(origin) || allowed.includes('*');

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
