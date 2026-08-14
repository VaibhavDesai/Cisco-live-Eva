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
import {
  buildCiscoLiveInstructions,
  buildDefaultCiscoLiveInstructions,
  buildCiscoLiveSeed,
  EAGLE_GREEN_ACTION_CONTROL_ID,
  EAGLE_GREEN_ACTION_CONTROL_VALUES,
  EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID,
  EAGLE_GREEN_HANDOVER_ACTION_ID,
  EAGLE_GREEN_HANDOVER_CONTROL_ID,
  EAGLE_GREEN_LEGACY_VIP_RESERVATION_INSTRUCTIONS,
} from '../demo/ciscoLiveSeed';
import {
  CISCO_LIVE_AGENTS,
  CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL,
  CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_SECURITY_RULE,
  CISCO_LIVE_PRIMARY_AGENT_ID,
  CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL,
} from '../demo/ciscoLiveDemo';

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
  schemaVersion: 14;
  agents: AgentsMap;
  agentDrafts: AgentDraftsMap;
}

export const APP_AGENT_STORAGE_KEY = 'webex-ai-agent-studio-agents-v1';

const emptyAgentState = (): PersistedAgentState => ({
  schemaVersion: 14,
  agents: {},
  agentDrafts: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const LEGACY_LARGE_RESERVATION_GUARDRAIL_ID = 'custom-large-reservation-approval';
const LEGACY_LARGE_RESERVATION_GUARDRAIL_NAME = 'large reservation approval';
const RETIRED_PRIMARY_PREBUILT_GUARDRAIL_NAMES = new Set(['toxicity', 'jailbreak']);

const normalizedGuardrailField = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isLegacyLargeReservationGuardrail = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  return normalizedGuardrailField(value.id) === LEGACY_LARGE_RESERVATION_GUARDRAIL_ID
    || normalizedGuardrailField(value.name) === LEGACY_LARGE_RESERVATION_GUARDRAIL_NAME;
};

const isCurrentVipConfidentialityGuardrail = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return normalizedGuardrailField(value.id)
      === CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.id.toLowerCase()
    || normalizedGuardrailField(value.name)
      === CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.name.toLowerCase();
};

const isCurrentPersonalizedDietaryAlcoholGuardrail = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return normalizedGuardrailField(value.id)
      === CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL.id.toLowerCase()
    || normalizedGuardrailField(value.name)
      === CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL.name.toLowerCase();
};

const migrateStoredCustomGuardrails = (
  value: unknown,
  addPersonalizedDietaryAlcoholGuardrail: boolean,
  removeVipEventConfidentialityGuardrail: boolean,
): { value: unknown; changed: boolean } => {
  if (!Array.isArray(value)) {
    return { value, changed: false };
  }

  // Schema 14 retires the seeded VIP confidentiality policy and its obsolete
  // large-reservation predecessor from the primary demo. Unrelated custom
  // guardrails remain untouched and in their original order.
  let migrated = removeVipEventConfidentialityGuardrail
    ? value.filter(item => (
      !isLegacyLargeReservationGuardrail(item)
      && !isCurrentVipConfidentialityGuardrail(item)
    ))
    : value;
  let changed = migrated.length !== value.length;
  if (
    addPersonalizedDietaryAlcoholGuardrail
    && !migrated.some(isCurrentPersonalizedDietaryAlcoholGuardrail)
  ) {
    migrated = [
      ...migrated,
      {
        ...structuredClone(CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL),
        enabled: true,
        versions: [],
      },
    ];
    changed = true;
  }

  return { value: migrated, changed };
};

