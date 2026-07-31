import type { Agent } from '../../contexts/AppContext';
import {
  getCiscoLiveActionMetric,
  getCiscoLiveGuardrailTriggerCount,
  getCiscoLiveSessions,
  type CiscoLiveSession,
} from '../../demo/ciscoLiveDemo.ts';
import type { AgentDraft, AgentLifecycle } from '../agent-creation/agentCreationModel';

export const AGENT_OVERVIEW_TIME_RANGE_OPTIONS = [
  { value: '1h', label: 'Past 1 hour' },
  { value: '6h', label: 'Past 6 hours' },
  { value: '24h', label: 'Past 24 hours' },
  { value: '7d', label: 'Past 7 days' },
  { value: '30d', label: 'Past 30 days' },
] as const;

export type AgentOverviewTimeRange = typeof AGENT_OVERVIEW_TIME_RANGE_OPTIONS[number]['value'];
export type AgentOverviewSignalId = 'knowledge' | 'memory' | 'actions' | 'security';
export type AgentOverviewSignalType = 'knowledge' | 'memory' | 'action' | 'guardrail';

export const AGENT_OVERVIEW_ACTION_TARGET = 95;

export const AGENT_OVERVIEW_OPERATIONAL_HEALTH = {
  score: 95.8,
  target: 85,
  signals: 7,
} as const;

export const AGENT_OVERVIEW_OPERATIONAL_HEALTH_GAP = Number(
  (
    AGENT_OVERVIEW_OPERATIONAL_HEALTH.score
    - AGENT_OVERVIEW_OPERATIONAL_HEALTH.target
  ).toFixed(1),
);

export const AGENT_OVERVIEW_OPERATIONAL_METRICS = [
  { id: 'knowledge-coverage', label: 'Knowledge coverage', value: '94.8%', change: '+4.6%' },
  { id: 'guardrails-trigger-flag', label: 'Guardrails trigger flag', value: '0.8%', change: '-0.7%' },
  { id: 'containment-rate', label: 'Containment rate', value: '91.6%', change: '+5.2%' },
  { id: 'action-intent-success-rate', label: 'Action/intent success rate', value: '97.8%', change: '+2.4%' },
  { id: 'autocsat-improvement', label: 'AutoCSAT improvement', value: '8.6%', change: '+3.4%' },
  { id: 'csat-predictor', label: 'CSAT predictor (AutoCSAT)', value: '4.7/5', change: '+8.1%' },
  { id: 'fulfilment-latency-p95', label: 'Fulfilment latency P95', value: '1,240ms', change: '-18%' },
] as const;

