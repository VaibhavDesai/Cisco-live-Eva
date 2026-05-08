import type { EvaFieldSuggestion, EvaSuggestionField } from './types';

const SUGGESTION_FIELDS = new Set<EvaSuggestionField>([
  'welcomeMessage',
  'agentDescription',
  'instructionPrompt',
  'customRule',
]);

export const FIELD_SUGGESTION_RESPONSE_RULES = `When the user asks you to rewrite, change, improve, or draft a configurable field, return a concise recommendation plus a fenced JSON block in this exact shape:
\`\`\`json
{
  "suggestion": {
    "field": "welcomeMessage",
    "value": "The complete replacement text to apply"
  }
}
\`\`\`
Allowed field values are "welcomeMessage", "agentDescription", "instructionPrompt", and "customRule".
For welcomeMessage, agentDescription, and instructionPrompt, "value" must be the complete replacement text, not a partial edit.
For customRule, "value" should be one complete guardrail rule to add.
If the user asks for another option, produce a different suggestion from the previous one.
Do not include this JSON block for general questions, trade-off explanations, navigation help, or small talk.`;

export function extractFieldSuggestionAndProse(
  content: string,
  originalRequest: string,
): { prose: string; suggestion?: EvaFieldSuggestion } {
  const match = content.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { prose: content.trim() };

  try {
    const parsed = JSON.parse(match[1].trim()) as {
      suggestion?: {
        field?: unknown;
        value?: unknown;
      };
    };
    const field = parsed.suggestion?.field;
    const value = parsed.suggestion?.value;

    if (
      typeof field === 'string' &&
      SUGGESTION_FIELDS.has(field as EvaSuggestionField) &&
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      const prose = content.replace(/```json[\s\S]*?```/, '').trim();
      return {
        prose: prose || 'Here is a suggestion you can apply:',
        suggestion: {
          field: field as EvaSuggestionField,
          value: value.trim(),
          originalRequest,
        },
      };
    }
  } catch {
    /* Malformed JSON — fall through and render the raw reply. */
  }

  return { prose: content.trim() };
}

export function getFieldSuggestionLabel(field: EvaSuggestionField): string {
  switch (field) {
    case 'welcomeMessage':
      return 'welcome message';
    case 'agentDescription':
      return 'description';
    case 'instructionPrompt':
      return 'instructions';
    case 'customRule':
      return 'custom guardrail';
  }
}
