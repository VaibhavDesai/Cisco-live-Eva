import type {
  CiscoLiveActionControlDecisionSummary,
  CiscoLiveOperationalHealthMetric,
  CiscoLiveSession,
} from './ciscoLiveDemo';

/** Illustrative runtime data for the 360 Feedback Agent demo, never live HR data. */
export const FEEDBACK360_OVERVIEW_DEMO_LABEL = 'Illustrative demo data';

export const FEEDBACK360_OVERVIEW_HEALTH = {
  score: 96.8,
  target: 85,
  signals: 8,
} as const;

export const FEEDBACK360_OVERVIEW_METRICS: CiscoLiveOperationalHealthMetric[] = [
  { id: 'feedback-completion', observabilityKpiId: 'feedback-completion', label: 'Feedback completion rate', value: '84.2%', change: '+5.3%', isPositive: true },
  { id: 'anonymization-check', observabilityKpiId: 'anonymization-check', label: 'Anonymization check pass rate', value: '99.2%', change: '+0.6%', isPositive: true },
  { id: 'confidentiality-guardrail', observabilityKpiId: 'confidentiality-guardrail', label: 'Confidentiality policy pass rate', value: '99.3%', change: '+0.2%', isPositive: true },
  { id: 'participant-consent', observabilityKpiId: 'participant-consent', label: 'Participant consent rate', value: '98.9%', change: '+0.4%', isPositive: true },
  { id: 'intake-success', observabilityKpiId: 'intake-success', label: 'Feedback intake success rate', value: '97.8%', change: '+1.3%', isPositive: true },
  { id: 'channel-availability', observabilityKpiId: 'channel-availability', label: 'Channel availability', value: '99.7%', change: '+0.2%', isPositive: true },
  { id: 'theme-coverage', observabilityKpiId: 'theme-coverage', label: 'Development theme coverage', value: '92.4%', change: '+3.1%', isPositive: true },
  { id: 'data-minimization', observabilityKpiId: 'data-minimization', label: 'Data minimization pass rate', value: '99.6%', change: '+0.3%', isPositive: true },
];

/** Do not imply an unselected guardrail or summary action has runtime activity. */
export function getFeedback360OverviewMetrics(
  configuredSecurity: readonly string[],
  selectedActions: readonly string[],
): CiscoLiveOperationalHealthMetric[] {
  return FEEDBACK360_OVERVIEW_METRICS.map(metric => {
    if (metric.id === 'confidentiality-guardrail' && configuredSecurity.length === 0) {
      return {
        id: 'confidential-intake',
        observabilityKpiId: 'confidential-intake',
        label: 'Confidential intake rate',
        value: '98.6%',
        change: '+0.4%',
        isPositive: true,
      };
    }
    if (metric.id === 'theme-coverage' && !selectedActions.includes('Generate Anonymized Theme Summary')) {
      return {
        id: 'feedback-prompt-coverage',
        observabilityKpiId: 'feedback-prompt-coverage',
        label: 'Feedback prompt coverage',
        value: '92.4%',
        change: '+3.1%',
        isPositive: true,
      };
    }
    return metric;
  });
}

/** These aggregates are only shown when the saved summary action is selected. */
export const FEEDBACK360_ACTION_CONTROL_SUMMARY_6H: CiscoLiveActionControlDecisionSummary = {
  evaluated: 12,
  matched: 2,
  notMatched: 10,
  actionRan: 2,
  observed: 0,
  steered: 2,
  denied: 0,
  unlocked: 0,
  matchRate: 17,
};

export const FEEDBACK360_ACTION_CONTROL_SUMMARY_24H: CiscoLiveActionControlDecisionSummary = {
  evaluated: 42,
  matched: 7,
  notMatched: 35,
  actionRan: 7,
  observed: 0,
  steered: 7,
  denied: 0,
  unlocked: 0,
  matchRate: 17,
};

const ACTION_SUCCESS_RATES: Record<string, number> = {
  'Generate Anonymized Theme Summary': 98.4,
  'Escalate to HR (if guardrails flagged)': 100,
  'Share Summary in Webex Space': 99.2,
  'Share Summary via Email': 99.1,
  'Send Reminder to Incomplete Respondents': 97.8,
};

export function getFeedback360ActionPerformance(selectedActions: readonly string[]) {
  return selectedActions.map(item => {
    const rate = ACTION_SUCCESS_RATES[item] ?? 97.5;
    return {
      item,
      rate,
      rateLabel: `${rate.toFixed(1)}%`,
      isPositive: rate >= 95,
    };
  });
}

/** Keep the activity labels in sync with the guardrails saved during creation. */
export function getFeedback360GuardrailActivity(configuredNames: readonly string[]) {
  return configuredNames.map((item, index) => ({ item, count: index === 0 ? 1 : 0 }));
}

export interface Feedback360SessionOptions {
  agentName?: string;
  selectedChannels: readonly string[];
  selectedActions: readonly string[];
  configuredSecurity: readonly string[];
}

const channelLabel = (channel: string): CiscoLiveSession['channel'] => (
  channel.toLowerCase() === 'voice'
    ? 'Voice'
    : channel.toLowerCase() === 'video'
      ? 'Video'
      : 'Webex'
);

const topicLabel = (channel: string) => (
  channel.toLowerCase() === 'video' ? 'Guided video feedback' : 'Confidential feedback intake'
);

/**
 * Session rows share the saved channels and action selections. Individual feedback
 * and respondent roles are intentionally absent from the demo transcript.
 */
