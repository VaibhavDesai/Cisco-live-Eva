/** Sample data for simulated testing UI (prototype). */

import {
  phase1ObservabilityMetricSeeds,
  type Phase1MetricSeed,
  toSentenceCaseMetricHeading,
} from '../clus-kpi-dashboard/data/phase1ObservabilityMetrics';

export type SimulatedDatePreset = '24h' | 'week' | 'month' | '90d' | 'custom';

/**
 * Observability metric ids for test result modals (phase 1 catalog).
 * Excludes Usage (consumption) and Security — uses Action Performance, AI Quality, and Knowledge Performance.
 */
export const TEST_RESULT_OBSERVABILITY_METRIC_IDS = [
  'ap-workflow-completion-rate',
  'aq-answer-correctness',
  'kp-rag-context-sufficiency',
] as const;

export interface TestScenarioRow {
  id: string;
  name: string;
  type: string;
  channel: string;
  status: string;
  lastRun: string;
  lastUpdated: string;
  updatedBy: string;
  lastUpdatedSortKey: string;
  successRate: string;
  /** Manual flow — optional fields from Add test scenario dialog */
  description?: string;
  instructions?: string;
  expectedOutcome?: string;
  /** Variable ids + per-scenario values */
  scenarioVariablePicks?: { id: string; value: string }[];
}

export const sampleScenarios: TestScenarioRow[] = [
  {
    id: 'scenario-1',
    name: 'Service agent - voice channel',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '2 hours ago',
    lastUpdated: '03/20/2026',
    updatedBy: 'sarah.dev',
    lastUpdatedSortKey: '2026-03-20',
    successRate: '92.4%',
  },
  {
    id: 'scenario-2',
    name: 'Peak load voice containment check',
    type: 'Functional',
    channel: 'Digital',
    status: 'draft',
    lastRun: 'Never',
    lastUpdated: '03/18/2026',
    updatedBy: 'alex.qa',
    lastUpdatedSortKey: '2026-03-18',
    successRate: 'N/A',
  },
  {
    id: 'scenario-3',
    name: 'Multi-channel agent performance',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '1 day ago',
    lastUpdated: '03/15/2026',
    updatedBy: 'sarah.dev',
    lastUpdatedSortKey: '2026-03-15',
    successRate: '87.8%',
  },
  {
    id: 'scenario-4',
    name: 'Context retention stress test',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '5 hours ago',
    lastUpdated: '03/14/2026',
    updatedBy: 'michael.eng',
    lastUpdatedSortKey: '2026-03-14',
    successRate: '79.2%',
  },
  {
    id: 'scenario-5',
    name: 'Slot and entity capture accuracy',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '3 hours ago',
    lastUpdated: '03/12/2026',
    updatedBy: 'alex.qa',
    lastUpdatedSortKey: '2026-03-12',
    successRate: '88.0%',
  },
  {
    id: 'scenario-6',
    name: 'Empathy & tone consistency',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '1 hour ago',
    lastUpdated: '03/10/2026',
    updatedBy: 'sarah.dev',
    lastUpdatedSortKey: '2026-03-10',
    successRate: '91.2%',
  },
  {
    id: 'scenario-7',
    name: 'Multi-step troubleshooting',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '6 hours ago',
    lastUpdated: '03/05/2026',
    updatedBy: 'michael.eng',
    lastUpdatedSortKey: '2026-03-05',
    successRate: '85.4%',
  },
  {
    id: 'scenario-8',
    name: 'Long-thread context handoff',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '2 hours ago',
    lastUpdated: '03/02/2026',
    updatedBy: 'alex.qa',
    lastUpdatedSortKey: '2026-03-02',
    successRate: '94.1%',
  },
  {
    id: 'scenario-9',
    name: 'Regression bundle — checkout',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '30 minutes ago',
    lastUpdated: '03/22/2026',
    updatedBy: 'sarah.dev',
    lastUpdatedSortKey: '2026-03-22',
    successRate: '90.0%',
  },
  {
    id: 'scenario-10',
    name: 'Order detail confirmation flow',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '4 hours ago',
    lastUpdated: '03/21/2026',
    updatedBy: 'alex.qa',
    lastUpdatedSortKey: '2026-03-21',
    successRate: '95.5%',
  },
  {
    id: 'scenario-11',
    name: 'Outbound escalation phrases',
    type: 'Functional',
    channel: 'Digital',
    status: 'active',
    lastRun: '18 hours ago',
    lastUpdated: '03/19/2026',
    updatedBy: 'michael.eng',
    lastUpdatedSortKey: '2026-03-19',
    successRate: '91.0%',
  },
  {
    id: 'scenario-12',
    name: 'Knowledge retrieval grounding',
    type: 'Functional',
    channel: 'Digital',
    status: 'draft',
    lastRun: 'Never',
    lastUpdated: '03/17/2026',
    updatedBy: 'sarah.dev',
    lastUpdatedSortKey: '2026-03-17',
    successRate: 'N/A',
  },
];

