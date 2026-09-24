import {
  CISCO_LIVE_AGENTS,
  CISCO_LIVE_PRIMARY_AGENT_ID,
  CISCO_LIVE_SESSIONS_BY_AGENT,
  type CiscoLiveAgentDefinition,
  type CiscoLiveSession,
} from '../../demo/ciscoLiveDemo.ts';
import type {
  AgentCreationSection,
  AgentDraft,
} from '../agent-creation/agentCreationModel.ts';

export type DemoHomeMode = 'first-time' | 'recurring';

export type AttentionSeverity = 'critical' | 'high' | 'review' | 'info';

export type AgentHomeSection = 'metrics' | 'attention' | 'activity' | 'fleet';

export interface AgentHomeAction {
  id: string;
  label: string;
  href?: string;
  prompt?: string;
  intent: 'navigate' | 'ask' | 'start-intake' | 'show-templates' | 'try-demo' | 'request-access';
  requiresConfirmation: boolean;
}

export interface AgentHomeMetric {
  id: 'agent-health' | 'sessions' | 'usage' | 'needs-review';
  label: string;
  value: string;
  numericValue: number | null;
  scope: string;
  timeWindow: string;
  freshness: string;
  drillDown: AgentHomeAction;
  visualization?: {
    kind: 'health-gauge';
    target: number;
    gap: number | null;
    signalCount: number;
  } | {
    kind: 'agent-session-bars';
    total: number;
    agents: Array<{
      agentId: string;
      name: string;
      label: string;
      sessions: number;
    }>;
  } | {
    kind: 'token-usage-donut';
    usedTokens: number;
    tokenLimit: number;
    usagePercent: number;
    estimatedCostUsd: number;
    simulated: true;
  };
}

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  description: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'danger' | 'neutral';
  agentId: string;
  agentName: string;
  sessionId?: string;
  observedAt: string;
  actions: AgentHomeAction[];
}

export interface FleetAgentSummary {
  agentId: string;
  name: string;
  initials: string;
  lifecycle: {
    value: 'draft' | 'published' | 'deployed' | 'live';
    label: string;
  };
  health: {
    value: 'healthy' | 'needs-attention' | 'unknown';
    label: string;
  };
  activity: {
    value: 'active' | 'idle' | 'none';
    label: string;
  };
  usage: {
    sessions: number;
    messages: number;
    successRate: number | null;
  };
  lastUpdate: string;
  href: string;
  observabilityHref: string;
}

export interface WorkflowActivity {
  id: string;
  sequence: number;
  kind: 'guardrail' | 'handoff' | 'action';
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  status: 'completed' | 'in-progress';
  timestamp: string;
  sessionId?: string;
  href?: string;
  externalReference?: string;
}

export interface AgentHomeDataState {
  loading: boolean;
  stale: boolean;
  partial: boolean;
  permission: 'granted' | 'missing';
  allClear: boolean;
  hasActivity: boolean;
  assistant: 'ready' | 'unavailable';
  resumableDraft: boolean;
  unavailableSections: AgentHomeSection[];
  notices: Array<{
    id: string;
    tone: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    description: string;
  }>;
}

export interface AgentHomeQuickStart {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: 'plus-circle' | 'apps' | 'play-circle';
  action: AgentHomeAction;
}