// The Cisco Live demo agents are always seeded so they appear on /agents fully
// configured. Persisted (user-edited) records win over the seed by id, so any
// edits a user makes to a demo agent survive reloads.
const migratePrimaryDemoDraft = (draft: AgentDraft, storedSchemaVersion: number): AgentDraft => {
  const actions = draft.familyConfiguration.actions;
  const shouldMigrateLegacyActions = storedSchemaVersion < 4;
  const shouldMigrateVipTeamActionName = storedSchemaVersion < 5;
  const shouldMigrateCheckAvailabilityName = storedSchemaVersion < 6;
  const shouldMigrateLargeEventControlTiming = storedSchemaVersion < 7;
  const shouldMigrateLargeEventControlMatchMode = storedSchemaVersion < 8;
  const shouldMigrateHandoverAction = storedSchemaVersion < 9;
  const shouldMigrateHandoverTurnRule = storedSchemaVersion < 10;
  const shouldAddPersonalizedDietaryAlcoholGuardrail = storedSchemaVersion < 11;
  const shouldMigratePrimaryInstructions = storedSchemaVersion < 13;
  const shouldRemoveVipEventConfidentialityGuardrail = storedSchemaVersion < 14;
  let migratedActions = actions;
  if (actions && (
    shouldMigrateLegacyActions
    || shouldMigrateVipTeamActionName
    || shouldMigrateCheckAvailabilityName
    || shouldMigrateLargeEventControlTiming
    || shouldMigrateLargeEventControlMatchMode
    || shouldMigrateHandoverAction
    || shouldMigrateHandoverTurnRule
  )) {
    const actionValues = actions.values ?? {};
    const hasStoredSelections = Array.isArray(actionValues.selections);
    const existingSelections = hasStoredSelections
      ? actionValues.selections.filter((item): item is string => typeof item === 'string')
      : [];
    const normalizedSelections = hasStoredSelections
      ? existingSelections.map((item) => {
        if (item === 'Transfer to concierge' || item === 'Transfer large event to VIP concierge') {
          return 'Transfer to VIP team';
        }
        if (shouldMigrateCheckAvailabilityName && item === 'Check Availability.') {
          return 'Check Availability';
        }
        return item;
      })
      : EAGLE_GREEN_ACTION_CONTROL_VALUES.selections;
    const migratedSelections = shouldMigrateHandoverAction
      && !normalizedSelections.includes('Handover')
      ? [...normalizedSelections, 'Handover']
      : normalizedSelections;

    const existingControlsByActionId = isRecord(actionValues.controlsByActionId)
      ? structuredClone(actionValues.controlsByActionId)
      : {};
    const defaultControlsByActionId = structuredClone(EAGLE_GREEN_ACTION_CONTROL_VALUES.controlsByActionId);
    const checkAvailabilityControls = existingControlsByActionId[EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID];
    const hasCheckAvailabilityControls = Object.prototype.hasOwnProperty.call(
      existingControlsByActionId,
      EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID,
    );
    if (!hasCheckAvailabilityControls || !Array.isArray(checkAvailabilityControls)) {
      existingControlsByActionId[EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID] =
        defaultControlsByActionId[EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID];
    } else if (
      shouldMigrateCheckAvailabilityName
      || shouldMigrateLargeEventControlTiming
      || shouldMigrateLargeEventControlMatchMode
    ) {
      const seededLargeEventControl = EAGLE_GREEN_ACTION_CONTROL_VALUES
        .controlsByActionId[EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID][0];
      existingControlsByActionId[EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID] = checkAvailabilityControls.map((control) => {
        if (!isRecord(control)) return control;

        const nextControl = { ...control };
        if (
          shouldMigrateCheckAvailabilityName
          && control.recommendationReason
            === 'The reservation threshold changes whether Check Availability. should run or the request should move to VIP review.'
        ) {
          nextControl.recommendationReason = 'The reservation threshold changes whether Check Availability should run or the request should move to VIP review.';
        }

        if (
          shouldMigrateLargeEventControlTiming
          && control.id === EAGLE_GREEN_ACTION_CONTROL_ID
        ) {
          nextControl.timing = seededLargeEventControl.timing;
          if (
            control.name === 'Large event approval routing'
            || control.name === 'Route large event requests to the VIP team'
          ) nextControl.name = seededLargeEventControl.name;
          if (
            control.description === 'Keep large event requests out of the standard booking path until the VIP event team can review them.'
            || control.description === 'Route requests over 100 guests or more than 20 bays to the VIP team before Check Availability runs.'
            || control.description === 'Check availability first, then route requests over 100 guests or more than 20 bays to the VIP team.'
          ) nextControl.description = seededLargeEventControl.description;
          if (
            control.guidance === 'Explain that this request exceeds autonomous booking limits and needs review by the VIP event team. Tell the caller that their context will transfer with them.'
            || control.guidance === 'Tell the caller that the request needs VIP-team review, then transfer the caller and reservation context to the VIP team.'
            || control.guidance === 'Tell the caller that availability was checked and the request needs VIP-team review, then transfer the caller, availability result, and reservation context.'
          ) nextControl.guidance = seededLargeEventControl.guidance;
          if (control.sourceEvidence === 'Large event requests must transfer with the reservation context attached.') {
            nextControl.sourceEvidence = seededLargeEventControl.sourceEvidence;
          }
          if (
            control.recommendationReason === 'The reservation threshold changes whether Check Availability should run or the request should move to VIP review.'
            || control.recommendationReason === 'The reservation threshold changes whether Check Availability. should run or the request should move to VIP review.'
            || control.recommendationReason === 'This control applies the saved reservation thresholds before Check Availability runs and sends matching requests to the VIP team.'
            || control.recommendationReason === 'This control lets Check Availability finish, then applies the saved reservation thresholds to choose the next path.'
          ) nextControl.recommendationReason = seededLargeEventControl.recommendationReason;
        }

        if (
          shouldMigrateLargeEventControlMatchMode
          && control.id === EAGLE_GREEN_ACTION_CONTROL_ID
        ) {
          nextControl.matchMode = seededLargeEventControl.matchMode;
        }

        return nextControl;
      });
    }
    const handoverControls = existingControlsByActionId[EAGLE_GREEN_HANDOVER_ACTION_ID];
    if (shouldMigrateHandoverAction && !Array.isArray(handoverControls)) {
      existingControlsByActionId[EAGLE_GREEN_HANDOVER_ACTION_ID] =
        defaultControlsByActionId[EAGLE_GREEN_HANDOVER_ACTION_ID];
    } else if (shouldMigrateHandoverTurnRule && Array.isArray(handoverControls)) {
      const seededHandoverControl = defaultControlsByActionId[EAGLE_GREEN_HANDOVER_ACTION_ID][0];
      existingControlsByActionId[EAGLE_GREEN_HANDOVER_ACTION_ID] = handoverControls.map(control => (
        isRecord(control) && control.id === EAGLE_GREEN_HANDOVER_CONTROL_ID
          ? structuredClone(seededHandoverControl)
          : control
      ));
    }

    const existingGatesByActionId = isRecord(actionValues.gatesByActionId)
      ? structuredClone(actionValues.gatesByActionId)
      : {};
    if (!isRecord(existingGatesByActionId['transfer-large-event-vip-concierge'])) {
      existingGatesByActionId['transfer-large-event-vip-concierge'] = structuredClone(
        EAGLE_GREEN_ACTION_CONTROL_VALUES.gatesByActionId['transfer-large-event-vip-concierge'],
      );
    }

    migratedActions = {
      ...actions,
      values: {
        ...actionValues,
        selections: migratedSelections,
        controlsByActionId: existingControlsByActionId,
        gatesByActionId: existingGatesByActionId,
      },
    };
  }

  const security = draft.familyConfiguration.security;
  const securityValues = security?.values ?? {};
  const existingSecuritySelections = Array.isArray(securityValues.selections)
    ? securityValues.selections.filter((item): item is string => typeof item === 'string')
    : [];
  let migratedSecuritySelections = shouldRemoveVipEventConfidentialityGuardrail
    ? existingSecuritySelections.filter((item) => {
      const normalizedItem = item.trim().toLowerCase();
      return normalizedItem !== LEGACY_LARGE_RESERVATION_GUARDRAIL_NAME
        && normalizedItem !== CISCO_LIVE_VIP_EVENT_CONFIDENTIALITY_GUARDRAIL.name.toLowerCase()
        && !RETIRED_PRIMARY_PREBUILT_GUARDRAIL_NAMES.has(normalizedItem);
    })
    : existingSecuritySelections;
  const customGuardrailsMigration = migrateStoredCustomGuardrails(
    securityValues.customGuardrails,
    shouldAddPersonalizedDietaryAlcoholGuardrail,
    shouldRemoveVipEventConfidentialityGuardrail,
  );
  const migratedPersonalizedGuardrail = Array.isArray(customGuardrailsMigration.value)
    ? customGuardrailsMigration.value.find(isCurrentPersonalizedDietaryAlcoholGuardrail)
    : undefined;
  const hasPersonalizedGuardrailSelection = migratedSecuritySelections.some(
    item => normalizedGuardrailField(item)
      === CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL.name.toLowerCase(),
  );
  const personalizedGuardrailUsesSeedFallback = !Array.isArray(customGuardrailsMigration.value);
  const personalizedGuardrailIsEnabled = isRecord(migratedPersonalizedGuardrail)
    ? migratedPersonalizedGuardrail.enabled !== false
    : personalizedGuardrailUsesSeedFallback;
  if (
    shouldAddPersonalizedDietaryAlcoholGuardrail
    && personalizedGuardrailIsEnabled
    && !hasPersonalizedGuardrailSelection
  ) {
    migratedSecuritySelections = [
      ...migratedSecuritySelections,
      CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_GUARDRAIL.name,
    ];
  }
  const selectionsChanged = migratedSecuritySelections.some(
    (selection, index) => selection !== existingSecuritySelections[index],
  ) || migratedSecuritySelections.length !== existingSecuritySelections.length;
  const securityChanged = Boolean(security) && (selectionsChanged || customGuardrailsMigration.changed);
  const migratedSecurity = securityChanged && security ? {
    ...security,
    values: {
      ...securityValues,
      ...(selectionsChanged ? { selections: migratedSecuritySelections } : {}),
      ...(customGuardrailsMigration.changed
        ? { customGuardrails: customGuardrailsMigration.value }
        : {}),
    },
  } : security;

  const primaryDefinition = CISCO_LIVE_AGENTS.find(
    candidate => candidate.id === CISCO_LIVE_PRIMARY_AGENT_ID,
  );
  const knownSeededPrimaryInstructions = primaryDefinition
    ? [
      buildDefaultCiscoLiveInstructions(primaryDefinition),
      buildDefaultCiscoLiveInstructions({
        ...primaryDefinition,
        securityRules: primaryDefinition.securityRules.filter(
          rule => rule !== CISCO_LIVE_PERSONALIZED_DIETARY_ALCOHOL_SECURITY_RULE,
        ),
      }),
      EAGLE_GREEN_LEGACY_VIP_RESERVATION_INSTRUCTIONS,
    ]
    : [];
  const storedPrimaryInstructions = draft.instructions.content.trim();
  const instructionsChanged = Boolean(
    shouldMigratePrimaryInstructions
    && primaryDefinition
    && knownSeededPrimaryInstructions.some(
      instructions => storedPrimaryInstructions === instructions.trim(),
    ),
  );
  const migratedInstructions = instructionsChanged && primaryDefinition ? {
    ...draft.instructions,
    content: buildCiscoLiveInstructions(primaryDefinition),
  } : draft.instructions;

  if (
    migratedActions === actions
    && migratedSecurity === security
    && migratedInstructions === draft.instructions
  ) return draft;

  return {
    ...draft,
    instructions: migratedInstructions,
    familyConfiguration: {
      ...draft.familyConfiguration,
      ...(migratedActions ? { actions: migratedActions } : {}),
      ...(migratedSecurity ? { security: migratedSecurity } : {}),
    },
  };
};

