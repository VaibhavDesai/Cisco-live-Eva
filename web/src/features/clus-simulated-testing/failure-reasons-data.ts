/** Prototype data for simulated testing — Top failure reasons (UI only). */

export interface FailureSubReason {
  id: string;
  label: string;
  /** Display e.g. "12 times" */
  occurrencesLabel: string;
  /** Evaluation ID shown in the expanded row (matches results sample data where present). */
  evaluationId: string;
}

export interface TopFailureReason {
  id: string;
  reason: string;
  occurrencesLabel: string;
  area: string;
  evaluationIds: string[];
  /** 0–100 for display */
  frequencyPct: number;
  subReasons: FailureSubReason[];
}

export const topFailureReasons: TopFailureReason[] = [
  {
    id: 'goal-timeout',
    reason: 'Goal completion timeout',
    occurrencesLabel: '38 times',
    area: 'Functional',
    evaluationIds: ['test-005', 'test-009'],
    frequencyPct: 27,
    subReasons: [
      {
        id: 'gt-1',
        label: 'Scenario exceeded wall clock',
        occurrencesLabel: '22 times',
        evaluationId: 'test-005',
      },
      {
        id: 'gt-2',
        label: 'Orchestration step timed out',
        occurrencesLabel: '16 times',
        evaluationId: 'test-009',
      },
    ],
  },
  {
    id: 'context-loss',
    reason: 'Context loss in long conversations',
    occurrencesLabel: '28 times',
    area: 'Functional',
    evaluationIds: ['test-006'],
    frequencyPct: 20,
    subReasons: [
      {
        id: 'cl-1',
        label: 'Long thread truncation',
        occurrencesLabel: '18 times',
        evaluationId: 'test-006',
      },
      {
        id: 'cl-2',
        label: 'Missing turn context',
        occurrencesLabel: '10 times',
        evaluationId: 'test-006',
      },
    ],
  },
  {
    id: 'variable-sub',
    reason: 'Variable substitution error',
    occurrencesLabel: '19 times',
    area: 'Functional',
    evaluationIds: ['test-007', 'test-009', 'test-009'],
    frequencyPct: 13,
    subReasons: [
      {
        id: 'vs-1',
        label: 'Undefined variable reference',
        occurrencesLabel: '12 times',
        evaluationId: 'test-007',
      },
      {
        id: 'vs-2',
        label: 'Type coercion failed',
        occurrencesLabel: '7 times',
        evaluationId: 'test-009',
      },
    ],
  },
  {
    id: 'response-time',
    reason: 'Response time threshold exceeded',
    occurrencesLabel: '11 times',
    area: 'Functional',
    evaluationIds: ['test-008'],
    frequencyPct: 8,
    subReasons: [
      {
        id: 'rt-1',
        label: 'P95 latency spike',
        occurrencesLabel: '6 times',
        evaluationId: 'test-008',
      },
      {
        id: 'rt-2',
        label: 'Cold start overhead',
        occurrencesLabel: '5 times',
        evaluationId: 'test-008',
      },
    ],
  },
  {
    id: 'crm-handoff-sync',
    reason: 'CRM handoff field sync mismatch',
    occurrencesLabel: '21 times',
    area: 'Functional',
    evaluationIds: ['test-004', 'test-007'],
    frequencyPct: 14,
    subReasons: [
      {
        id: 'crm-1',
        label: 'Disposition code missing on transfer',
        occurrencesLabel: '12 times',
        evaluationId: 'test-004',
      },
      {
        id: 'crm-2',
        label: 'Ticket ID stale after webhook retry',
        occurrencesLabel: '9 times',
        evaluationId: 'test-007',
      },
    ],
  },
];
