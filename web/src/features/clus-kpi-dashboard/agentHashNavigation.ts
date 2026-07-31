import type { AgentPageTab } from './components/PageHeader';

/**
 * Path portion of `#/agent/<encodedName>?...` — excludes query string so `%20` names parse correctly.
 */
export function parseAgentPathFromHash(hash: string): string | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  const pathOnly = normalized.split('?')[0] ?? '';
  if (!pathOnly.startsWith('/agent/')) return null;
  const encoded = pathOnly.slice('/agent/'.length);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

/** `?primaryTab=` on the agent hash — supports legacy `analytics`. */
export function parsePrimaryTabFromAgentHash(hash: string): AgentPageTab | null {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  const queryPart = normalized.split('?')[1];
  if (!queryPart) return null;
  const raw = new URLSearchParams(queryPart).get('primaryTab')?.trim().toLowerCase();
  if (!raw) return null;

  const map: Record<string, AgentPageTab> = {
    observability: 'Observability',
    analytics: 'Observability',
    configuration: 'Configuration',
    interactions: 'Interactions',
    testing: 'Testing',
    history: 'History',
  };

  return map[raw] ?? null;
}

/** Hash segment for React Router `hash` / `window.location.hash` after `#` (starts with `/agent/`). */
export function clusKpiAgentObservabilityHashSegment(agentName: string): string {
  return `/agent/${encodeURIComponent(agentName)}?primaryTab=observability`;
}

/**
 * Full URL hash for `#/agent/<name>?primaryTab=observability` (KPI dashboard agent deep link).
 */
export function buildClusKpiAgentObservabilityHash(agentName: string): string {
  return `#${clusKpiAgentObservabilityHashSegment(agentName)}`;
}