function newUserScenarioId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `scenario-user-${crypto.randomUUID()}`;
  }
  return `scenario-user-${Date.now()}`;
}

/** Row for the scenarios table when the user creates a scenario from the dialog (prototype). */
export function createUserTestScenarioRow(name: string): TestScenarioRow {
  const trimmed = name.trim();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return {
    id: newUserScenarioId(),
    name: trimmed,
    type: 'Functional',
    channel: 'Digital',
    status: 'draft',
    lastRun: 'Never',
    lastUpdated: `${m}/${d}/${y}`,
    updatedBy: 'You',
    lastUpdatedSortKey: `${y}-${m}-${d}`,
    successRate: 'N/A',
  };
}

export type ManualTestScenarioDraft = {
  name: string;
  description?: string;
  instructions?: string;
  expectedOutcome?: string;
  scenarioVariablePicks?: { id: string; value: string }[];
};

/** Manual “Create scenario” — table row + dialog fields for downstream runs. */
export function createManualTestScenarioRow(draft: ManualTestScenarioDraft): TestScenarioRow {
  const base = createUserTestScenarioRow(draft.name);
  const desc = draft.description?.trim();
  const instr = draft.instructions?.trim();
  const exp = draft.expectedOutcome?.trim();
  const picks = draft.scenarioVariablePicks?.filter((p) => p.id);
  return {
    ...base,
    ...(desc ? { description: desc } : {}),
    ...(instr ? { instructions: instr } : {}),
    ...(exp ? { expectedOutcome: exp } : {}),
    ...(picks && picks.length > 0 ? { scenarioVariablePicks: picks } : {}),
  };
}

/** Apply dialog fields to an existing row (edit flow); refreshes “last updated” metadata. */
export function applyManualScenarioDraftToExistingRow(
  existing: TestScenarioRow,
  draft: ManualTestScenarioDraft,
): TestScenarioRow {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const desc = draft.description?.trim();
  const instr = draft.instructions?.trim();
  const exp = draft.expectedOutcome?.trim();
  const picks = draft.scenarioVariablePicks?.filter((p) => p.id);

  const next: TestScenarioRow = {
    ...existing,
    name: draft.name.trim(),
    lastUpdated: `${m}/${d}/${y}`,
    lastUpdatedSortKey: `${y}-${m}-${d}`,
    updatedBy: 'You',
  };

  if (desc) next.description = desc;
  else delete next.description;

  if (instr) next.instructions = instr;
  else delete next.instructions;

  if (exp) next.expectedOutcome = exp;
  else delete next.expectedOutcome;

  if (picks && picks.length > 0) next.scenarioVariablePicks = picks;
  else delete next.scenarioVariablePicks;

  return next;
}

/** Rows for “Generate scenarios” (prototype placeholders). */
export function createGeneratedTestScenarioRowBatch(count: number): TestScenarioRow[] {
  const n = Math.min(10, Math.max(1, Math.floor(Number.isFinite(count) ? count : 1)));
  const stamp = Date.now();
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const da = String(now.getDate()).padStart(2, '0');
  const lastUpdated = `${mo}/${da}/${y}`;
  const lastUpdatedSortKey = `${y}-${mo}-${da}`;
  return Array.from({ length: n }, (_, i) => ({
    id: `scenario-gen-${stamp}-${i}`,
    name: `Generated test scenario ${i + 1}`,
    type: 'Functional',
    channel: 'Digital',
    status: 'draft',
    lastRun: 'Never',
    lastUpdated,
    updatedBy: 'You',
    lastUpdatedSortKey,
    successRate: 'N/A',
  }));
}

