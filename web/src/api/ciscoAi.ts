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
  systemPrompt: string;
  suggestedName: string;
  welcomeMessage: string;
  knowledgeBases: AgentGoalRecommendation[];
  actions: AgentGoalRecommendation[];
  adaptiveGuardrail: AgentGoalRecommendation;
}

export interface AgentGoalRecommendation {
  name: string;
  description: string;
}

export function normalizeModelMultilineText(value: string): string {
  return value.replace(/\\r\\n|\\n|\\r/g, '\n');
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function buildGoalLabel(goal: string): string {
  const normalized = goal
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(?:please\s+)?(?:create|build|make|set up|design)\s+(?:an?\s+)?/i, '')
    .replace(/^(?:an?\s+)/i, '')
    .replace(/[.!?]+$/, '')
    .trim();
  const concise = normalized.split(/\b(?:that|which|who|to help|for customers|for users)\b/i)[0].trim();
  const label = titleCase(concise || 'Helpful AI Agent');
  return /\bagent\b/i.test(label) ? label : `${label} Agent`;
}

export function buildContinuityAgentGoalDraft(goal: string): AgentGoalDraft {
  const normalizedGoal = goal.replace(/\s+/g, ' ').trim();
  const suggestedName = buildGoalLabel(normalizedGoal);
  const subject = suggestedName.replace(/\s+Agent$/i, '').trim() || 'Customer Support';

  return {
    suggestedName,
    welcomeMessage: `Hi, I’m the ${suggestedName}. How can I help you with ${subject.toLowerCase()} today?`,
    knowledgeBases: [
      {
        name: `${subject} Policies and Guidance`,
        description: `Approved policies, requirements, and guidance for ${subject.toLowerCase()}.`,
      },
      {
        name: `${subject} FAQs`,
        description: `Common questions and answers related to ${subject.toLowerCase()}.`,
      },
      {
        name: `${subject} Support Playbook`,
        description: `Troubleshooting, escalation, and support procedures for ${subject.toLowerCase()}.`,
      },
    ],
    actions: [
      {
        name: `Start ${subject} Request`,
        description: `Collect the required details and begin a ${subject.toLowerCase()} request.`,
      },
      {
        name: `Check ${subject} Status`,
        description: `Look up the current status of a ${subject.toLowerCase()} request.`,
      },
      {
        name: `Escalate ${subject} Support`,
        description: `Transfer the conversation with context when specialist help is needed.`,
      },
    ],
    adaptiveGuardrail: {
      name: `${subject} Safety and Accuracy`,
      description: `Steer conversations back to approved ${subject.toLowerCase()} guidance and escalate sensitive or unsupported requests.`,
    },
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
  const continuityDraft = buildContinuityAgentGoalDraft(goal);
  // Do not turn one transient browser or edge-network failure into a static
  // setup. The conversational creator gets one retry before continuity UI.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const reply = await sendEvaChat([
        {
          role: 'system',
          content: `You are helping an admin create an AI agent. Turn the user's initial goal into a realistic first draft of the agent's system instructions.

Return ONLY a fenced JSON object in exactly this shape:
\`\`\`json
{
  "systemPrompt": "A complete agent system prompt in Markdown. Include ## Role, ## Goal, ## Conversation behavior, ## Boundaries and safety, and ## Escalation. Make it specific to the user's goal. Do not invent company facts, policies, tools, or integrations.",
  "suggestedName": "A short, specific name for this agent",
  "welcomeMessage": "A natural first-person welcome message specific to the goal",
  "knowledgeBases": [
    { "name": "A relevant knowledge base name", "description": "What this knowledge base contains" },
    { "name": "A second relevant knowledge base name", "description": "What this knowledge base contains" },
    { "name": "A third relevant knowledge base name", "description": "What this knowledge base contains" }
  ],
  "actions": [
    { "name": "A concrete action name", "description": "What the action does" },
    { "name": "A second concrete action name", "description": "What the action does" },
    { "name": "A third concrete action name", "description": "What the action does" }
  ],
  "adaptiveGuardrail": {
    "name": "A short guardrail name specific to this goal",
    "description": "What risky or unsupported behavior this guardrail prevents and how it safely redirects the conversation"
  }
}
\`\`\`

The system prompt is for the agent being created, not for the setup assistant. Keep it practical, specific, and under 250 words.`,
        },
        { role: 'user', content: goal },
      ]);

      const fencedJson = reply.match(/```json\s*([\s\S]*?)```/i);
      const rawJson = reply.match(/\{[\s\S]*\}/);
      const jsonText = fencedJson?.[1] ?? rawJson?.[0];
      if (!jsonText) throw new Error('The model did not return a structured agent draft.');

      const parsed = JSON.parse(jsonText.trim()) as Partial<AgentGoalDraft>;
      if (
        typeof parsed.systemPrompt !== 'string' ||
        !parsed.systemPrompt.trim()
      ) {
        throw new Error('The model returned an incomplete agent draft.');
      }

      const normalizeRecommendations = (
        value: unknown,
        fallback: AgentGoalRecommendation[],
      ): AgentGoalRecommendation[] => {
        if (!Array.isArray(value)) return fallback;
        const recommendations = value
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
          .map(item => ({
            name: typeof item.name === 'string' ? item.name.trim() : '',
            description: typeof item.description === 'string' ? item.description.trim() : '',
          }))
          .filter(item => item.name && item.description)
          .slice(0, 3);
        return recommendations.length > 0 ? recommendations : fallback;
      };

      return {
        systemPrompt: normalizeModelMultilineText(parsed.systemPrompt).trim(),
        suggestedName: typeof parsed.suggestedName === 'string' && parsed.suggestedName.trim()
          ? parsed.suggestedName.trim()
          : continuityDraft.suggestedName,
        welcomeMessage: typeof parsed.welcomeMessage === 'string' && parsed.welcomeMessage.trim()
          ? parsed.welcomeMessage.trim()
          : continuityDraft.welcomeMessage,
        knowledgeBases: normalizeRecommendations(parsed.knowledgeBases, continuityDraft.knowledgeBases),
        actions: normalizeRecommendations(parsed.actions, continuityDraft.actions),
        adaptiveGuardrail: parsed.adaptiveGuardrail
          && typeof parsed.adaptiveGuardrail.name === 'string'
          && parsed.adaptiveGuardrail.name.trim()
          && typeof parsed.adaptiveGuardrail.description === 'string'
          && parsed.adaptiveGuardrail.description.trim()
          ? {
              name: parsed.adaptiveGuardrail.name.trim(),
              description: parsed.adaptiveGuardrail.description.trim(),
            }
          : continuityDraft.adaptiveGuardrail,
      };
    } catch (error) {
      // Keep the failure inspectable in browser diagnostics without exposing
      // backend details in the guided creation UI.
      console.warn('[Cisco LLM] Agent draft request failed', error);
      // Retry once against the Cisco Worker before using continuity UI.
    }
  }

  return continuityDraft;
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
