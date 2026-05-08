import type { AssistantExecutionMode, HoveredElementContext } from './assistant-types';

export type CodexEditRequest = {
  prompt: string;
  selectedElement?: HoveredElementContext | null;
  executionMode?: AssistantExecutionMode;
};

export type CodexEditResponse = {
  ok: boolean;
  summary: string;
  filesChanged: string[];
  diff: string;
  lastMessage: string;
  warnings: string[];
  error?: string;
};

export async function requestCodexEdit(request: CodexEditRequest): Promise<CodexEditResponse> {
  const response = await fetch('/api/assistant/codex-edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const rawPayload = await response.text();
  let payload: CodexEditResponse;
  try {
    payload = JSON.parse(rawPayload) as CodexEditResponse;
  } catch {
    throw new Error(`Codex bridge returned a non-JSON response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    const message = payload?.error ?? payload?.summary ?? 'Codex bridge request failed.';
    throw new Error(message);
  }

  return payload;
}
