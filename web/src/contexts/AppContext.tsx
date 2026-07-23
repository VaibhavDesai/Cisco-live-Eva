import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ALL_LICENSED_ENTITLEMENTS,
  duplicateDraftAs,
  getActionableStoredRecommendations,
  getRecommendationSourceRevision,
  getRankedRecommendations,
  isMinimumPublishable,
  type AgentDraft,
  type AgentFamily,
  type AgentLifecycle,
  type CapabilityProgress,
  type EntitlementState,
} from '../features/agent-creation/agentCreationModel';

// Types
export interface Agent {
  id: string;
  name: string;
  initials: string;
  description: string;
  gradient: string;
  status: string;
  statusClass: string;
  sessions: string;
  successRate: string;
  messages: string;
  avgResponse: string;
  meta: string;
  knowledgeBases?: string[];
  createdAt?: string;
  updatedAt?: string;
  agentType?: 'Autonomous agent' | 'Scripted agent';
  family?: AgentFamily;
  lifecycle?: AgentLifecycle;
  draftId?: string;
  version?: number;
}

export interface AgentsMap {
  [key: string]: Agent;
}

export interface AgentDraftsMap {
  [key: string]: AgentDraft;
}

export interface AiEngine {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  lastUpdated: string;
  type: 'Custom' | 'System';
  editable: boolean;
}

export type AgentDraftUpdate =
  | Partial<AgentDraft>
  | ((draft: AgentDraft) => AgentDraft);

export interface AppContextValue {
  agents: AgentsMap;
  agentDrafts: AgentDraftsMap;
  entitlements: Record<AgentFamily, EntitlementState>;
  currentAgent: Agent | null;
  openAgents: string[];
  selectAgent: (agentId: string) => void;
  goToAgent: (agentId: string) => void;
  closeAgentNav: (agentId: string) => void;
  addAgent: (newAgent: Partial<Agent>) => Agent;
  createAgentDraft: (draft: AgentDraft) => Agent;
  updateAgentDraft: (agentId: string, update: AgentDraftUpdate) => void;
  publishAgentVersion: (agentId: string) => AgentDraft | null;
  duplicateAgentAs: (agentId: string, target: AgentFamily) => Agent | null;
  dismissRecommendation: (agentId: string, recommendationId: string) => void;
  regenerateAgentRecommendations: (agentId: string) => void;
  setCapabilityProgress: (
    agentId: string,
    capabilityId: string,
    progress: CapabilityProgress,
  ) => void;
  toggleAgentPublish: (agentId: string) => void;
  toast: { message: string; type?: 'default' | 'info' | 'success' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'default' | 'info' | 'success' | 'warning' | 'error') => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  aiEngines: AiEngine[];
  addAiEngine: (engine: Omit<AiEngine, 'id' | 'lastUpdated' | 'type' | 'editable'>) => void;
  updateAiEngine: (id: string, data: { name: string; description: string }) => void;
  removeAiEngine: (id: string) => void;
}

interface PersistedAgentState {
  schemaVersion: 1;
  agents: AgentsMap;
  agentDrafts: AgentDraftsMap;
}

export const APP_AGENT_STORAGE_KEY = 'webex-ai-agent-studio-agents-v1';

const emptyAgentState = (): PersistedAgentState => ({
  schemaVersion: 1,
  agents: {},
  agentDrafts: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readPersistedAgentState = (): PersistedAgentState => {
  if (typeof window === 'undefined') return emptyAgentState();

  try {
    const raw = window.localStorage.getItem(APP_AGENT_STORAGE_KEY);
    if (!raw) return emptyAgentState();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.agents) || !isRecord(parsed.agentDrafts)) {
      return emptyAgentState();
    }
    return {
      schemaVersion: 1,
      agents: parsed.agents as AgentsMap,
      agentDrafts: parsed.agentDrafts as AgentDraftsMap,
    };
  } catch {
    return emptyAgentState();
  }
};

const familyGradient: Record<AgentFamily, string> = {
  calling: 'linear-gradient(135deg, #667eea, #764ba2)',
  contact_center: 'linear-gradient(135deg, #11998e, #38ef7d)',
  internal_assistant: 'linear-gradient(135deg, #4facfe, #00f2fe)',
};

const initialsFor = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AI';