/** Placeholder variable used when running scenarios (prototype). */
export interface ScenarioVariableRow {
  id: string;
  name: string;
  defaultValue: string;
  description: string;
  /** Variables table — e.g. `12, Apr 26` */
  dateAdded?: string;
  /** Variables table — who created the row */
  addedBy?: string;
}

/** Format for Variables table “Date added” column (e.g. `12, Apr 26`). */
export function formatVariableDateAdded(date: Date = new Date()): string {
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = String(date.getFullYear()).slice(-2);
  return `${day}, ${month} ${year}`;
}

export const sampleScenarioVariables: ScenarioVariableRow[] = [
  {
    id: 'var-1',
    name: 'User_Name',
    defaultValue: 'John Doe',
    description: 'Display name for the end user in scenario scripts.',
    dateAdded: '12, Apr 26',
    addedBy: 'sarah.dev',
  },
  {
    id: 'var-2',
    name: 'Account_ID',
    defaultValue: 'ACC-12345',
    description: 'Account identifier used when resolving customer context for the scenario.',
    dateAdded: '10, Apr 26',
    addedBy: 'alex.qa',
  },
  {
    id: 'var-3',
    name: 'Transaction_Amount',
    defaultValue: '$250.00',
    description: 'Monetary amount used in billing or payment test flows.',
    dateAdded: '08, Apr 26',
    addedBy: 'system',
  },
  {
    id: 'var-4',
    name: 'User_Email',
    defaultValue: 'john.doe@example.com',
    description: 'Email address for notifications and identity checks.',
    dateAdded: '05, Apr 26',
    addedBy: 'sarah.dev',
  },
  {
    id: 'var-5',
    name: 'City',
    defaultValue: 'fd',
    description: 'City or locality for regional routing and scripted content.',
    dateAdded: '01, May 26',
    addedBy: 'current.user',
  },
  {
    id: 'var-6',
    name: 'Phone_Number',
    defaultValue: '+1 415 555 0143',
    description: 'Caller phone number used by IVR and SMS test flows.',
    dateAdded: '28, Apr 26',
    addedBy: 'alex.qa',
  },
  {
    id: 'var-7',
    name: 'Order_ID',
    defaultValue: 'ORD-98217',
    description: 'Order identifier referenced when resolving order-status questions.',
    dateAdded: '24, Apr 26',
    addedBy: 'sarah.dev',
  },
  {
    id: 'var-8',
    name: 'Subscription_Tier',
    defaultValue: 'Premium',
    description: 'Subscription level used to gate entitlements and scripted offers.',
    dateAdded: '20, Apr 26',
    addedBy: 'system',
  },
  {
    id: 'var-9',
    name: 'Locale',
    defaultValue: 'en-US',
    description: 'IETF language tag for localized prompts and replies.',
    dateAdded: '18, Apr 26',
    addedBy: 'sarah.dev',
  },
  {
    id: 'var-10',
    name: 'Time_Zone',
    defaultValue: 'America/Los_Angeles',
    description: 'IANA time zone used when expressing dates, times, and SLAs.',
    dateAdded: '15, Apr 26',
    addedBy: 'alex.qa',
  },
  {
    id: 'var-11',
    name: 'Channel_Source',
    defaultValue: 'web-chat',
    description: 'Origin channel passed into the agent for routing experiments.',
    dateAdded: '11, Apr 26',
    addedBy: 'system',
  },
  {
    id: 'var-12',
    name: 'Last_Interaction',
    defaultValue: '2026-04-09T14:22:00Z',
    description: 'Timestamp of the previous interaction; used for context recall tests.',
    dateAdded: '07, Apr 26',
    addedBy: 'current.user',
  },
];

/** Metric line in evaluation detail modal (observability dashboard catalog). */
export interface EvaluationMetricScore {
  label: string;
  /** 0–100 — drives status chrome (threshold colours and icons). */
  scorePercent: number;
  /** When set, shown as the primary value instead of `${scorePercent}%` (observability dashboard units). */
  valueDisplay?: string;
}

