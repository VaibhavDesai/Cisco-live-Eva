import {
  createDraftFromProposal,
  type AgentDraft,
  type CapabilityState,
  type StarterProposal,
} from '../features/agent-creation/agentCreationModel';
import type { Agent } from '../contexts/AppContext';
import { CISCO_LIVE_AGENTS, type CiscoLiveAgentDefinition } from './ciscoLiveDemo';

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
