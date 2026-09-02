export type AgentReleaseState = {
  savedRevision: string;
  pendingPublishRevision: string | null;
};

const agentReleaseStorageKey = (agentId: string) => `eva-agent-overview-release-v1:${agentId}`;

export function readAgentReleaseState(
  agentId: string | undefined,
  currentRevision: string,
): AgentReleaseState {
  const fallback = {
    savedRevision: currentRevision,
    pendingPublishRevision: null,
  };
  if (!agentId || typeof window === 'undefined') return fallback;

  try {
    const stored = JSON.parse(window.localStorage.getItem(agentReleaseStorageKey(agentId)) || 'null');
    if (
      stored
      && typeof stored.savedRevision === 'string'
      && (stored.pendingPublishRevision === null || typeof stored.pendingPublishRevision === 'string')
    ) {
      return stored as AgentReleaseState;
    }
  } catch {
    // Ignore unavailable or invalid browser storage and use the current revision.
  }

  return fallback;
}

export function persistAgentReleaseState(agentId: string, state: AgentReleaseState) {
  try {
    window.localStorage.setItem(agentReleaseStorageKey(agentId), JSON.stringify(state));
  } catch {
    // The release control still works for this session when storage is unavailable.
  }
}
