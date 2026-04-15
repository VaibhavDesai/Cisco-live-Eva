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

const SYSTEM_PROMPT = `You are a guardrail policy assistant for an AI Agent Studio. Your job is to help users create and refine custom guardrail profiles that govern how an AI agent behaves.

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