/** Nested scenario row under an evaluation (expandable table). */
export interface EvaluationScenarioRow {
  id: string;
  name: string;
  testType: string;
  date: string;
  scenarioCount: number;
  duration: string;
  successRate: string;
  status: 'Success' | 'Failed';
  /** Per-scenario metrics in detail modal; generated when absent. */
  detailMetrics?: EvaluationMetricScore[];
  /** Bullet points shown in the scenario detail modal under "Success/Failure reasons". */
  successReasons?: string[];
  failureReasons?: string[];
  /** Conversation transcript shown in the Transcript tab. */
  transcript?: ScenarioTranscriptMessage[];
}

/** Top-level evaluation result row. */
export interface EvaluationResultRow {
  id: string;
  name: string;
  testType: string;
  dateLabel: string;
  dateSortKey: string;
  scenarioCount: number;
  duration: string;
  successRate: string;
  /** `Running` is used for in-flight manual runs from the Scenarios tab (prototype). */
  status: 'Success' | 'Failed' | 'Running';
  scenarios: EvaluationScenarioRow[];
  /** Modal “Aggregated performance” rows; generated when absent. */
  aggregatedMetrics?: EvaluationMetricScore[];
}

export function parseSuccessRatePercent(successRate: string): number {
  const n = Number.parseInt(successRate.replace(/%/g, ''), 10);
  return Number.isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
}

const AGGREGATED_SCORE_MULTIPLIERS = [0.98, 1.06, 1.04] as const;
const SCENARIO_SCORE_MULTIPLIERS = [0.92, 1.04, 1.02] as const;

function seedById(id: string): Phase1MetricSeed {
  const s = phase1ObservabilityMetricSeeds.find((m) => m.id === id);
  if (!s) throw new Error(`Unknown observability metric id: ${id}`);
  return s;
}

