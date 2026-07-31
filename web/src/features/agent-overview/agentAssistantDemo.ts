import type { AgentOverviewSnapshot } from './agentOverviewSnapshot';

export const AGENT_ASSISTANT_STARTER_PROMPTS = [
  'Explain the Overview numbers',
  'What should I troubleshoot first?',
  'Continue configuring',
] as const;

export type AgentAssistantIntent = 'explain' | 'troubleshoot' | 'configure';
export type AgentAssistantSection =
  | 'Security'
  | 'Knowledge'
  | 'Action'
  | 'Profile'
  | 'Instructions'
  | 'Channels'
  | 'Language';

export interface AgentAssistantReply {
  text: string;
  contextLabel: string;
  followups: string[];
}

const SECTION_PRIORITY: AgentAssistantSection[] = [
  'Security',
  'Knowledge',
  'Action',
  'Profile',
  'Instructions',
  'Channels',
  'Language',
];

const formatCount = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const lowestSignal = (snapshot: AgentOverviewSnapshot) =>
  [...snapshot.signals].sort(
    (left, right) => left.value - right.value || left.label.localeCompare(right.label),
  )[0];

const contextLabel = (snapshot: AgentOverviewSnapshot) =>
  `Overview · ${snapshot.timeRange.label}`;

export function matchAgentAssistantIntent(text: string): AgentAssistantIntent | null {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return null;

  const knowledgeMetricQuestion =
    normalized.includes('knowledge')
    && ['explain', 'mean', 'metric', 'number', 'percent', 'percentage', 'why', 'what is']
      .some(term => normalized.includes(term));
  if (
    knowledgeMetricQuestion
    || normalized.includes('explain the overview')
    || normalized.includes('explain overview')
    || normalized.includes('overview number')
    || normalized.includes('overview metric')
    || normalized.includes('walk me through the overview')
    || normalized.includes('what do these numbers mean')
    || normalized.includes('summarize the overview')
  ) {
    return 'explain';
  }

  if (
    normalized.includes('troubleshoot')
    || normalized.includes('trouble shoot')
    || normalized.includes('what should i fix')
    || normalized.includes('what needs attention')
    || normalized.includes('what is wrong')
    || normalized.includes('where should i start')
    || normalized.includes('investigate first')
    || normalized.includes('performance issue')
  ) {
    return 'troubleshoot';
  }

  if (
    normalized.includes('continue configuring')
    || normalized.includes('continue configuration')
    || normalized.includes('continue setup')
    || normalized.includes('configure next')
    || normalized.includes('what should i configure')
    || normalized.includes('next configuration')
    || normalized.includes('finish configuring')
    || normalized === 'configure'
  ) {
    return 'configure';
  }

  return null;
}

export function normalizeAgentAssistantSection(
  target: string | undefined,
): AgentAssistantSection | null {
  const normalized = target?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === 'security') return 'Security';
  if (normalized === 'knowledge' || normalized === 'memory') return 'Knowledge';
  if (normalized === 'action' || normalized === 'actions' || normalized === 'handoff') {
    return 'Action';
  }
  if (
    normalized === 'profile'
    || normalized === 'basics'
    || normalized === 'identity'
    || normalized === 'audience'
  ) {
    return 'Profile';
  }
  if (normalized === 'instructions') return 'Instructions';
  if (normalized === 'channels' || normalized === 'placement') return 'Channels';
  if (normalized === 'language') return 'Language';
  return null;
}

export function getAgentAssistantConfigurationSections(
  snapshot: AgentOverviewSnapshot,
  rankedRecommendationTargets: string[] = [],
  configuredSections: Partial<Record<AgentAssistantSection, boolean>> = {},
): AgentAssistantSection[] {
  const recommendations = rankedRecommendationTargets
    .map(normalizeAgentAssistantSection)
    .filter((section): section is AgentAssistantSection => Boolean(section));
  const uniqueRecommendations = [...new Set(recommendations)];
  if (uniqueRecommendations.length > 0) return uniqueRecommendations.slice(0, 3);

  const visibleMissing = SECTION_PRIORITY.filter(section => {
    if (configuredSections[section] === true) return false;
    if (section === 'Security') return snapshot.capabilityCounts.guardrails === 0;
    if (section === 'Knowledge') return snapshot.capabilityCounts.knowledge === 0;
    if (section === 'Action') return snapshot.capabilityCounts.actions === 0;
    return true;
  });
  return visibleMissing.slice(0, 3);
}

