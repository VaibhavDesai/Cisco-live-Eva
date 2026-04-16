import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getCiscoToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const auth = process.env.CISCO_AI_AUTH;
  if (!auth) throw new Error('CISCO_AI_AUTH not configured');

  const res = await fetch('https://id.cisco.com/oauth2/default/v1/token', {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: auth,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const appkey = process.env.CISCO_AI_APPKEY;
  if (!appkey) {
    return res.status(500).json({ error: 'CISCO_AI_APPKEY not configured' });
  }

  try {
    const token = await getCiscoToken();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body?.messages;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid "messages" array in request body' });
    }

    const aiRes = await fetch(
      'https://chat-ai.cisco.com/openai/deployments/gpt-5-nano/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'api-key': token,
        },
        body: JSON.stringify({
          messages,
          user: JSON.stringify({ appkey }),
          stop: ['<|im_end|>'],
        }),
      },
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return res.status(aiRes.status).json({
        error: `Cisco AI error (${aiRes.status}): ${errText}`,
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content ?? '';

    return res.status(200).json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(502).json({ error: message });
  }
}
