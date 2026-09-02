import type { PolicyOverview } from '../pages/agent/PolicyStudio';

export interface PolicyAiResponse {
  reply: string;
  name?: string;
  description?: string;
  overview?: PolicyOverview;
  insights?: string;
  evaluation?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentGoalDraft {
  acknowledgement: string;
  systemPrompt: string;
}

function buildContinuityAgentGoalDraft(goal: string): AgentGoalDraft {
  const normalizedGoal = goal.replace(/\s+/g, ' ').trim();

  return {
    acknowledgement: 'I’ve drafted a first-pass setup from your goal. We can refine it together as you configure the agent.',
    systemPrompt: `## Role
You are a helpful, reliable AI agent configured to support the user’s stated goal.

## Goal
Help the user make progress toward this goal: “${normalizedGoal}”

## Conversation behavior
- Clarify the user’s intent when the request is ambiguous.
- Give concise, practical next steps based on the information available.
- Be transparent about what you know and what still needs confirmation.
- Keep the conversation warm, professional, and focused on the user’s goal.

## Boundaries and safety
- Do not invent facts, policies, tools, integrations, or outcomes.
- Do not take consequential action without the user’s explicit confirmation.
- Protect personal and confidential information, and ask for only what is necessary.
- If the request is unsafe or outside the configured goal, explain the limitation and offer a safe alternative.

## Escalation
Escalate when the user needs a decision, access, approval, or support that this agent cannot provide. Summarize the relevant context and clearly state what is needed next.`,
  };
}

function getCompanionApiUrl(path: string): string {
  const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;
  if (!chatApiUrl) return `/api${path}`;

  const baseUrl = chatApiUrl
    .replace(/\/chat\/?$/, '')
    .replace(/\/$/, '');

  return `${baseUrl}${path}`;
}

function normalizeCompanionApiUrl(configuredUrl: string | undefined, path: string): string {
  if (!configuredUrl) return getCompanionApiUrl(path);

  const trimmedUrl = configuredUrl.trim();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = trimmedUrl
    .replace(/\/chat\/?$/, '')
    .replace(new RegExp(`${normalizedPath.replace(/\//g, '\\/')}/?$`), '')
    .replace(/\/$/, '');

  return `${baseUrl}${normalizedPath}`;
}

const SYSTEM_PROMPT = `You are a guardrail policy assistant for an AI Agent Studio. Your job is to help users create and refine adaptive guardrail profiles that govern how an AI agent behaves.

When the user describes a policy they want to create, respond with:
1. A conversational explanation of what you created
2. A JSON block (fenced with \`\`\`json) containing the structured policy data

The JSON block MUST follow this exact schema:
\`\`\`json
{
  "name": "Short policy name",
  "description": "One-sentence description of what this guardrail does",
  "overview": {
    "blocked": [{"text": "Rule describing what is blocked"}],
    "allowed": [{"text": "Rule describing what is allowed"}],
    "edgeCases": [{"text": "Rule for ambiguous situations"}]
  }
}
\`\`\`

Rules:
- "blocked" should have 2-5 specific rules about what the AI must NOT do
- "allowed" should have 1-3 rules about what IS permitted
- "edgeCases" should have 1-3 rules for ambiguous situations
- Keep each rule text concise (one sentence)
- If the user is refining an existing policy (follow-up message), return an updated JSON block with the full revised policy
- If the user asks a general question (not creating/refining a policy), respond conversationally WITHOUT a JSON block

When the user asks to ANALYZE the policy or identify improvement opportunities, include an "insights" field in the JSON:
\`\`\`json
{
  "insights": "A short summary of discovered patterns and improvement recommendations (2-4 sentences)."
}
\`\`\`

When the user asks to EVALUATE policy efficiency or effectiveness, include an "evaluation" field in the JSON:
\`\`\`json
{
  "evaluation": "A short assessment of coverage, gaps, and an overall quality rating (2-4 sentences)."
}
\`\`\`

You may combine insights, evaluation, and policy fields in a single JSON block if the user asks for multiple things.`;

export async function sendPolicyChat(
  messages: ChatMessage[],
  existingPolicy?: { name: string; description: string; overview: import('../pages/agent/PolicyStudio').PolicyOverview },
): Promise<PolicyAiResponse> {
  const systemMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (existingPolicy) {
    systemMessages.push({
      role: 'system',
      content: `The user is editing an existing policy. Here is the current policy:\n\n\`\`\`json\n${JSON.stringify(existingPolicy, null, 2)}\n\`\`\`\n\nWhen the user asks for changes, update the existing policy rather than creating from scratch. Always return the full updated JSON block.`,
    });
  }

  const fullMessages: ChatMessage[] = [
    ...systemMessages,
    ...messages,
  ];

  const apiUrl = import.meta.env.VITE_CHAT_API_URL || '/api/chat';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: fullMessages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error (${res.status})`);
  }

  const data = await res.json();
  const content: string = data.content ?? '';

  return parseAiResponse(content);
}

export interface OptimizeResult {
  optimizedText: string;
  changes: string[];
  reasoning: string[];
}

const OPTIMIZE_SYSTEM_PROMPT = `You are an expert AI prompt engineer. Your job is to optimize agent system instructions to be clearer, more structured, and more effective.

Given the user's original instructions, produce an improved version and a summary of changes.

You MUST respond with a JSON block (fenced with \`\`\`json) containing:
\`\`\`json
{
  "optimizedText": "The full improved instructions text",
  "changes": ["Change 1 description", "Change 2 description"],
  "reasoning": ["Reason 1 for the change", "Reason 2 for the change"]
}
\`\`\`

Rules:
- Preserve the original intent, tone, and all domain-specific details
- Improve structure with clear sections (use markdown #### headers)
- Remove redundancies and tighten language
- Preserve any template variables like {{variable_name}}
- "changes" should list 3-6 specific improvements made
- "reasoning" should list 3-6 explanations for why each change improves the prompt
- Keep the optimized text concise but comprehensive`;

export async function optimizeInstructions(instructions: string): Promise<OptimizeResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: OPTIMIZE_SYSTEM_PROMPT },
    { role: 'user', content: `Please optimize these agent instructions:\n\n${instructions}` },
  ];

