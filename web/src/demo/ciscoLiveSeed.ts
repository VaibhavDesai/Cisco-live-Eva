import {
  createDraftFromProposal,
  type AgentDraft,
  type CapabilityState,
  type StarterProposal,
} from '../features/agent-creation/agentCreationModel';
import type { Agent } from '../contexts/AppContext';
import {
  CISCO_LIVE_AGENTS,
  CISCO_LIVE_PRIMARY_AGENT_ID,
  type CiscoLiveAgentDefinition,
} from './ciscoLiveDemo';

export const EAGLE_GREEN_ACTION_CONTROL_ID = 'large-event-approval-routing';
export const EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID = 'check-bay-availability';
export const EAGLE_GREEN_PAYMENT_ACTION_ID = 'send-payment-link';
export const EAGLE_GREEN_LARGE_EVENT_TRANSFER_ACTION_ID = 'transfer-large-event-vip-concierge';
export const EAGLE_GREEN_HANDOVER_ACTION_ID = 'handover-human-agent';
export const EAGLE_GREEN_HANDOVER_CONTROL_ID = 'handover-human-agent-steer';

export const EAGLE_GREEN_ACTION_CONTROL_VALUES = {
  selections: [
    'Check Availability',
    'Send payment link',
    'Transfer to VIP team',
    'Handover',
  ],
  controlsByActionId: {
    [EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID]: [
      {
        id: EAGLE_GREEN_ACTION_CONTROL_ID,
        actionId: EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID,
        name: 'Route large event requests to the VIP team',
        description: 'After Check availability returns, between 9:30 AM and 10:00 AM, route requests over 100 guests or more than 20 bays to the VIP team.',
        status: 'active',
        timing: 'post_tool',
        behavior: 'steer',
        guidance: 'Tell the caller that availability was checked and the request needs VIP-team review. Transfer the caller, availability result, and reservation context to the VIP team.',
        matchMode: 'or',
        conditions: [
          { id: 'large-event-party-size', kind: 'action_input', field: 'party_size', operator: 'greater_than', value: 100 },
          { id: 'large-event-requested-bays', kind: 'action_input', field: 'requested_bays', operator: 'greater_than', value: 20 },
        ],
        timeWindow: { field: 'event_time', operator: 'between', start: '09:30', end: '10:00' },
        steerToActionId: EAGLE_GREEN_LARGE_EVENT_TRANSFER_ACTION_ID,
        source: 'recommended',
        sourceEvidence: 'Requests over 100 guests or more than 20 bays require review by the VIP event team.',
        recommendationReason: 'Check Availability receives party size and requested bays, so Galileo can make a deterministic routing decision after the action returns.',
        version: 1,
      },
    ],
    [EAGLE_GREEN_HANDOVER_ACTION_ID]: [
      {
        id: EAGLE_GREEN_HANDOVER_CONTROL_ID,
        actionId: EAGLE_GREEN_HANDOVER_ACTION_ID,
        name: 'Delay human handover until turn 5',
        description: 'Before Handover runs, nudge requests made before turn 5 to continue with the AI agent and share the estimated wait time. At turn 5 or later, allow Handover to transfer to a human agent.',
        status: 'active',
        timing: 'pre_tool',
        behavior: 'steer',
        guidance: 'Before turn 5, encourage the user to continue with the AI agent and tell them: “A human agent is available in about {{estimated_human_wait_minutes}} minutes.” At turn 5 or later, run Handover and transfer the user and conversation context to a human agent.',
        matchMode: 'and',
        conditions: [
          { id: 'handover-conversation-turn', kind: 'action_input', field: 'conversation_turn', operator: 'less_than', value: 5 },
        ],
        source: 'manual',
        sourceEvidence: 'Early handover requests should remain with the AI agent until turn 5 while the user receives the current human-agent wait estimate.',
        recommendationReason: 'Handover receives the current conversation turn and human-agent wait estimate, so Galileo can delay early requests and transfer later ones.',
        version: 1,
      },
    ],
  },
  gatesByActionId: {
    [EAGLE_GREEN_LARGE_EVENT_TRANSFER_ACTION_ID]: {
      actionId: EAGLE_GREEN_LARGE_EVENT_TRANSFER_ACTION_ID,
      sourceActionId: EAGLE_GREEN_CHECK_AVAILABILITY_ACTION_ID,
      controlId: EAGLE_GREEN_ACTION_CONTROL_ID,
      enabled: true,
      prerequisiteControlIds: [EAGLE_GREEN_ACTION_CONTROL_ID],
    },
  },
};

// Display names for the prebuilt guardrails referenced by each agent's
// `prebuiltGuardrailIds`. Kept in sync with the standard/advanced catalogs in
// `ActionConfigureV2.tsx`; this is the single place that maps ids -> names for
// the seeded drafts so the overview "Connections" card lists real guardrails.
const PREBUILT_GUARDRAIL_NAMES: Record<string, string> = {
  'std-toxicity': 'Toxicity',
  'std-harm': 'Harm detection',
  'std-jailbreak': 'Jailbreak',
  'std-multiturn': 'Multi-turn jailbreak',
  'sec-prompt-injection': 'Prompt injection',
  'sec-code-injection': 'Code injection',
  'sec-system-prompt': 'System prompt extraction',
  'sec-instruction-override': 'Instruction override',
  'sec-encoding-attack': 'Encoding attack',
  'sec-sql-injection': 'SQL injection',
  'sec-xss': 'XSS injection',
  'sec-resource-hijack': 'Resource hijack',
  'priv-pii': 'PII detection',
  'priv-ssn': 'SSN redaction',
  'priv-credit-card': 'Credit card redaction',
  'priv-email': 'Email redaction',
  'priv-phone': 'Phone number redaction',
  'priv-address': 'Address redaction',
  'priv-ip': 'IP address redaction',
  'safe-toxicity': 'Toxicity',
  'safe-hate': 'Hate speech',
  'safe-self-harm': 'Self-harm',
  'safe-violence': 'Violence',
  'safe-sexual': 'Sexual content',
  'safe-harassment': 'Harassment',
  'safe-misinfo': 'Misinformation',
  'safe-radicalization': 'Radicalization',
};