const withCiscoLiveSeed = (
  agents: AgentsMap,
  agentDrafts: AgentDraftsMap,
  storedSchemaVersion = 0,
): PersistedAgentState => {
  const seed = buildCiscoLiveSeed();
  const migratedDrafts = { ...agentDrafts };
  const primaryDraft = migratedDrafts[CISCO_LIVE_PRIMARY_AGENT_ID];
  if (primaryDraft) {
    migratedDrafts[CISCO_LIVE_PRIMARY_AGENT_ID] = migratePrimaryDemoDraft(
      primaryDraft,
      storedSchemaVersion,
    );
  }
  return {
    schemaVersion: 14,
    agents: { ...seed.agents, ...agents },
    agentDrafts: { ...seed.agentDrafts, ...migratedDrafts },
  };
};

const readPersistedAgentState = (): PersistedAgentState => {
  if (typeof window === 'undefined') return withCiscoLiveSeed({}, {});

  try {
    const raw = window.localStorage.getItem(APP_AGENT_STORAGE_KEY);
    if (!raw) return withCiscoLiveSeed({}, {});
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.agents) || !isRecord(parsed.agentDrafts)) {
      return withCiscoLiveSeed({}, {});
    }
    const storedSchemaVersion = typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 0;
    return withCiscoLiveSeed(
      parsed.agents as AgentsMap,
      parsed.agentDrafts as AgentDraftsMap,
      storedSchemaVersion,
    );
  } catch {
    return withCiscoLiveSeed({}, {});
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