  const apiUrl = import.meta.env.VITE_CHAT_API_URL || '/api/chat';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error (${res.status})`);
  }

  const data = await res.json();
  const content: string = data.content ?? '';

  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) {
    throw new Error('Failed to parse optimization result');
  }

  const parsed = JSON.parse(jsonMatch[1].trim());
  return {
    optimizedText: parsed.optimizedText || instructions,
    changes: parsed.changes || [],
    reasoning: parsed.reasoning || [],
  };
}

/* Generic chat passthrough used by the conversational Eva surfaces (the
   main chat experience and the canvas mini-Eva). Unlike `sendPolicyChat`
   and `optimizeInstructions`, this one doesn't try to parse JSON out of
   the reply — it just returns whatever the LLM responded with so the
   caller can render it as a normal assistant message. */
export async function sendEvaChat(messages: ChatMessage[]): Promise<string> {
  const apiUrl = import.meta.env.VITE_CHAT_API_URL || '/api/chat';
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error (${res.status})`);
  }

  const data = await res.json();
  const content: string = typeof data.content === 'string' ? data.content : '';
  return content.trim();
}

/**
 * Turns the first plain-language agent goal into an instruction set that can
 * travel with the draft. The browser only calls the local /api/chat proxy, so
 * the model credential stays on the server side.
 */
export async function generateAgentGoalDraft(goal: string): Promise<AgentGoalDraft> {
  try {
    const reply = await sendEvaChat([
      {
        role: 'system',
        content: `You are helping an admin create an AI agent. Turn the user's initial goal into a realistic first draft of the agent's system instructions.

Return ONLY a fenced JSON object in exactly this shape:
\`\`\`json
{
  "acknowledgement": "One concise, natural sentence confirming the goal and saying you will refine the setup with the user.",
  "systemPrompt": "A complete agent system prompt in Markdown. Include ## Role, ## Goal, ## Conversation behavior, ## Boundaries and safety, and ## Escalation. Make it specific to the user's goal. Do not invent company facts, policies, tools, or integrations."
}
\`\`\`

The system prompt is for the agent being created, not for the setup assistant. Keep it practical, specific, and under 500 words.`,
      },
      { role: 'user', content: goal },
    ]);

    const fencedJson = reply.match(/```json\s*([\s\S]*?)```/i);
    const rawJson = reply.match(/\{[\s\S]*\}/);
    const jsonText = fencedJson?.[1] ?? rawJson?.[0];
    if (!jsonText) throw new Error('The model did not return a structured agent draft.');

    const parsed = JSON.parse(jsonText.trim()) as Partial<AgentGoalDraft>;
    if (
      typeof parsed.acknowledgement !== 'string' ||
      !parsed.acknowledgement.trim() ||
      typeof parsed.systemPrompt !== 'string' ||
      !parsed.systemPrompt.trim()
    ) {
      throw new Error('The model returned an incomplete agent draft.');
    }

    return {
      acknowledgement: parsed.acknowledgement.trim(),
      systemPrompt: parsed.systemPrompt.trim(),
    };
  } catch {
    // Keep the guided setup moving when the hosted model is temporarily
    // unavailable. The Cisco LLM remains the primary path whenever it
    // responds, while this local continuity draft avoids exposing backend
    // details to the person configuring the agent.
    return buildContinuityAgentGoalDraft(goal);
  }
}

export async function getElevenLabsConversationSignedUrl(): Promise<string> {
  const apiUrl = normalizeCompanionApiUrl(
    import.meta.env.VITE_CONVAI_SIGNED_URL_API_URL,
    '/convai/signed-url',
  );
  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  } catch {
    throw new Error(
      'Voice preview service is unreachable. Configure VITE_CONVAI_SIGNED_URL_API_URL or VITE_CHAT_API_URL, or run the Vite dev proxy with ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID.',
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Voice preview signed URL request failed (${res.status})`);
  }

  const data = await res.json();
  if (typeof data.signedUrl !== 'string' || !data.signedUrl.startsWith('wss://')) {
    throw new Error('Signed conversation URL was not returned');
  }

  return data.signedUrl;
}

export function getVoicePreviewErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (!message || message === 'Failed to fetch') {
    return 'Voice preview service is unreachable. Configure VITE_CONVAI_SIGNED_URL_API_URL or VITE_CHAT_API_URL, or run the Vite dev proxy with ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID.';
  }

  return message;
}

function parseAiResponse(content: string): PolicyAiResponse {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);

  if (!jsonMatch) {
    return { reply: content.trim() };
  }

  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
    const replyText = content
      .replace(/```json[\s\S]*?```/, '')
      .trim();

    return {
      reply: replyText || `Created policy **${parsed.name}**`,
      name: parsed.name,
      description: parsed.description,
      overview: parsed.overview,
      insights: parsed.insights,
      evaluation: parsed.evaluation,
    };
  } catch {
    return { reply: content.trim() };
  }
}
