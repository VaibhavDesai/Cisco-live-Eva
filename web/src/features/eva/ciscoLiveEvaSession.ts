import {
  CISCO_LIVE_AGENTS,
  type CiscoLiveAgentDefinition,
} from '../../demo/ciscoLiveDemo';
import {
  EVA_ADVANCED_GUARDRAIL_GROUPS,
  EVA_STANDARD_GUARDRAILS,
  buildInstructionPrompt,
  type EvaConversationStep,
  type EvaSessionState,
} from './evaFormConfig';
import type { EvaAgentDraft, EvaKnowledgeRecommendation } from './types';

const STORYLINE_UPDATED_AT = '2026-07-13T16:30:00.000Z';

const formatConjunctionList = (items: string[]): string => {
  if (items.length < 2) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

export function getCiscoLiveAgentDefinition(agentId?: string, agentName?: string) {
  return CISCO_LIVE_AGENTS.find(agent =>
    (agentId && agent.id === agentId) || (agentName && agent.name === agentName),
  );
}

export function buildCiscoLiveDraft(agent: CiscoLiveAgentDefinition): EvaAgentDraft {
  return {
    name: agent.name,
    description: agent.description,
    goals: [...agent.goals],
    knowledgeBases: agent.knowledgeSources.map(source => ({
      ...source,
      usedBy: 1,
      lastUpdatedAt: STORYLINE_UPDATED_AT,
    })) satisfies EvaKnowledgeRecommendation[],
    actions: [...agent.actions],
    security: [...agent.securityRules],
    language: 'English (US)',
    voiceName: 'Ava',
  };
}

export function buildCiscoLiveEvaSession(
  agent: CiscoLiveAgentDefinition,
  targetStep: EvaConversationStep = 'review',
): EvaSessionState {
  const draft = buildCiscoLiveDraft(agent);
  const enabledPrebuiltIds = new Set(agent.prebuiltGuardrailIds);
  const standardGuardrails = EVA_STANDARD_GUARDRAILS.map(guardrail => ({
    ...guardrail,
    enabled: enabledPrebuiltIds.has(guardrail.id),
  }));
  const advancedGuardrailGroups = EVA_ADVANCED_GUARDRAIL_GROUPS.map(group => ({
    ...group,
    items: group.items.map(guardrail => ({
      ...guardrail,
      enabled: enabledPrebuiltIds.has(guardrail.id),
    })),
  }));
  const enabledAdvancedGroups = advancedGuardrailGroups
    .filter(group => group.items.some(item => item.enabled))
    .map(group => group.id);
  const hasVoice = agent.selectedChannels.includes('voice');
  const knowledgeSummary = agent.knowledgeSources.map(source => source.name).join(', ');
  const actionSummary = agent.actions.join(', ');
  const guardrailSummary = formatConjunctionList(
    agent.customGuardrails.map(guardrail => guardrail.name),
  );

  return {
    sourceAgentId: agent.id,
    landingMode: 'build',
    selectedTemplateId: agent.templateId,
    draft,
    messages: [
      {
        role: 'user',
        text: `Configure ${agent.name} for the Cisco Live demo.`,
        originStep: 'profile',
      },
      {
        role: 'assistant',
        text: `I created the profile and instructions around this purpose: ${agent.description}`,
        originStep: 'instructions',
      },
      {
        role: 'user',
        text: `Use ${knowledgeSummary}. Enable ${actionSummary}.`,
        originStep: 'actions',
      },
      {
        role: 'assistant',
        text: `Updated. ${agent.knowledgeSources.length} knowledge sources and ${agent.actions.length} actions are connected.`,
        originStep: 'actions',
      },
      {
        role: 'user',
        text: `Apply ${guardrailSummary} and publish the agent.`,
        originStep: 'security',
      },
      {
        role: 'assistant',
        text: `Published. The guardrails are active, and every setup step now matches the Cisco Live storyline.`,
        originStep: targetStep,
      },
    ],
    guidanceVisible: true,
    orchestrationSuggested: false,
    freeChatActive: false,
    conversationalOnboardingStep: 'idle',
    evaStep: targetStep,
    agentName: agent.name,
    agentDescription: agent.description,
    avatarUrl: 'https://us.webexbotbuilder.com/static/assets/images/agent-avatar-eva.png',
    timezone: 'America/Los_Angeles',
    aiEngine: 'Webex AI Pro 1.0',
    welcomeMessage: agent.welcomeMessage,
    instructionPrompt: buildInstructionPrompt(draft),
    selectedKnowledgeBases: agent.knowledgeSources.map(source => source.name),
    selectedPreferenceMemories: agent.memorySources.map(memory => memory.name),
    enabledOrchestrationScenarioIds: agent.orchestrationScenarios.map(scenario => scenario.id),
    selectedActions: [...agent.actions],
    optimizeAccepted: true,
    preOptimizeText: '',
    optimizeSummary: {
      changes: ['Loaded the approved published configuration.'],
      reasoning: ['Instructions, knowledge, actions, and guardrails now match the event storyline.'],
    },
    securityTier: 'advanced',
    channelType: hasVoice ? 'voice' : 'digital',
    selectedChannels: [...agent.selectedChannels],
    digitalChannel: 'chat',
    selectedDigitalChannels: ['chat'],
    digitalChannelAddress: agent.digitalChannelAddress ?? '',
    channelPhoneNumber: '+1 415 555 0198',
    phoneNumberDeferred: false,
    standardGuardrails,
    advancedGuardrailGroups,
    expandedAdvancedGroups: enabledAdvancedGroups,
    personality: {
      llm: 'Webex AI Pro 1.0',
      voice: 'ava',
      language: 'en-US',
      gender: 'neutral',
    },
    customRules: agent.customGuardrails.map(guardrail => guardrail.description),
  };
}