/** Compose the agent instructions shown in the Instructions/Profile editors. */
export const buildCiscoLiveInstructions = (agent: CiscoLiveAgentDefinition): string => `#### Role and identity
You are ${agent.name}, a ${agent.agentType.toLowerCase()} for Gofie.

#### Purpose
${agent.description}

#### Primary goals
${agent.goals.map(goal => `- ${goal}`).join('\n')}

#### Guardrails
${agent.securityRules.map(rule => `- ${rule}`).join('\n')}

#### Output rules
Use concise, professional language. State the action taken, the responsible owner, and the next step. Preserve approved context during every handoff.`;

/** All enabled guardrail names (prebuilt + custom) for an agent, in a stable order. */
export const getCiscoLiveGuardrailNames = (agent: CiscoLiveAgentDefinition): string[] => {
  const prebuilt = agent.prebuiltGuardrailIds
    .map(id => PREBUILT_GUARDRAIL_NAMES[id])
    .filter((name): name is string => Boolean(name));
  const custom = agent.customGuardrails.map(guardrail => guardrail.name);
  return [...prebuilt, ...custom];
};

const markConfigured = (
  configuration: Record<string, CapabilityState>,
  capabilityId: string,
  selections: string[],
  now: string,
): void => {
  const capability = configuration[capabilityId];
  if (!capability) return;
  configuration[capabilityId] = {
    ...capability,
    progress: selections.length > 0 ? 'configured' : capability.progress,
    values: { ...(capability.values ?? {}), selections },
    updatedAt: now,
  };
};

const buildDraft = (definition: CiscoLiveAgentDefinition): AgentDraft => {
  const proposal: StarterProposal = {
    name: definition.name,
    purpose: definition.description,
    description: definition.description,
    // Empty falls back to the family default language inside the model.
    language: '',
    instructions: buildCiscoLiveInstructions(definition),
    selectedChannels: [...definition.selectedChannels],
    greetings: { voice: definition.welcomeMessage, digital: definition.welcomeMessage },
  };

  const draft = createDraftFromProposal('contact_center', proposal);
  const now = draft.updatedAt;

  draft.id = definition.id;
  draft.lifecycle = 'published';
  draft.version = 1;
  draft.instructions = { ...draft.instructions, applied: true };

  markConfigured(draft.familyConfiguration, 'knowledge', definition.knowledgeSources.map(source => source.name), now);
  markConfigured(draft.familyConfiguration, 'memory', definition.memorySources.map(source => source.name), now);
  markConfigured(draft.familyConfiguration, 'actions', [...definition.actions], now);
  if (definition.id === CISCO_LIVE_PRIMARY_AGENT_ID && draft.familyConfiguration.actions) {
    draft.familyConfiguration.actions = {
      ...draft.familyConfiguration.actions,
      values: structuredClone(EAGLE_GREEN_ACTION_CONTROL_VALUES),
    };
  }
  markConfigured(
    draft.familyConfiguration,
    'handoff',
    definition.orchestrationScenarios.map(scenario => scenario.name),
    now,
  );
  markConfigured(draft.familyConfiguration, 'security', getCiscoLiveGuardrailNames(definition), now);

  if (definition.digitalChannelAddress) {
    const channels = draft.familyConfiguration.channels;
    if (channels) {
      draft.familyConfiguration.channels = {
        ...channels,
        values: { ...(channels.values ?? {}), digitalChannels: [definition.digitalChannelAddress] },
      };
    }
  }

  return draft;
};

const buildAgent = (definition: CiscoLiveAgentDefinition, draft: AgentDraft): Agent => ({
  id: definition.id,
  name: definition.name,
  initials: definition.initials,
  description: definition.description,
  gradient: definition.gradient,
  status: definition.status,
  statusClass: definition.statusClass,
  sessions: definition.sessions,
  successRate: definition.successRate,
  messages: definition.messages,
  avgResponse: definition.avgResponse,
  meta: definition.meta,
  knowledgeBases: [...definition.knowledgeBases],
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
  agentType: definition.agentType,
  family: draft.family,
  lifecycle: draft.lifecycle,
  draftId: draft.id,
  version: draft.version,
});

/**
 * Build the Cisco Live demo agents (metadata + fully configured family drafts)
 * so they always appear on /agents with their guardrails, knowledge, AI memory,
 * and actions duplicated from the design-explorations branch.
 */
export function buildCiscoLiveSeed(): {
  agents: Record<string, Agent>;
  agentDrafts: Record<string, AgentDraft>;
} {
  const agents: Record<string, Agent> = {};
  const agentDrafts: Record<string, AgentDraft> = {};

  for (const definition of CISCO_LIVE_AGENTS) {
    const draft = buildDraft(definition);
    agents[definition.id] = buildAgent(definition, draft);
    agentDrafts[definition.id] = draft;
  }

  return { agents, agentDrafts };
}