const AGENT_OVERVIEW_TIME_RANGE_HOURS: Record<AgentOverviewTimeRange, number> = {
  '1h': 1,
  '6h': 6,
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

export interface AgentOverviewCapabilityCounts {
  knowledge: number;
  memory: number;
  actions: number;
  guardrails: number;
}

export interface AgentOverviewSignal {
  id: AgentOverviewSignalId;
  label: string;
  value: number;
  count: number;
  type: AgentOverviewSignalType;
}

export interface AgentOverviewActionPerformance {
  item: string;
  rate: number;
  rateLabel: string;
  isPositive: boolean;
}

export interface AgentOverviewGuardrailActivity {
  item: string;
  count: number;
}

export interface AgentOverviewOperationalMetric {
  id: string;
  label: string;
  value: string;
  change: string;
}

export interface AgentOverviewSnapshot {
  agent: {
    id: string;
    name: string;
    status: string;
    lifecycle: AgentLifecycle;
    version: number;
  };
  timeRange: {
    value: AgentOverviewTimeRange;
    label: string;
    hours: number;
  };
  capabilityCounts: AgentOverviewCapabilityCounts;
  configured: {
    knowledge: string[];
    memory: string[];
    actions: string[];
    handoff: string[];
    orchestration: string[];
    security: string[];
  };
  signals: AgentOverviewSignal[];
  actionPerformance: {
    target: number;
    averageSuccess: number;
    items: AgentOverviewActionPerformance[];
  };
  guardrailActivity: {
    triggerTotal: number;
    items: AgentOverviewGuardrailActivity[];
  };
  operational: {
    available: boolean;
    health: typeof AGENT_OVERVIEW_OPERATIONAL_HEALTH | null;
    metrics: AgentOverviewOperationalMetric[];
    recentSessions: CiscoLiveSession[];
  };
  hasConnectedResources: boolean;
  usesEagleGreenShowcaseMetrics: boolean;
}

export interface BuildAgentOverviewSnapshotInput {
  agent: Agent;
  draft?: AgentDraft;
  timeRange?: AgentOverviewTimeRange;
  fallbackActions?: string[];
}

const capabilitySelectionLabels = (
  draft: AgentDraft | undefined,
  capabilityId: string,
): string[] => {
  const selections = draft?.familyConfiguration[capabilityId]?.values?.selections;
  return Array.isArray(selections)
    ? selections.filter(
        (selection): selection is string =>
          typeof selection === 'string' && Boolean(selection.trim()),
      )
    : [];
};

export const configuredCapabilityLabels = (
  draft: AgentDraft | undefined,
  capabilityId: string,
  fallbackLabels: string[] = [],
): string[] => {
  const capability = draft?.familyConfiguration[capabilityId];
  if (!draft) return fallbackLabels;
  if (capability?.progress !== 'configured') return [];
  const selections = capabilitySelectionLabels(draft, capabilityId);
  if (selections.length > 0) return selections;
  if (fallbackLabels.length > 0) return fallbackLabels;
  return capability?.label ? [capability.label] : [];
};

export const getAgentOverviewTimeRange = (
  value: string | undefined,
): AgentOverviewSnapshot['timeRange'] => {
  const normalized = AGENT_OVERVIEW_TIME_RANGE_OPTIONS.some(option => option.value === value)
    ? value as AgentOverviewTimeRange
    : '6h';
  const option = AGENT_OVERVIEW_TIME_RANGE_OPTIONS.find(item => item.value === normalized)
    ?? AGENT_OVERVIEW_TIME_RANGE_OPTIONS[1];
  return {
    value: option.value,
    label: option.label,
    hours: AGENT_OVERVIEW_TIME_RANGE_HOURS[option.value],
  };
};

export const getAgentOverviewSessionAgeHours = (updated: string): number => {
  const normalized = updated.trim().toLowerCase();
  if (normalized === 'just now') return 0;
  const match = normalized.match(/^(\d+)\s+(minute|minutes|hour|hours|day|days)/);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  if (match[2].startsWith('minute')) return value / 60;
  if (match[2].startsWith('day')) return value * 24;
  return value;
};

export function buildAgentOverviewSnapshot({
  agent,
  draft,
  timeRange,
  fallbackActions,
}: BuildAgentOverviewSnapshotInput): AgentOverviewSnapshot {
  const resolvedTimeRange = getAgentOverviewTimeRange(timeRange);
  const lifecycle = draft?.lifecycle ?? agent.lifecycle ?? 'draft';
  const resolvedFallbackActions = fallbackActions ?? (
    draft
      ? []
      : agent.name.toLowerCase().includes('acme electronics')
        ? ['Inventory lookup', 'Create support case']
        : ['Starter action set']
  );
  const configuredKnowledge = configuredCapabilityLabels(
    draft,
    'knowledge',
    agent.knowledgeBases ?? [],
  );
  const configuredMemory = configuredCapabilityLabels(draft, 'memory');
  const configuredActions = configuredCapabilityLabels(
    draft,
    'actions',
    resolvedFallbackActions,
  );
  const configuredHandoff = configuredCapabilityLabels(draft, 'handoff');
  const configuredSecurity = configuredCapabilityLabels(draft, 'security')
    .map((item, index) => ({
      item,
      index,
      count: getCiscoLiveGuardrailTriggerCount(item),
    }))
    .sort((left, right) => right.count - left.count || left.index - right.index)
    .map(entry => entry.item);
  const configuredOrchestration = [...configuredActions, ...configuredHandoff];
  const usesEagleGreenShowcaseMetrics = agent.id === 'golftop-vip-reservations';
  const actionPerformanceItems = usesEagleGreenShowcaseMetrics
    ? [
        'Check bay availability',
        'Send payment link',
        'Transfer to concierge',
        'Get customer info',
      ]
    : configuredActions;
  const actionPerformance = actionPerformanceItems.map(item => {
    const metric = getCiscoLiveActionMetric(item);
    return {
      item,
      rate: Number.parseFloat(metric.rate),
      rateLabel: metric.rate,
      isPositive: metric.isPositive,
    };
  });
  const averageActionSuccess = actionPerformance.length > 0
    ? actionPerformance.reduce((total, item) => total + item.rate, 0) / actionPerformance.length
    : 0;
  const capabilityCounts = {
    knowledge: usesEagleGreenShowcaseMetrics ? 14 : configuredKnowledge.length,
    memory: configuredMemory.length,
    actions: usesEagleGreenShowcaseMetrics ? 6 : configuredOrchestration.length,
    guardrails: configuredSecurity.length,
  };
  const guardrailItems = configuredSecurity.map(item => ({
    item,
    count: getCiscoLiveGuardrailTriggerCount(item),
  }));
  const allSessions = getCiscoLiveSessions(agent.id);
  const guardedSessionRate = allSessions.length > 0
    ? Math.round(
        (allSessions.filter(session => session.guardrailTriggered).length / allSessions.length) * 100,
      )
    : 0;
  const signals: AgentOverviewSignal[] = [
    {
      id: 'knowledge',
      label: 'Knowledge referenced',
      value: configuredKnowledge.length > 0
        ? Math.min(100, 68 + configuredKnowledge.length * 8)
        : 0,
      count: capabilityCounts.knowledge,
      type: 'knowledge',
    },
    {
      id: 'memory',
      label: 'Memory assisted',
      value: configuredMemory.length > 0
        ? Math.min(100, 54 + configuredMemory.length * 8)
        : 0,
      count: capabilityCounts.memory,
      type: 'memory',
    },
    {
      id: 'actions',
      label: 'Action success',
      value: Math.round(averageActionSuccess),
      count: capabilityCounts.actions,
      type: 'action',
    },
    {
      id: 'security',
      label: 'Guardrail intervention',
      value: configuredSecurity.length > 0 ? guardedSessionRate : 0,
      count: capabilityCounts.guardrails,
      type: 'guardrail',
    },
  ];
  const operationalAvailable = lifecycle !== 'draft';
  const recentSessions = operationalAvailable
    ? allSessions
        .filter(session => getAgentOverviewSessionAgeHours(session.updated) <= resolvedTimeRange.hours)
        .slice(0, 3)
    : [];

  return {
    agent: {
      id: agent.id,
      name: agent.name,
      status: agent.status,
      lifecycle,
      version: draft?.version ?? agent.version ?? 1,
    },
    timeRange: resolvedTimeRange,
    capabilityCounts,
    configured: {
      knowledge: configuredKnowledge,
      memory: configuredMemory,
      actions: configuredActions,
      handoff: configuredHandoff,
      orchestration: configuredOrchestration,
      security: configuredSecurity,
    },
    signals,
    actionPerformance: {
      target: AGENT_OVERVIEW_ACTION_TARGET,
      averageSuccess: averageActionSuccess,
      items: actionPerformance,
    },
    guardrailActivity: {
      triggerTotal: guardrailItems.reduce((total, item) => total + item.count, 0),
      items: guardrailItems,
    },
    operational: {
      available: operationalAvailable,
      health: operationalAvailable ? AGENT_OVERVIEW_OPERATIONAL_HEALTH : null,
      metrics: operationalAvailable
        ? AGENT_OVERVIEW_OPERATIONAL_METRICS.map(metric => ({ ...metric }))
        : [],
      recentSessions,
    },
    hasConnectedResources:
      configuredKnowledge.length
      + configuredMemory.length
      + configuredOrchestration.length
      + configuredSecurity.length > 0,
    usesEagleGreenShowcaseMetrics,
  };
}