const statusForLifecycle = (lifecycle: AgentLifecycle) => {
  if (lifecycle === 'draft') return 'Ready to Publish';
  if (lifecycle === 'live') return 'Live';
  if (lifecycle === 'deployed') return 'Deployed';
  return 'Published';
};

const statusClassForLifecycle = (lifecycle: AgentLifecycle) =>
  lifecycle === 'draft' ? 'badge-warning' : 'badge-success';

const createUniqueId = (preferred: string, agents: AgentsMap, drafts: AgentDraftsMap) => {
  const normalized = preferred
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'agent';
  if (!agents[normalized] && !drafts[normalized]) return normalized;

  let suffix = 2;
  while (agents[`${normalized}-${suffix}`] || drafts[`${normalized}-${suffix}`]) suffix += 1;
  return `${normalized}-${suffix}`;
};

const selectionsFromDraft = (draft: AgentDraft): string[] => {
  const selections = draft.familyConfiguration.knowledge?.values?.selections;
  return Array.isArray(selections)
    ? selections.filter((selection): selection is string => typeof selection === 'string')
    : [];
};

const agentFromDraft = (draft: AgentDraft, existing?: Agent): Agent => {
  const now = draft.updatedAt || new Date().toISOString();
  const status = statusForLifecycle(draft.lifecycle);
  return {
    id: draft.id,
    name: draft.basics.name,
    initials: initialsFor(draft.basics.name),
    description: draft.basics.description || draft.basics.purpose,
    gradient: existing?.gradient ?? familyGradient[draft.family],
    status,
    statusClass: statusClassForLifecycle(draft.lifecycle),
    sessions: existing?.sessions ?? '—',
    successRate: existing?.successRate ?? '—',
    messages: existing?.messages ?? '—',
    avgResponse: existing?.avgResponse ?? '—',
    meta: `${draft.basics.purpose} • Version ${draft.version}`,
    knowledgeBases: selectionsFromDraft(draft),
    createdAt: existing?.createdAt ?? draft.createdAt,
    updatedAt: now,
    agentType: existing?.agentType ?? 'Autonomous agent',
    family: draft.family,
    lifecycle: draft.lifecycle,
    draftId: draft.id,
    version: draft.version,
  };
};