function buildExplainReply(
  snapshot: AgentOverviewSnapshot,
  userText: string,
): AgentAssistantReply {
  const knowledgeSignal = snapshot.signals.find(signal => signal.id === 'knowledge');
  if (userText.toLowerCase().includes('knowledge') && knowledgeSignal) {
    const status = snapshot.capabilityCounts.knowledge > 0
      ? `The Overview shows ${formatCount(snapshot.capabilityCounts.knowledge, 'configured knowledge source')} and a Knowledge referenced signal of ${knowledgeSignal.value}%.`
      : 'The Overview shows no configured knowledge sources, so Knowledge referenced is 0%.';
    const availability = snapshot.operational.available
      ? 'Use Sessions to confirm which sources supported recent answers.'
      : 'Runtime evidence will be available after you publish or test the agent.';
    return {
      text: `${status} This signal describes how often visible conversations used configured knowledge. ${availability}`,
      contextLabel: contextLabel(snapshot),
      followups: ['Open Knowledge', AGENT_ASSISTANT_STARTER_PROMPTS[1]],
    };
  }

  const counts = snapshot.capabilityCounts;
  const strongestSignal = [...snapshot.signals].sort(
    (left, right) => right.value - left.value || left.label.localeCompare(right.label),
  )[0];
  const capabilitySentence =
    `${snapshot.agent.name} has ${formatCount(counts.knowledge, 'knowledge source')}, `
    + `${formatCount(counts.actions, 'action')}, ${formatCount(counts.guardrails, 'guardrail')}, `
    + `and ${formatCount(counts.memory, 'memory configuration')}.`;
  if (!snapshot.operational.available) {
    return {
      text: `${capabilitySentence} The strongest visible capability signal is ${strongestSignal.label} at ${strongestSignal.value}%. Runtime and operational metrics are unavailable until the agent is published or tested.`,
      contextLabel: contextLabel(snapshot),
      followups: [AGENT_ASSISTANT_STARTER_PROMPTS[1], AGENT_ASSISTANT_STARTER_PROMPTS[2]],
    };
  }
  return {
    text: `${capabilitySentence} Action success is ${snapshot.actionPerformance.averageSuccess.toFixed(1)}% against a ${snapshot.actionPerformance.target}% target, with ${snapshot.guardrailActivity.triggerTotal} guardrail trigger${snapshot.guardrailActivity.triggerTotal === 1 ? '' : 's'} in the selected range. Aggregate health is ${snapshot.operational.health?.score ?? 0}%.`,
    contextLabel: contextLabel(snapshot),
    followups: [AGENT_ASSISTANT_STARTER_PROMPTS[1], AGENT_ASSISTANT_STARTER_PROMPTS[2]],
  };
}

function buildTroubleshootReply(snapshot: AgentOverviewSnapshot): AgentAssistantReply {
  const attentionSession = snapshot.operational.recentSessions.find(session => (
    session.guardrailTriggered
    || session.transferred
    || session.outcome.toLowerCase().includes('failed')
  ));
  if (attentionSession) {
    const reason = attentionSession.guardrailTriggered
      ? 'triggered a guardrail'
      : attentionSession.transferred
        ? 'was transferred'
        : 'failed';
    return {
      text: `Start with session ${attentionSession.id}: ${attentionSession.topic} ${reason}. Review its transcript and connected systems before changing the agent, because it is the newest visible runtime signal that needs attention.`,
      contextLabel: contextLabel(snapshot),
      followups: ['Open Sessions', AGENT_ASSISTANT_STARTER_PROMPTS[2]],
    };
  }

  if (
    snapshot.actionPerformance.items.length > 0
    && snapshot.actionPerformance.averageSuccess < snapshot.actionPerformance.target
  ) {
    return {
      text: `Start with Action performance at ${snapshot.actionPerformance.averageSuccess.toFixed(1)}%, below the ${snapshot.actionPerformance.target}% target. Open Action to review the lowest-performing connection, then test the affected request again.`,
      contextLabel: contextLabel(snapshot),
      followups: ['Open Action', 'Open Sessions'],
    };
  }

  if (snapshot.capabilityCounts.guardrails === 0) {
    const draftNote = snapshot.operational.available
      ? ''
      : ' Runtime evidence will be available after you publish or test the agent.';
    return {
      text: `Start with Security because this agent has no configured guardrails.${draftNote} Add the policy coverage the agent needs, then test a risky or out-of-scope request.`,
      contextLabel: contextLabel(snapshot),
      followups: ['Open Security', 'Open Sessions'],
    };
  }
  if (snapshot.capabilityCounts.knowledge === 0) {
    return {
      text: 'Start with Knowledge because this agent has no configured knowledge sources. Connect an approved source, then test a question that depends on it.',
      contextLabel: contextLabel(snapshot),
      followups: ['Open Knowledge', 'Open Sessions'],
    };
  }
  if (snapshot.capabilityCounts.actions === 0) {
    return {
      text: 'Start with Action because this agent has no configured actions. Connect the first task the agent must complete, then test that request end to end.',
      contextLabel: contextLabel(snapshot),
      followups: ['Open Action', 'Open Sessions'],
    };
  }

  const weakest = lowestSignal(snapshot);
  if (weakest && weakest.value < 95) {
    return {
      text: `Start with ${weakest.label} at ${weakest.value}%, the lowest remaining capability signal. Review the related configuration and recent sessions before changing other sections.`,
      contextLabel: contextLabel(snapshot),
      followups: [AGENT_ASSISTANT_STARTER_PROMPTS[2], 'Open Sessions'],
    };
  }
  return {
    text: 'The visible signals are healthy in the selected range. Keep the current configuration and review recent sessions for qualitative issues before making changes.',
    contextLabel: contextLabel(snapshot),
    followups: ['Open Sessions', AGENT_ASSISTANT_STARTER_PROMPTS[2]],
  };
}