function parseSeedNumeric(value: string): number | null {
  const cleaned = value.replace(/,/g, '').replace(/%/g, '').trim();
  const n = Number.parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function formatObservabilityValueDisplay(
  seed: Phase1MetricSeed,
  successRatePercent: number,
  rowIndex: number,
  variant: 'aggregated' | 'scenario',
): string {
  const factor = successRatePercent / 100;
  const variantBump = variant === 'scenario' ? -0.02 : 0;
  const jitter = Math.min(1.12, Math.max(0.88, 0.92 + factor * 0.14 + rowIndex * 0.015 + variantBump));

  const raw = seed.value.trim();
  const n = parseSeedNumeric(raw);
  if (n === null) return raw;

  const unitNorm = seed.unit.trim();

  if (unitNorm === '%') {
    const v = Math.min(100, Math.max(0, n * jitter));
    return `${v.toFixed(1)}%`;
  }

  if (raw.includes('%') && unitNorm === '') {
    const v = Math.min(100, Math.max(0, n * jitter));
    return `${v.toFixed(1)}%`;
  }

  const scaled = Math.round(n * jitter);
  if (unitNorm === 'ms') return `${scaled.toLocaleString('en-US')} ms`;
  if (unitNorm === 's') return `${scaled.toLocaleString('en-US')} s`;
  return scaled.toLocaleString('en-US');
}

function observabilityMetricsFromSuccessRate(
  successRate: string,
  variant: 'aggregated' | 'scenario',
): EvaluationMetricScore[] {
  const r = parseSuccessRatePercent(successRate);
  const mults = variant === 'aggregated' ? AGGREGATED_SCORE_MULTIPLIERS : SCENARIO_SCORE_MULTIPLIERS;
  return TEST_RESULT_OBSERVABILITY_METRIC_IDS.map((id, i) => {
    const seed = seedById(id);
    const scorePercent = Math.round(Math.min(100, r * mults[i]));
    return {
      label: toSentenceCaseMetricHeading(seed.heading),
      scorePercent,
      valueDisplay: formatObservabilityValueDisplay(seed, r, i, variant),
    };
  });
}

/** Largest numeric suffix among ids matching `test-NNN` (prototype sequencing). */
export function maxEvalSequenceNumber(ids: string[]): number {
  let max = 0;
  for (const id of ids) {
    const m = /^test-(\d+)$/i.exec(id);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  return max;
}

/** Allocates the next `count` ids after `maxSoFar` (e.g. maxSoFar 9 → test-010 …). */
export function allocEvalIds(maxSoFar: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = maxSoFar + i + 1;
    out.push(`test-${String(n).padStart(3, '0')}`);
  }
  return out;
}

/** Observability metrics for evaluation modals — Action / AI Quality / Knowledge (no Usage or Security seeds). */
export function defaultAggregatedMetricsFromRate(successRate: string): EvaluationMetricScore[] {
  return observabilityMetricsFromSuccessRate(successRate, 'aggregated');
}

export function defaultScenarioMetricsFromRate(successRate: string): EvaluationMetricScore[] {
  return observabilityMetricsFromSuccessRate(successRate, 'scenario');
}

/** A single message in a scenario’s conversation transcript (prototype). */
export interface ScenarioTranscriptMessage {
  speaker: 'User' | 'Agent';
  message: string;
  /** Optional clock label shown under the bubble (e.g. `00:02`). */
  timeLabel?: string;
}

/** Default success bullets shown in the scenario detail modal when none are provided. */
export const defaultScenarioSuccessReasons: string[] = [
  'Usage and latency stayed within expected bounds for the run window',
  'Payment gateway responses validated successfully',
  'User session maintained throughout entire workflow',
  'Observability signals matched baseline thresholds for this scenario',
];

/** Default failure bullets shown in the scenario detail modal when none are provided. */
export const defaultScenarioFailureReasons: string[] = [
  'Scenario fell below the minimum success threshold for the suite',
  'Inconsistent responses detected across repeated runs',
  'One or more observability metrics crossed warning thresholds during the run',
  'Recovery steps did not complete within the allowed interaction budget',
];

/** Default conversation transcript shown when a scenario has none defined. */
export const defaultScenarioTranscript: ScenarioTranscriptMessage[] = [
  {
    speaker: 'User',
    message: 'Hello, I need help with setting up my account',
    timeLabel: '00:00',
  },
  {
    speaker: 'Agent',
    message:
      "Hello! I'd be happy to help you set up your account. Can you tell me what specific part you're having trouble with?",
    timeLabel: '00:02',
  },
  {
    speaker: 'User',
    message: "I can't find where to update my profile information",
    timeLabel: '00:15',
  },
  {
    speaker: 'Agent',
    message: 'I can guide you through that. First, please log into your...',
    timeLabel: '00:17',
  },
];

export const sampleEvaluationResults: EvaluationResultRow[] = [
  {
    id: 'test-001',
    name: 'Comprehensive agent test - December 15',
    testType: 'Functional',
    dateLabel: '12/15/2024',
    dateSortKey: '2024-12-15',
    scenarioCount: 2,
    duration: '12m 34s',
    successRate: '89%',
    status: 'Success',
    scenarios: [
      {
        id: 'scenario-1',
        name: 'Support flow test',
        testType: 'Functional',
        date: '12/15/2024',
        scenarioCount: 1,
        duration: '3m 45s',
        successRate: '87%',
        status: 'Success',
      },
      {
        id: 'scenario-2',
        name: 'Digital channel usage smoke test',
        testType: 'Functional',
        date: '12/15/2024',
        scenarioCount: 1,
        duration: '4m 12s',
        successRate: '94%',
        status: 'Success',
      },
    ],
  },
  {
    id: 'test-002',
    name: 'Voice latency & fulfilment regression - December 14',
    testType: 'Functional',
    dateLabel: '12/14/2024',
    dateSortKey: '2024-12-14',
    scenarioCount: 2,
    duration: '8m 22s',
    successRate: '84%',
    status: 'Failed',
    scenarios: [
      {
        id: 'test-002-a',
        name: 'Peak-hour IVR capture & routing',
        testType: 'Functional',
        date: '12/14/2024',
        scenarioCount: 1,
        duration: '4m 10s',
        successRate: '72%',
        status: 'Failed',
      },
      {
        id: 'test-002-b',
        name: 'Outbound survey — action completion',
        testType: 'Functional',
        date: '12/14/2024',
        scenarioCount: 1,
        duration: '4m 12s',
        successRate: '96%',
        status: 'Success',
      },
    ],
  },
  {
    id: 'test-003',
    name: 'Basic Functionality Test - December 13',
    testType: 'Functional',
    dateLabel: '12/13/2024',
    dateSortKey: '2024-12-13',
    scenarioCount: 1,
    duration: '6m 18s',
    successRate: '52%',
    status: 'Failed',
    scenarios: [
      {
        id: 'test-003-s1',
        name: 'Complex Task Handling',
        testType: 'Functional',
        date: '12/13/2024',
        scenarioCount: 1,
        duration: '6m 18s',
        successRate: '52%',
        status: 'Failed',
      },
    ],
  },
  {
    id: 'test-004',
    name: 'Voice channel regression - December 12',
    testType: 'Functional',
    dateLabel: '12/12/2024',
    dateSortKey: '2024-12-12',
    scenarioCount: 2,
    duration: '9m 52s',
    successRate: '85%',
    status: 'Success',
    scenarios: [
      {
        id: 'scenario-v1',
        name: 'IVR handoff',
        testType: 'Functional',
        date: '12/12/2024',
        scenarioCount: 1,
        duration: '4m 10s',
        successRate: '88%',
        status: 'Success',
      },
      {
        id: 'scenario-v2',
        name: 'Outbound survey leg',
        testType: 'Functional',
        date: '12/12/2024',
        scenarioCount: 1,
        duration: '5m 42s',
        successRate: '82%',
        status: 'Success',
      },
    ],
  },
  {
    id: 'test-005',
    name: 'Customer experience & disclosure suite - December 11',
    testType: 'Functional',
    dateLabel: '12/11/2024',
    dateSortKey: '2024-12-11',
    scenarioCount: 2,
    duration: '7m 10s',
    successRate: '96%',
    status: 'Success',
    scenarios: [
      {
        id: 'test-005-s1',
        name: 'Profile update with consent capture',
        testType: 'Functional',
        date: '12/11/2024',
        scenarioCount: 1,
        duration: '3m 40s',
        successRate: '94%',
        status: 'Success',
      },
      {
        id: 'test-005-s2',
        name: 'Regulatory disclosure script',
        testType: 'Functional',
        date: '12/11/2024',
        scenarioCount: 1,
        duration: '3m 30s',
        successRate: '98%',
        status: 'Success',
      },
    ],
  },
  {
    id: 'test-006',
    name: 'Context retention stress test - December 10',
    testType: 'Functional',
    dateLabel: '12/10/2024',
    dateSortKey: '2024-12-10',
    scenarioCount: 1,
    duration: '11m 45s',
    successRate: '84%',
    status: 'Success',
    scenarios: [],
  },
  {
    id: 'test-007',
    name: 'Goal achievement performance - December 09',
    testType: 'Functional',
    dateLabel: '12/09/2024',
    dateSortKey: '2024-12-09',
    scenarioCount: 1,
    duration: '6m 30s',
    successRate: '91%',
    status: 'Success',
    scenarios: [],
  },
  {
    id: 'test-008',
    name: 'Knowledge retrieval & answer quality - December 08',
    testType: 'Functional',
    dateLabel: '12/08/2024',
    dateSortKey: '2024-12-08',
    scenarioCount: 1,
    duration: '5m 20s',
    successRate: '98%',
    status: 'Success',
    scenarios: [],
  },
  {
    id: 'test-009',
    name: 'Localization & I18n check - December 07',
    testType: 'Functional',
    dateLabel: '12/07/2024',
    dateSortKey: '2024-12-07',
    scenarioCount: 2,
    duration: '8m 05s',
    successRate: '61%',
    status: 'Failed',
    scenarios: [
      {
        id: 'test-009-s1',
        name: 'Locale string format check',
        testType: 'Functional',
        date: '12/07/2024',
        scenarioCount: 1,
        duration: '4m 12s',
        successRate: '55%',
        status: 'Failed',
      },
      {
        id: 'test-009-s2',
        name: 'RTL layout smoke test',
        testType: 'Functional',
        date: '12/07/2024',
        scenarioCount: 1,
        duration: '3m 53s',
        successRate: '67%',
        status: 'Failed',
      },
    ],
  },
  {
    id: 'eval-010',
    name: 'Tool-call validation sweep - December 06',
    testType: 'Functional',
    dateLabel: '12/06/2024',
    dateSortKey: '2024-12-06',
    scenarioCount: 1,
    duration: '7m 12s',
    successRate: '76%',
    status: 'Success',
    scenarios: [],
  },
  {
    id: 'eval-011',
    name: 'Latency regression probe - December 05',
    testType: 'Functional',
    dateLabel: '12/05/2024',
    dateSortKey: '2024-12-05',
    scenarioCount: 1,
    duration: '4m 48s',
    successRate: '88%',
    status: 'Success',
    scenarios: [],
  },
];