// Create context
const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [agentState, setAgentState] = useState<PersistedAgentState>(readPersistedAgentState);
  const agentStateRef = useRef(agentState);
  const agents = agentState.agents;
  const agentDrafts = agentState.agentDrafts;
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [openAgents, setOpenAgents] = useState<string[]>([]);

  useEffect(() => {
    agentStateRef.current = agentState;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(APP_AGENT_STORAGE_KEY, JSON.stringify(agentState));
    } catch {
      // Storage can be unavailable in private browsing or when the quota is full.
    }
  }, [agentState]);

  useEffect(() => {
    setCurrentAgent(current => current ? agents[current.id] ?? null : null);
    setOpenAgents(current => current.filter(agentId => Boolean(agents[agentId])));
  }, [agents]);

  const replaceAgentState = useCallback((next: PersistedAgentState) => {
    agentStateRef.current = next;
    setAgentState(next);
  }, []);

  const updateAgentState = useCallback(
    (updater: (current: PersistedAgentState) => PersistedAgentState) => {
      const next = updater(agentStateRef.current);
      replaceAgentState(next);
      return next;
    },
    [replaceAgentState],
  );

  // Toast state
  const [toast, setToast] = useState<{ message: string; type?: 'default' | 'info' | 'success' | 'warning' | 'error' } | null>(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Shared AI engine list
  const [aiEngines, setAiEngines] = useState<AiEngine[]>([
    {
      id: 'sys-1',
      name: 'Webex AI Pro-US 1.0',
      description: 'US-region optimized Webex AI engine',
      createdBy: 'System',
      lastUpdated: "28 Feb' 25, 1:08 AM",
      type: 'System',
      editable: false,
    },
    {
      id: 'sys-2',
      name: 'Webex AI Pro 1.0',
      description: 'General-purpose Webex AI engine',
      createdBy: 'System',
      lastUpdated: "28 Feb' 25, 1:08 AM",
      type: 'System',
      editable: false,
    },
    {
      id: 'custom-1',
      name: 'Custom engine name',
      description: 'Custom LLM integration for tailored AI workflows',
      createdBy: 'Claire K',
      lastUpdated: "28 Feb' 25, 1:08 AM",
      type: 'Custom',
      editable: true,
    },
  ]);

  const addAiEngine = useCallback((engine: Omit<AiEngine, 'id' | 'lastUpdated' | 'type' | 'editable'>) => {
    const newEngine: AiEngine = {
      ...engine,
      id: String(Date.now()),
      lastUpdated: new Date().toLocaleString('en-US', {
        day: '2-digit', month: 'short', year: '2-digit',
        hour: 'numeric', minute: '2-digit',
      }),
      type: 'Custom',
      editable: true,
    };
    setAiEngines(previous => [newEngine, ...previous]);
  }, []);

  const updateAiEngine = useCallback((id: string, data: { name: string; description: string }) => {
    setAiEngines(previous => previous.map(engine =>
      engine.id === id
        ? {
            ...engine,
            name: data.name,
            description: data.description,
            lastUpdated: new Date().toLocaleString('en-US', {
              day: '2-digit', month: 'short', year: '2-digit',
              hour: 'numeric', minute: '2-digit',
            }),
          }
        : engine,
    ));
  }, []);

  const removeAiEngine = useCallback((id: string) => {
    setAiEngines(previous => previous.filter(engine => engine.id !== id));
  }, []);

  const selectAgent = useCallback((agentId: string) => {
    const agent = agentStateRef.current.agents[agentId];
    if (!agent) return;
    setCurrentAgent(agent);
    setOpenAgents(previous => previous.includes(agentId) ? previous : [...previous, agentId]);
  }, []);

  const goToAgent = useCallback((agentId: string) => {
    const agent = agentStateRef.current.agents[agentId];
    if (agent) setCurrentAgent(agent);
  }, []);

  const closeAgentNav = useCallback((agentId: string) => {
    setOpenAgents(previous => previous.filter(id => id !== agentId));
    setCurrentAgent(current => current?.id === agentId ? null : current);
  }, []);

  const showToast = useCallback((message: string, type?: 'default' | 'info' | 'success' | 'warning' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Backward-compatible creator used by the existing prototype surfaces.
  const addAgent = useCallback((newAgent: Partial<Agent>): Agent => {
    const snapshot = agentStateRef.current;
    const name = newAgent.name?.trim() || 'Untitled agent';
    const description = newAgent.description?.trim() || 'A new AI agent';
    const id = createUniqueId(newAgent.id || name, snapshot.agents, snapshot.agentDrafts);
    const createdAt = newAgent.createdAt ?? new Date().toISOString();
    const agent: Agent = {
      id,
      name,
      description,
      gradient: newAgent.gradient ?? 'linear-gradient(135deg, #667eea, #764ba2)',
      status: newAgent.status ?? 'Ready to Publish',
      initials: newAgent.initials ?? initialsFor(name),
      statusClass: newAgent.statusClass ?? 'badge-warning',
      sessions: newAgent.sessions ?? '—',
      successRate: newAgent.successRate ?? '—',
      messages: newAgent.messages ?? '—',
      avgResponse: newAgent.avgResponse ?? '—',
      meta: newAgent.meta ?? `${description} • Just created`,
      knowledgeBases: newAgent.knowledgeBases ? [...newAgent.knowledgeBases] : [],
      createdAt,
      updatedAt: newAgent.updatedAt ?? createdAt,
      agentType: newAgent.agentType ?? 'Autonomous agent',
      family: newAgent.family,
      lifecycle: newAgent.lifecycle,
      draftId: newAgent.draftId,
      version: newAgent.version,
    };

    replaceAgentState({
      ...snapshot,
      agents: { ...snapshot.agents, [id]: agent },
    });
    setCurrentAgent(agent);
    setOpenAgents(previous => previous.includes(id) ? previous : [...previous, id]);
    return agent;
  }, [replaceAgentState]);

  const createAgentDraft = useCallback((draft: AgentDraft): Agent => {
    const snapshot = agentStateRef.current;
    const id = createUniqueId(draft.id || draft.basics.name, snapshot.agents, snapshot.agentDrafts);
    const now = new Date().toISOString();
    const persistedDraft: AgentDraft = {
      ...draft,
      id,
      entitlement: ALL_LICENSED_ENTITLEMENTS[draft.family],
      basics: { ...draft.basics },
      instructions: { ...draft.instructions },
      language: {
        ...draft.language,
        additionalLanguages: [...draft.language.additionalLanguages],
      },
      familyConfiguration: Object.fromEntries(
        Object.entries(draft.familyConfiguration).map(([key, value]) => [
          key,
          { ...value, values: value.values ? structuredClone(value.values) : {} },
        ]),
      ),
      recommendations: draft.recommendations.map(item => ({ ...item })),
      recommendationsStale: Boolean(draft.recommendationsStale),
      recommendationSourceRevision: draft.recommendationSourceRevision || getRecommendationSourceRevision(draft),
      dismissedRecommendationIds: [...draft.dismissedRecommendationIds],
      chatHistory: draft.chatHistory.map(message => ({ ...message })),
      previewState: { ...draft.previewState },
      deploymentReferences: draft.deploymentReferences.map(reference => ({ ...reference })),
      createdAt: draft.createdAt || now,
      updatedAt: now,
    };
    if (!persistedDraft.recommendationsStale) {
      persistedDraft.recommendationSourceRevision = getRecommendationSourceRevision(persistedDraft);
      persistedDraft.recommendations = getRankedRecommendations(persistedDraft);
    }
    const agent = agentFromDraft(persistedDraft);

    replaceAgentState({
      ...snapshot,
      agents: { ...snapshot.agents, [id]: agent },
      agentDrafts: { ...snapshot.agentDrafts, [id]: persistedDraft },
    });
    setCurrentAgent(agent);
    setOpenAgents(previous => previous.includes(id) ? previous : [...previous, id]);
    return agent;
  }, [replaceAgentState]);

  const updateAgentDraft = useCallback((agentId: string, update: AgentDraftUpdate) => {
    const nextState = updateAgentState(current => {
      const existingDraft = current.agentDrafts[agentId];
      if (!existingDraft) return current;
      const requestedDraft = typeof update === 'function'
        ? update(existingDraft)
        : { ...existingDraft, ...update };
      const now = new Date().toISOString();
      const existingSourceRevision = getRecommendationSourceRevision(existingDraft);
      const nextSourceRevision = getRecommendationSourceRevision(requestedDraft);
      const generatedSourceRevision = existingDraft.recommendationSourceRevision || existingSourceRevision;
      const sourceChanged = existingSourceRevision !== nextSourceRevision;
      const recommendationsStale = sourceChanged
        ? generatedSourceRevision !== nextSourceRevision
        : Boolean(requestedDraft.recommendationsStale);
      const nextDraft: AgentDraft = {
        ...requestedDraft,
        id: agentId,
        family: existingDraft.family,
        entitlement: ALL_LICENSED_ENTITLEMENTS[existingDraft.family],
        basics: { ...requestedDraft.basics },
        instructions: { ...requestedDraft.instructions },
        language: {
          ...requestedDraft.language,
          additionalLanguages: [...requestedDraft.language.additionalLanguages],
        },
        recommendationsStale,
        recommendationSourceRevision: recommendationsStale
          ? generatedSourceRevision
          : nextSourceRevision,
        updatedAt: now,
      };
      nextDraft.recommendations = recommendationsStale
        ? getActionableStoredRecommendations(nextDraft, requestedDraft.recommendations)
          .map(item => ({ ...item }))
        : getRankedRecommendations(nextDraft);
      const nextAgent = agentFromDraft(nextDraft, current.agents[agentId]);
      return {
        ...current,
        agents: { ...current.agents, [agentId]: nextAgent },
        agentDrafts: { ...current.agentDrafts, [agentId]: nextDraft },
      };
    });
    const updated = nextState.agents[agentId];
    if (updated) setCurrentAgent(current => current?.id === agentId ? updated : current);
  }, [updateAgentState]);

  const dismissRecommendation = useCallback((agentId: string, recommendationId: string) => {
    updateAgentDraft(agentId, draft => {
      if (draft.dismissedRecommendationIds.includes(recommendationId)) return draft;
      return {
        ...draft,
        dismissedRecommendationIds: [...draft.dismissedRecommendationIds, recommendationId],
        recommendations: draft.recommendations.filter(item => item.id !== recommendationId),
      };
    });
  }, [updateAgentDraft]);

  const regenerateAgentRecommendations = useCallback((agentId: string) => {
    updateAgentDraft(agentId, draft => ({
      ...draft,
      recommendationsStale: false,
      recommendationSourceRevision: getRecommendationSourceRevision(draft),
      recommendations: getRankedRecommendations(draft),
    }));
  }, [updateAgentDraft]);

  const setCapabilityProgress = useCallback((
    agentId: string,
    capabilityId: string,
    progress: CapabilityProgress,
  ) => {
    updateAgentDraft(agentId, draft => {
      const capability = draft.familyConfiguration[capabilityId];
      if (!capability) return draft;
      return {
        ...draft,
        familyConfiguration: {
          ...draft.familyConfiguration,
          [capabilityId]: {
            ...capability,
            progress,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }, [updateAgentDraft]);

  const publishAgentVersion = useCallback((agentId: string): AgentDraft | null => {
    const snapshot = agentStateRef.current;
    const currentDraft = snapshot.agentDrafts[agentId];
    if (!currentDraft) return null;
    const authorizedDraft: AgentDraft = {
      ...currentDraft,
      entitlement: ALL_LICENSED_ENTITLEMENTS[currentDraft.family],
    };
    if (!isMinimumPublishable(authorizedDraft)) return null;

    const now = new Date().toISOString();
    const publishedDraft: AgentDraft = {
      ...authorizedDraft,
      lifecycle: 'published',
      version: currentDraft.lifecycle === 'draft' ? currentDraft.version : currentDraft.version + 1,
      updatedAt: now,
    };
    if (!publishedDraft.recommendationsStale) {
      publishedDraft.recommendationSourceRevision = getRecommendationSourceRevision(publishedDraft);
      publishedDraft.recommendations = getRankedRecommendations(publishedDraft);
    }
    const publishedAgent = agentFromDraft(publishedDraft, snapshot.agents[agentId]);
    replaceAgentState({
      ...snapshot,
      agents: { ...snapshot.agents, [agentId]: publishedAgent },
      agentDrafts: { ...snapshot.agentDrafts, [agentId]: publishedDraft },
    });
    setCurrentAgent(current => current?.id === agentId ? publishedAgent : current);
    return publishedDraft;
  }, [replaceAgentState]);

  const duplicateAgentAs = useCallback((agentId: string, target: AgentFamily): Agent | null => {
    const source = agentStateRef.current.agentDrafts[agentId];
    if (!source || ALL_LICENSED_ENTITLEMENTS[target] !== 'licensed') return null;
    return createAgentDraft(duplicateDraftAs(source, target));
  }, [createAgentDraft]);

  // Backward-compatible status toggle. New creation surfaces should use publishAgentVersion.
  const toggleAgentPublish = useCallback((agentId: string) => {
    const nextState = updateAgentState(current => {
      const agent = current.agents[agentId];
      if (!agent) return current;
      const isPublished = agent.status === 'Published';
      const updatedAgent: Agent = {
        ...agent,
        status: isPublished ? 'Ready to Publish' : 'Published',
        statusClass: isPublished ? 'badge-warning' : 'badge-success',
        lifecycle: isPublished ? 'draft' : 'published',
        updatedAt: new Date().toISOString(),
      };
      const draft = current.agentDrafts[agentId];
      const updatedDraft = draft
        ? {
            ...draft,
            lifecycle: (isPublished ? 'draft' : 'published') as AgentLifecycle,
            updatedAt: updatedAgent.updatedAt,
          }
        : null;
      return {
        ...current,
        agents: { ...current.agents, [agentId]: updatedAgent },
        agentDrafts: updatedDraft
          ? { ...current.agentDrafts, [agentId]: updatedDraft }
          : current.agentDrafts,
      };
    });
    const updated = nextState.agents[agentId];
    if (updated) setCurrentAgent(current => current?.id === agentId ? updated : current);
  }, [updateAgentState]);

  const value: AppContextValue = {
    agents,
    agentDrafts,
    entitlements: ALL_LICENSED_ENTITLEMENTS,
    currentAgent,
    openAgents,
    selectAgent,
    goToAgent,
    closeAgentNav,
    addAgent,
    createAgentDraft,
    updateAgentDraft,
    publishAgentVersion,
    duplicateAgentAs,
    dismissRecommendation,
    regenerateAgentRecommendations,
    setCapabilityProgress,
    toggleAgentPublish,
    toast,
    showToast,
    isCreateModalOpen,
    setIsCreateModalOpen,
    aiEngines,
    addAiEngine,
    updateAiEngine,
    removeAiEngine,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}

export default AppContext;