export interface AgentHomeOnboardingStep {
  id: 'define' | 'connect' | 'test' | 'review';
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface AgentHomeDraftResume {
  draftId: string;
  name: string;
  stepId: AgentHomeOnboardingStep['id'];
  section: AgentCreationSection;
  sectionLabel: string;
  updatedAt: string;
  href: string;
}

export interface AgentHomeSnapshot {
  mode: DemoHomeMode;
  generatedAt: string;
  header: {
    eyebrow: string;
    title: string;
    description: string;
  };
  dataState: AgentHomeDataState;
  composer: {
    placeholder: string;
    disabled: boolean;
    suggestions: string[];
  };
  metrics: AgentHomeMetric[];
  attentionItems: AttentionItem[];
  workflowActivity: WorkflowActivity[];
  fleet: FleetAgentSummary[];
  quickStarts: AgentHomeQuickStart[];
  onboarding: AgentHomeOnboardingStep[];
  resumeDraft: AgentHomeDraftResume | null;
  actions: AgentHomeAction[];
  assistantPolicy: {
    may: Array<'observe' | 'explain' | 'recommend' | 'navigate' | 'prepare'>;
    confirmationRequiredFor: string[];
    failureMessage?: string;
  };
}

export interface AgentHomeBuildOptions {
  generatedAt?: string;
  loading?: boolean;
  stale?: boolean;
  partial?: boolean;
  permissionGranted?: boolean;
  allClear?: boolean;
  noActivity?: boolean;
  assistantAvailable?: boolean;
  draft?: AgentDraft | null;
  agents?: readonly CiscoLiveAgentDefinition[];
  sessionsByAgent?: Readonly<Record<string, readonly CiscoLiveSession[]>>;
  additionalAttentionItems?: readonly AttentionItem[];
}

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const DEMO_HOME_MODE_STORAGE_KEY = 'eva.agent-home.demo-mode';

export const DEFAULT_DEMO_HOME_MODE: DemoHomeMode = 'first-time';

export const AGENT_HOME_REFERENCE_TIME = '2026-08-09T09:47:00-07:00';

const TIME_WINDOW = 'Last 24 hours';
const CURRENT_FRESHNESS = 'Updated just now';
const STALE_FRESHNESS = 'Last refreshed 30 minutes ago';
const SIMULATED_TOKEN_LIMIT = 10_000_000;
const SIMULATED_TOKEN_USAGE = 6_800_000;
const SIMULATED_ESTIMATED_COST_USD = 124.8;
const AGGREGATE_HEALTH_TARGET = 85;
const AGGREGATE_HEALTH_SIGNALS = [98.4, 97.2, 96.7, 95.9, 95.1, 94.4, 92.9] as const;

const severityOrder: Record<AttentionSeverity, number> = {
  critical: 0,
  high: 1,
  review: 2,
  info: 3,
};

const confirmationRequiredFor = [
  'Publish or deploy an agent',
  'Pause a live agent',
  'Change credentials',
  'Edit guardrails',
  'Run a bulk action',
];

const QUICK_STARTS: AgentHomeQuickStart[] = [
  {
    id: 'start-with-assistant',
    eyebrow: 'Start',
    title: 'Build with AI Assistant',
    description: 'Describe the outcome. AI Assistant will ask a few questions and prepare a proposal.',
    icon: 'plus-circle',
    action: {
      id: 'create-first-agent',
      label: 'Start building',
      prompt: 'Help me build my first AI agent.',
      intent: 'start-intake',
      requiresConfirmation: false,
    },
  },
  {
    id: 'choose-template',
    eyebrow: 'Templates',
    title: 'Choose a template',
    description: 'Start with a ready-made agent, then tailor it to your workflow.',
    icon: 'apps',
    action: {
      id: 'browse-templates',
      label: 'Browse templates',
      intent: 'show-templates',
      requiresConfirmation: false,
    },
  },
  {
    id: 'try-demo',
    eyebrow: 'Demo',
    title: 'See an agent in action',
    description: 'Choose an industry use case, then test a configured agent in preview.',
    icon: 'play-circle',
    action: {
      id: 'try-demo',
      label: 'Open demo',
      intent: 'try-demo',
      requiresConfirmation: false,
    },
  },
];

const ONBOARDING_STEPS: Array<Pick<AgentHomeOnboardingStep, 'id' | 'label'>> = [
  { id: 'define', label: 'Define the job' },
  { id: 'connect', label: 'Connect resources' },
  { id: 'test', label: 'Test behavior' },
  { id: 'review', label: 'Review and publish' },
];

const SECTION_LABELS: Partial<Record<AgentCreationSection, string>> = {
  basics: 'Profile',
  instructions: 'Instructions',
  language: 'Language',
  voice: 'Voice',
  channels: 'Channels',
  identity: 'Security',
  memory: 'Memory',
  handoff: 'Action',
  knowledge: 'Knowledge',
  actions: 'Action',
  security: 'Security',
  testing: 'Testing',
  preview: 'Testing',
  deployment: 'Deployment',
};

const CONNECT_SECTIONS: AgentCreationSection[] = [
  'channels',
  'knowledge',
  'memory',
  'actions',
  'handoff',
  'security',
];

const isDemoHomeMode = (value: unknown): value is DemoHomeMode =>
  value === 'first-time' || value === 'recurring';

const defaultStorage = (): SessionStorageLike | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

export function readDemoHomeMode(storage: SessionStorageLike | undefined = defaultStorage()): DemoHomeMode {
  if (!storage) return DEFAULT_DEMO_HOME_MODE;
  try {
    const value = storage.getItem(DEMO_HOME_MODE_STORAGE_KEY);
    return isDemoHomeMode(value) ? value : DEFAULT_DEMO_HOME_MODE;
  } catch {
    return DEFAULT_DEMO_HOME_MODE;
  }
}

export function persistDemoHomeMode(
  mode: DemoHomeMode,
  storage: SessionStorageLike | undefined = defaultStorage(),
): DemoHomeMode {
  if (!storage) return mode;
  try {
    storage.setItem(DEMO_HOME_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable in private or locked-down browsing contexts.
  }
  return mode;
}

const parseDisplayNumber = (value: string): number => {
  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatInteger = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const displayLifecycle = (status: string): FleetAgentSummary['lifecycle'] => {
  const value = status.trim().toLowerCase();
  if (value.includes('live')) return { value: 'live', label: 'Live' };
  if (value.includes('deploy')) return { value: 'deployed', label: 'Deployed' };
  if (value.includes('publish')) return { value: 'published', label: 'Published' };
  return { value: 'draft', label: 'Draft' };
};

const getLastUpdate = (agent: CiscoLiveAgentDefinition): string => {
  const relativeUpdate = agent.meta.match(/Last updated\s+(.+)$/i)?.[1];
  return relativeUpdate ? `Updated ${relativeUpdate}` : `Updated ${agent.updatedOn}`;
};

const getPrimarySession = (
  sessionsByAgent: Readonly<Record<string, readonly CiscoLiveSession[]>>,
): CiscoLiveSession | undefined =>
  sessionsByAgent[CISCO_LIVE_PRIMARY_AGENT_ID]?.find(session => session.id === 'SES-GT-1042');

export const buildDashboardSessionHref = (agentId: string, sessionId: string): string =>
  `/agents/${encodeURIComponent(agentId)}/sessions?sessionId=${encodeURIComponent(sessionId)}&source=dashboard`;

export function rankAttentionItems(items: readonly AttentionItem[]): AttentionItem[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const severityDelta = severityOrder[left.item.severity] - severityOrder[right.item.severity];
      if (severityDelta !== 0) return severityDelta;
      const timeDelta = right.item.observedAt.localeCompare(left.item.observedAt);
      if (timeDelta !== 0) return timeDelta;
      const idDelta = left.item.id.localeCompare(right.item.id);
      return idDelta !== 0 ? idDelta : left.index - right.index;
    })
    .map(({ item }) => ({ ...item, actions: item.actions.map(action => ({ ...action })) }));
}

const buildDefaultAttentionItem = (
  agents: readonly CiscoLiveAgentDefinition[],
  sessionsByAgent: Readonly<Record<string, readonly CiscoLiveSession[]>>,
): AttentionItem | null => {
  const agent = agents.find(candidate => candidate.id === CISCO_LIVE_PRIMARY_AGENT_ID);
  const session = getPrimarySession(sessionsByAgent);
  if (!agent || !session) return null;

  return {
    id: 'review-large-reservation-handoff',
    severity: 'review',
    title: 'Review the large-reservation handoff',
    description: 'The guardrail stopped an automated booking for 1,000 people and transferred the request with its context attached.',
    statusLabel: session.guardrail?.status ?? 'Working as designed',
    statusTone: 'success',
    agentId: agent.id,
    agentName: agent.name,
    sessionId: session.id,
    observedAt: '2026-08-09T09:42:00-07:00',
    actions: [
      {
        id: 'review-session',
        label: 'Review session',
        href: buildDashboardSessionHref(agent.id, session.id),
        intent: 'navigate',
        requiresConfirmation: false,
      },
      {
        id: 'watch-workflow',
        label: 'Watch workflow',
        href: '#agent-home-workflow',
        intent: 'navigate',
        requiresConfirmation: false,
      },
    ],
  };
};

const buildWorkflowActivity = (
  agents: readonly CiscoLiveAgentDefinition[],
  sessionsByAgent: Readonly<Record<string, readonly CiscoLiveSession[]>>,
): WorkflowActivity[] => {
  const primary = agents.find(agent => agent.id === CISCO_LIVE_PRIMARY_AGENT_ID);
  const operations = agents.find(agent => agent.id === 'golftop-event-operations');
  const serviceNow = agents.find(agent => agent.id === 'golftop-servicenow-coordinator');
  const primarySession = getPrimarySession(sessionsByAgent);
  const operationsSession = sessionsByAgent['golftop-event-operations']?.find(session => session.id === 'SES-OPS-2086');
  const serviceNowSession = sessionsByAgent['golftop-servicenow-coordinator']?.find(session => session.id === 'SES-SN-3214');

  if (!primary || !operations || !serviceNow || !primarySession || !operationsSession || !serviceNowSession) {
    return [];
  }

  return [
    {
      id: 'vip-reservations-guardrail',
      sequence: 1,
      kind: 'guardrail',
      title: 'VIP Reservations paused automated booking',
      description: 'The large-reservation guardrail stopped the 1,000-person booking and prepared a governed handoff.',
      agentId: primary.id,
      agentName: primary.name,
      status: 'completed',
      timestamp: '9:42 AM',
      sessionId: primarySession.id,
      href: buildDashboardSessionHref(primary.id, primarySession.id),
    },
    {
      id: 'event-operations-handoff',
      sequence: 2,
      kind: 'handoff',
      title: 'Event Operations coordinated fulfillment',
      description: 'The event agent received the approved context and coordinated capacity, catering, staffing, and facilities work.',
      agentId: operations.id,
      agentName: operations.name,
      status: 'in-progress',
      timestamp: '9:45 AM',
      sessionId: operationsSession.id,
      href: buildDashboardSessionHref(operations.id, operationsSession.id),
    },
    {
      id: 'servicenow-ticket-created',
      sequence: 3,
      kind: 'action',
      title: 'ServiceNow created FAC-3214',
      description: serviceNowSession.summary,
      agentId: serviceNow.id,
      agentName: serviceNow.name,
      status: 'completed',
      timestamp: '9:46 AM',
      sessionId: serviceNowSession.id,
      href: buildDashboardSessionHref(serviceNow.id, serviceNowSession.id),
      externalReference: 'FAC-3214',
    },
  ];
};

const buildFleet = (
  agents: readonly CiscoLiveAgentDefinition[],
  noActivity: boolean,
): FleetAgentSummary[] => agents.map(agent => {
  const sessions = noActivity ? 0 : parseDisplayNumber(agent.sessions);
  const messages = noActivity ? 0 : parseDisplayNumber(agent.messages);
  const successRate = noActivity ? null : parseDisplayNumber(agent.successRate);

  return {
    agentId: agent.id,
    name: agent.name,
    initials: agent.initials,
    lifecycle: displayLifecycle(agent.status),
    health: { value: 'healthy', label: 'Healthy' },
    activity: noActivity
      ? { value: 'none', label: 'No activity yet' }
      : { value: 'active', label: 'Active in the last 24 hours' },
    usage: { sessions, messages, successRate },
    lastUpdate: getLastUpdate(agent),
    href: `/agents/${encodeURIComponent(agent.id)}`,
    observabilityHref: `/observability?agentId=${encodeURIComponent(agent.id)}`,
  };
});

const getPortfolioTotals = (fleet: readonly FleetAgentSummary[]) => {
  const publishedAgents = fleet.filter(agent => agent.lifecycle.value === 'published').length;
  const totalSessions = fleet.reduce((sum, agent) => sum + agent.usage.sessions, 0);
  const aggregateHealth = fleet.length === 0
    ? null
    : Math.round((AGGREGATE_HEALTH_SIGNALS.reduce((sum, score) => sum + score, 0)
      / AGGREGATE_HEALTH_SIGNALS.length) * 10) / 10;
  const weightedSuccess = totalSessions === 0
    ? null
    : fleet.reduce(
      (sum, agent) => sum + agent.usage.sessions * (agent.usage.successRate ?? 0),
      0,
    ) / totalSessions;
  return {
    publishedAgents,
    aggregateHealth,
    totalSessions,
    weightedSuccess: weightedSuccess === null ? null : Math.round(weightedSuccess * 10) / 10,
  };
};

const buildMetrics = (
  fleet: readonly FleetAgentSummary[],
  reviewCount: number,
  stale: boolean,
): AgentHomeMetric[] => {
  const {
    publishedAgents,
    aggregateHealth,
    totalSessions,
  } = getPortfolioTotals(fleet);
  const freshness = stale ? STALE_FRESHNESS : CURRENT_FRESHNESS;
  const scope = `${publishedAgents} published agents`;
  const hasHealthData = fleet.length > 0;
  const usedTokens = totalSessions === 0 ? 0 : SIMULATED_TOKEN_USAGE;
  const tokenUsagePercent = Math.round((usedTokens / SIMULATED_TOKEN_LIMIT) * 100);
  const estimatedCostUsd = totalSessions === 0 ? 0 : SIMULATED_ESTIMATED_COST_USD;

  return [
    {
      id: 'agent-health',
      label: 'Aggregate health',
      value: aggregateHealth === null
        ? '—'
        : `${aggregateHealth.toFixed(Number.isInteger(aggregateHealth) ? 0 : 1)}%`,
      numericValue: aggregateHealth,
      scope: !hasHealthData
        ? 'Health data unavailable'
        : `Across ${AGGREGATE_HEALTH_SIGNALS.length} health signals`,
      visualization: {
        kind: 'health-gauge',
        target: AGGREGATE_HEALTH_TARGET,
        gap: aggregateHealth === null ? null : Math.round((aggregateHealth - AGGREGATE_HEALTH_TARGET) * 10) / 10,
        signalCount: hasHealthData ? AGGREGATE_HEALTH_SIGNALS.length : 0,
      },
      timeWindow: 'Current status',
      freshness,
      drillDown: {
        id: 'open-observability-health',
        label: 'View observability',
        href: '/observability',
        intent: 'navigate',
        requiresConfirmation: false,
      },
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: formatInteger(totalSessions),
      numericValue: totalSessions,
      scope,
      visualization: {
        kind: 'agent-session-bars',
        total: totalSessions,
        agents: fleet.map(agent => ({
          agentId: agent.agentId,
          name: agent.name,
          label: agent.name.replace(/^EAGLE GREEN\s+/, ''),
          sessions: agent.usage.sessions,
        })),
      },
      timeWindow: TIME_WINDOW,
      freshness,
      drillDown: {
        id: 'open-observability-sessions',
        label: 'Open sessions',
        href: '/observability',
        intent: 'navigate',
        requiresConfirmation: false,
      },
    },
    {
      id: 'usage',
      label: 'Usage & billing',
      value: `${tokenUsagePercent}%`,
      numericValue: tokenUsagePercent,
      scope,
      visualization: {
        kind: 'token-usage-donut',
        usedTokens,
        tokenLimit: SIMULATED_TOKEN_LIMIT,
        usagePercent: tokenUsagePercent,
        estimatedCostUsd,
        simulated: true,
      },
      timeWindow: TIME_WINDOW,
      freshness,
      drillDown: {
        id: 'open-observability-usage',
        label: 'View usage',
        href: '/observability',
        intent: 'navigate',
        requiresConfirmation: false,
      },
    },
    {
      id: 'needs-review',
      label: 'Recommended for review',
      value: String(reviewCount),
      numericValue: reviewCount,
      scope,
      timeWindow: TIME_WINDOW,
      freshness,
      drillDown: {
        id: 'open-review-item',
        label: reviewCount > 0 ? 'Review session' : 'View activity',
        href: reviewCount > 0
          ? buildDashboardSessionHref(CISCO_LIVE_PRIMARY_AGENT_ID, 'SES-GT-1042')
          : '/observability',
        intent: 'navigate',
        requiresConfirmation: false,
      },
    },
  ];
};

const sentenceCount = (value: number): string => {
  if (value === 0) return 'No';
  if (value === 1) return 'One';
  if (value === 2) return 'Two';
  if (value === 3) return 'Three';
  return formatInteger(value);
};

const buildRecurringBriefing = (
  fleet: readonly FleetAgentSummary[],
  reviewCount: number,
  options: ReturnType<typeof normalizeOptions>,
): string => {
  if (!options.permissionGranted) {
    return 'You need an AI Agent Studio license or monitoring role to view portfolio activity.';
  }
  if (options.loading) {
    return 'Refreshing portfolio status and recent activity. Verified actions remain available while data loads.';
  }

  const { publishedAgents, totalSessions, weightedSuccess } = getPortfolioTotals(fleet);
  const agentLabel = publishedAgents === 1 ? 'published agent' : 'published agents';
  if (options.noActivity || totalSessions === 0) {
    return `${sentenceCount(publishedAgents)} ${agentLabel} are ready. No sessions have been recorded yet.`;
  }

  const reviewSentence = reviewCount === 0
    ? 'No sessions are recommended for review.'
    : `${sentenceCount(reviewCount)} ${reviewCount === 1 ? 'session is' : 'sessions are'} recommended for review.`;
  const freshnessSentence = options.stale
    ? ' Live telemetry is delayed, so these values use the last available refresh.'
    : options.partial
      ? ' Workflow activity is temporarily incomplete.'
      : '';
  return `${sentenceCount(publishedAgents)} ${agentLabel} handled ${formatInteger(totalSessions)} sessions at ${weightedSuccess?.toFixed(1) ?? '—'}% weighted success. ${reviewSentence}${freshnessSentence}`;
};

const isCapabilityUnresolved = (draft: AgentDraft, section: AgentCreationSection): boolean => {
  const capabilities = Object.values(draft.familyConfiguration ?? {});
  return capabilities.some(capability =>
    (capability.id === section || capability.section === section)
    && capability.progress !== 'configured'
    && capability.progress !== 'skipped'
    && capability.progress !== 'blocked',
  );
};

const getResumeSection = (draft: AgentDraft): AgentCreationSection => {
  if (!draft.basics.name.trim() || !draft.basics.purpose.trim()) return 'basics';
  if (!draft.instructions.applied || !draft.instructions.content.trim()) return 'instructions';

  if (CONNECT_SECTIONS.includes(draft.activeSection) && isCapabilityUnresolved(draft, draft.activeSection)) {
    return draft.activeSection;
  }

  const unfinishedConnection = CONNECT_SECTIONS.find(section => isCapabilityUnresolved(draft, section));
  if (unfinishedConnection) return unfinishedConnection;
  if (draft.previewState.status !== 'passed') return 'testing';
  return 'deployment';
};

const getOnboardingStepId = (section: AgentCreationSection): AgentHomeOnboardingStep['id'] => {
  if (section === 'basics' || section === 'instructions' || section === 'language' || section === 'voice') {
    return 'define';
  }
  if (section === 'testing' || section === 'preview') return 'test';
  if (section === 'deployment' || section === 'audit' || section === 'observability' || section === 'insights') {
    return 'review';
  }
  return 'connect';
};

const buildDraftResume = (draft: AgentDraft | null | undefined): AgentHomeDraftResume | null => {
  if (!draft || draft.lifecycle !== 'draft') return null;
  const section = getResumeSection(draft);
  const stepId = getOnboardingStepId(section);
  const sectionLabel = SECTION_LABELS[section] ?? section.replace(/[_-]+/g, ' ');
  return {
    draftId: draft.id,
    name: draft.basics.name || 'Untitled agent',
    stepId,
    section,
    sectionLabel,
    updatedAt: draft.updatedAt,
    href: `/agents/${encodeURIComponent(draft.id)}/configure?section=${encodeURIComponent(sectionLabel)}`,
  };
};

const buildOnboarding = (resumeDraft: AgentHomeDraftResume | null): AgentHomeOnboardingStep[] => {
  const currentIndex = resumeDraft
    ? ONBOARDING_STEPS.findIndex(step => step.id === resumeDraft.stepId)
    : 0;
  return ONBOARDING_STEPS.map((step, index) => ({
    ...step,
    status: index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming',
  }));
};

const buildNotices = (
  options: Required<Pick<
    AgentHomeBuildOptions,
    'loading' | 'stale' | 'partial' | 'permissionGranted' | 'allClear' | 'noActivity' | 'assistantAvailable'
  >>,
): AgentHomeDataState['notices'] => {
  const notices: AgentHomeDataState['notices'] = [];
  if (options.loading) notices.push({
    id: 'loading',
    tone: 'info',
    title: 'Loading agent activity',
    description: 'Portfolio status and recent activity are being refreshed.',
  });
  if (options.stale) notices.push({
    id: 'stale',
    tone: 'warning',
    title: 'Showing the last available update',
    description: 'Live telemetry is delayed. Values remain labeled with their last refresh time.',
  });
  if (options.partial) notices.push({
    id: 'partial',
    tone: 'warning',
    title: 'Some activity is unavailable',
    description: 'Portfolio totals are available, but the workflow timeline could not be loaded.',
  });
  if (!options.permissionGranted) notices.push({
    id: 'permission',
    tone: 'danger',
    title: 'Agent access is required',
    description: 'Request the required license or role to create and monitor AI agents.',
  });
  if (options.allClear) notices.push({
    id: 'all-clear',
    tone: 'success',
    title: 'No items need attention',
    description: 'Current operational signals are within their expected ranges.',
  });
  if (options.noActivity) notices.push({
    id: 'no-activity',
    tone: 'info',
    title: 'No activity yet',
    description: 'Published agents will show usage and operational signals after their first sessions.',
  });
  if (!options.assistantAvailable) notices.push({
    id: 'assistant-failure',
    tone: 'warning',
    title: 'Assistant is temporarily unavailable',
    description: 'Dashboard links and verified operational data remain available.',
  });
  return notices;
};

const normalizeOptions = (options: AgentHomeBuildOptions) => ({
  loading: options.loading ?? false,
  stale: options.stale ?? false,
  partial: options.partial ?? false,
  permissionGranted: options.permissionGranted ?? true,
  allClear: options.allClear ?? false,
  noActivity: options.noActivity ?? false,
  assistantAvailable: options.assistantAvailable ?? true,
});

const buildDataState = (
  options: ReturnType<typeof normalizeOptions>,
  resumeDraft: AgentHomeDraftResume | null,
): AgentHomeDataState => ({
  loading: options.loading,
  stale: options.stale,
  partial: options.partial,
  permission: options.permissionGranted ? 'granted' : 'missing',
  allClear: options.allClear,
  hasActivity: !options.noActivity,
  assistant: options.assistantAvailable ? 'ready' : 'unavailable',
  resumableDraft: Boolean(resumeDraft),
  unavailableSections: options.partial ? ['activity'] : [],
  notices: buildNotices(options),
});

const assistantPolicy = (assistantAvailable: boolean): AgentHomeSnapshot['assistantPolicy'] => ({
  may: ['observe', 'explain', 'recommend', 'navigate', 'prepare'],
  confirmationRequiredFor: [...confirmationRequiredFor],
  ...(assistantAvailable ? {} : {
    failureMessage: 'I cannot generate a new summary right now. You can still use the verified dashboard links and review the latest activity.',
  }),
});

export function buildFirstTimeAgentHomeSnapshot(
  options: AgentHomeBuildOptions = {},
): AgentHomeSnapshot {
  const normalized = normalizeOptions(options);
  /* The prototype's First-time state is a deliberate fresh-user scenario.
     Existing local demo drafts belong to other states and never alter this
     welcome or add resume context. */
  const resumeDraft = null;
  const hasPermission = normalized.permissionGranted;
  const title = !hasPermission
    ? 'Request access to build an agent'
    : 'Let’s build your first agent';
  const description = !hasPermission
    ? 'You need an AI Agent Studio license or role before you can create and monitor agents.'
    : 'Start with an idea, choose a template, or try a demo. I’ll help you shape the details.';

  return {
    mode: 'first-time',
    generatedAt: options.generatedAt ?? AGENT_HOME_REFERENCE_TIME,
    header: {
      eyebrow: hasPermission ? 'Hi Jackie' : 'AI Agent Studio',
      title,
      description,
    },
    dataState: buildDataState(normalized, resumeDraft),
    composer: {
      placeholder: 'Ask me anything',
      disabled: !hasPermission || !normalized.assistantAvailable,
      suggestions: [],
    },
    metrics: [],
    attentionItems: [],
    workflowActivity: [],
    fleet: [],
    quickStarts: QUICK_STARTS.map(item => ({ ...item })),
    onboarding: buildOnboarding(resumeDraft),
    resumeDraft,
    actions: !hasPermission
      ? [{
        id: 'request-access',
        label: 'Request access',
        href: '/settings/organization',
        intent: 'request-access',
        requiresConfirmation: false,
      }]
      : QUICK_STARTS.map(item => ({ ...item.action })),
    assistantPolicy: assistantPolicy(normalized.assistantAvailable),
  };
}

export function buildRecurringAgentHomeSnapshot(
  options: AgentHomeBuildOptions = {},
): AgentHomeSnapshot {
  const normalized = normalizeOptions(options);
  const resumeDraft = buildDraftResume(options.draft);
  const agents = options.agents ?? CISCO_LIVE_AGENTS;
  const sessionsByAgent = options.sessionsByAgent ?? CISCO_LIVE_SESSIONS_BY_AGENT;
  const defaultAttention = buildDefaultAttentionItem(agents, sessionsByAgent);
  const attentionItems = normalized.allClear || normalized.noActivity
    ? []
    : rankAttentionItems([
      ...(options.additionalAttentionItems ?? []),
      ...(defaultAttention ? [defaultAttention] : []),
    ]);
  const fleet = buildFleet(agents, normalized.noActivity);
  const canShowOperationalData = !normalized.loading && normalized.permissionGranted;
  const metrics = canShowOperationalData
    ? buildMetrics(fleet, attentionItems.length, normalized.stale)
    : [];
  const workflowActivity = canShowOperationalData && !normalized.partial && !normalized.noActivity
    ? buildWorkflowActivity(agents, sessionsByAgent)
    : [];
  const briefing = buildRecurringBriefing(fleet, attentionItems.length, normalized);

  return {
    mode: 'recurring',
    generatedAt: options.generatedAt ?? AGENT_HOME_REFERENCE_TIME,
    header: {
      eyebrow: 'Today’s agent briefing',
      title: normalized.permissionGranted ? 'Here’s how your agents are doing' : 'Request access to agent operations',
      description: briefing,
    },
    dataState: buildDataState(normalized, resumeDraft),
    composer: {
      placeholder: 'Ask me anything',
      disabled: !normalized.permissionGranted || !normalized.assistantAvailable,
      suggestions: [
        'Summarize activity',
        'What needs my attention?',
        'Compare agent performance',
      ],
    },
    metrics,
    attentionItems: canShowOperationalData ? attentionItems : [],
    workflowActivity,
    fleet: canShowOperationalData ? fleet : [],
    quickStarts: [],
    onboarding: resumeDraft ? buildOnboarding(resumeDraft) : [],
    resumeDraft,
    actions: normalized.permissionGranted
      ? [
        {
          id: 'open-observability',
          label: 'Open observability',
          href: '/observability',
          intent: 'navigate',
          requiresConfirmation: false,
        },
        {
          id: 'open-agent-library',
          label: 'All agents',
          href: '/agents',
          intent: 'navigate',
          requiresConfirmation: false,
        },
        {
          id: 'review-session',
          label: 'Review session',
          href: buildDashboardSessionHref(CISCO_LIVE_PRIMARY_AGENT_ID, 'SES-GT-1042'),
          intent: 'navigate',
          requiresConfirmation: false,
        },
        {
          id: 'summarize-activity',
          label: 'Summarize activity',
          prompt: 'Summarize the latest activity across my agents.',
          intent: 'ask',
          requiresConfirmation: false,
        },
        {
          id: 'create-agent',
          label: 'Create agent',
          prompt: 'Help me create another AI agent.',
          intent: 'start-intake',
          requiresConfirmation: false,
        },
      ]
      : [{
        id: 'request-access',
        label: 'Request access',
        href: '/settings/organization',
        intent: 'request-access',
        requiresConfirmation: false,
      }],
    assistantPolicy: assistantPolicy(normalized.assistantAvailable),
  };
}

export function buildAgentHomeSnapshot(
  mode: DemoHomeMode,
  options: AgentHomeBuildOptions = {},
): AgentHomeSnapshot {
  return mode === 'first-time'
    ? buildFirstTimeAgentHomeSnapshot(options)
    : buildRecurringAgentHomeSnapshot(options);
}