export function createFeedback360DemoSessions({
  agentName = '360 Feedback Agent',
  selectedChannels,
  selectedActions,
  configuredSecurity,
}: Feedback360SessionOptions): CiscoLiveSession[] {
  if (selectedChannels.length === 0) return [];

  const hasSummaryAction = selectedActions.includes('Generate Anonymized Theme Summary');
  const guardrailName = configuredSecurity[0];
  const channelAt = (index: number) => selectedChannels[index % selectedChannels.length];
  const cohortLabels = ['Peer cohort', 'Direct-report cohort', 'Manager cohort'];

  const intakeSession = (index: number, id: string, updated: string, time: string): CiscoLiveSession => {
    const selectedChannel = channelAt(index);
    const guardrailTriggered = index === 0 && Boolean(guardrailName);
    return {
      id,
      consumerId: `ANON-360-${index + 1}`,
      customer: cohortLabels[index] ?? 'Anonymous cohort',
      channel: channelLabel(selectedChannel),
      topic: topicLabel(selectedChannel),
      updated,
      startedAt: `Today at ${time}`,
      messages: guardrailTriggered ? 4 : 3,
      duration: index === 0 ? '6m 12s' : '5m 34s',
      outcome: 'Resolved',
      guardrailTriggered,
      actionControlTriggered: false,
      transferred: false,
      summary: guardrailTriggered
        ? 'Feedback was captured for pooled analysis. A potentially identifying detail was excluded before aggregation.'
        : 'Feedback was captured for pooled, anonymized theme analysis. Individual responses are hidden in this demo.',
      ...(guardrailTriggered ? {
        guardrail: {
          id: 'feedback360-confidentiality',
          name: guardrailName ?? 'Participant confidentiality',
          policy: 'Do not expose participant identity or individual feedback in a development summary.',
          detected: 'Potentially identifying detail in submitted feedback',
          action: 'Excluded the detail from pooled theme analysis',
          result: 'No identifiable response was included in the summary',
          status: 'Working as designed',
        },
      } : {}),
      connectedSystems: [],
      transcript: [
        {
          id: `${id}-welcome`,
          kind: 'agent',
          speaker: agentName,
          text: 'Thank you for taking part. Your feedback will contribute to an anonymized development summary.',
          time,
        },
        {
          id: `${id}-consent`,
          kind: 'customer',
          speaker: 'Anonymous participant',
          text: 'I understand and am ready to begin.',
          time,
        },
        ...(guardrailTriggered ? [{
          id: `${id}-guardrail`,
          kind: 'guardrail' as const,
          speaker: 'Confidentiality safeguard',
          title: 'Identifying detail excluded',
          text: 'A potentially identifying detail was omitted from pooled theme analysis. The original response is not shown in this demo.',
          detail: 'Confidentiality safeguard triggered',
          time,
        }] : []),
        {
          id: `${id}-complete`,
          kind: 'system',
          speaker: 'Feedback collection',
          text: 'Demo intake complete. Individual feedback content is withheld.',
          time,
        },
      ],
    };
  };

  const sessions = [
    intakeSession(0, 'SES-360-1042', '12 minutes ago', '9:42 AM'),
    intakeSession(1, 'SES-360-1041', '38 minutes ago', '9:16 AM'),
    intakeSession(2, 'SES-360-1040', '1 hour ago', '8:54 AM'),
  ];

  if (hasSummaryAction) {
    const selectedChannel = channelAt(0);
    sessions.push({
      id: 'SES-360-1039',
      consumerId: 'ANON-360-AGGREGATE',
      customer: 'Pooled cohort',
      channel: channelLabel(selectedChannel),
      topic: 'Anonymized theme summary',
      updated: '3 hours ago',
      startedAt: 'Today at 7:04 AM',
      messages: 3,
      duration: '1m 08s',
      outcome: 'Resolved',
      guardrailTriggered: false,
      actionControlTriggered: true,
      transferred: false,
      summary: 'The selected summary action prepared a de-identified set of development themes from an eligible pooled cohort.',
      connectedSystems: [],
      transcript: [
        {
          id: 'SES-360-1039-request',
          kind: 'system',
          speaker: 'Feedback collection',
          text: 'An anonymized theme summary was requested for an eligible pooled cohort.',
          time: '7:04 AM',
        },
        {
          id: 'SES-360-1039-control',
          kind: 'action_control',
          speaker: 'Summary eligibility check',
          title: 'Minimum response threshold matched',
          text: 'The pooled cohort met the minimum response threshold for anonymized summary generation.',
          detail: 'Summary generation continued without exposing individual responses',
          time: '7:04 AM',
          actionControl: {
            controlId: 'feedback360-minimum-response-threshold',
            controlTitle: 'Minimum response threshold',
            actionId: 'feedback360-generate-summary',
            actionName: 'Generate Anonymized Theme Summary',
            timing: 'pre_tool',
            behavior: 'steer',
            invoked: true,
            matched: true,
            evidence: [{ field: 'pooled_response_count', operator: 'greater_than', expected: 4, actual: 8 }],
            result: 'steered',
            toolExecuted: true,
            unlockedActionIds: [],
            unlockedActionNames: [],
            latencyMs: 18,
          },
        },
        {
          id: 'SES-360-1039-complete',
          kind: 'agent',
          speaker: agentName,
          text: 'Anonymized development themes are ready for review. Individual responses are not included.',
          time: '7:05 AM',
        },
      ],
    });
  }

  return sessions;
}