function buildConfigureReply(
  snapshot: AgentOverviewSnapshot,
  configurationSections: AgentAssistantSection[],
): AgentAssistantReply {
  if (configurationSections.length === 0) {
    return {
      text: 'The visible configuration sections are complete. Open Profile if you want to refine the agent identity or instructions without changing any settings automatically.',
      contextLabel: contextLabel(snapshot),
      followups: ['Open Profile'],
    };
  }
  const [first] = configurationSections;
  const reason = first === 'Security'
    ? 'it sets the boundaries for risky and out-of-scope requests'
    : first === 'Knowledge'
      ? 'it grounds answers in approved information'
      : first === 'Action'
        ? 'it lets the agent complete a real task'
        : 'it is the highest-priority visible recommendation';
  return {
    text: `Continue with ${first}; ${reason}. Opening it keeps this conversation beside the configuration and does not change any settings.`,
    contextLabel: contextLabel(snapshot),
    followups: configurationSections.slice(0, 3).map(section => `Open ${section}`),
  };
}

export function buildAgentAssistantReply(
  intent: AgentAssistantIntent,
  snapshot: AgentOverviewSnapshot,
  options: {
    userText?: string;
    configurationSections?: AgentAssistantSection[];
  } = {},
): AgentAssistantReply {
  if (intent === 'explain') return buildExplainReply(snapshot, options.userText ?? '');
  if (intent === 'troubleshoot') return buildTroubleshootReply(snapshot);
  return buildConfigureReply(snapshot, options.configurationSections ?? []);
}

export function buildAgentAssistantSystemPrompt(snapshot: AgentOverviewSnapshot): string {
  return [
    `You are the AI Assistant for ${snapshot.agent.name}.`,
    'Answer in two to four short sentences using only the supplied Overview snapshot.',
    'Do not invent, estimate, or infer metrics that are not in the snapshot.',
    'If the agent is a draft, say that runtime and operational metrics are unavailable until publication or testing.',
    'Do not propose navigation actions in the prose. The product supplies allowlisted actions separately.',
    `Overview snapshot: ${JSON.stringify(snapshot)}`,
  ].join('\n');
}

export function buildAgentAssistantFallback(snapshot: AgentOverviewSnapshot): AgentAssistantReply {
  const weakest = lowestSignal(snapshot);
  const runtimeSentence = snapshot.operational.available
    ? `${snapshot.operational.recentSessions.length} recent session${snapshot.operational.recentSessions.length === 1 ? ' is' : 's are'} visible in this range.`
    : 'Runtime and operational metrics are unavailable until the agent is published or tested.';
  return {
    text: `I kept your message in this chat, but the model is unavailable. The lowest visible capability signal is ${weakest.label} at ${weakest.value}%. ${runtimeSentence}`,
    contextLabel: contextLabel(snapshot),
    followups: [
      AGENT_ASSISTANT_STARTER_PROMPTS[0],
      AGENT_ASSISTANT_STARTER_PROMPTS[1],
      AGENT_ASSISTANT_STARTER_PROMPTS[2],
    ],
  };
}

export function getAllowlistedAgentAssistantAction(
  label: string,
): AgentAssistantSection | 'Sessions' | null {
  if (label === 'Open Sessions') return 'Sessions';
  if (!label.startsWith('Open ')) return null;
  return normalizeAgentAssistantSection(label.slice('Open '.length));
}
