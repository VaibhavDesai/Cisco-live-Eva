import type { KPIData } from '../../clus-kpi-dashboard/components/kpiData';

/** X-axis labels shared by historical testing trend charts (evaluation runs). */
export const TESTING_RUN_LABELS = [
  'test-001',
  'test-002',
  'test-003',
  'test-004',
  'test-005',
  'test-006',
  'test-007',
  'test-008',
  'test-009',
  'test-010',
] as const;

export type TestingChartSummary = {
  average: string;
  highest: string;
  lowest: string;
  /** Includes arrow e.g. ↘ 4.0% */
  trendDisplay: string;
  /** When true, trend uses success-style (green); when false, warning/error (red). */
  trendIsPositive: boolean;
};

export type TestingHistoricalKPI = KPIData & {
  testLabels: readonly string[];
  /** Series aligned 1:1 with `testLabels` (chart data). */
  trendSeries: number[];
  chartSummary: TestingChartSummary;
};

/** Overall test success rate — values from testing trend reference data. */
const SUCCESS_RATE_SERIES = [87.3, 86, 83, 86, 84, 92.8, 90, 89, 76.6, 83];

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

function summarizePercentSeries(values: number[], higherIsBetter: boolean): TestingChartSummary {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const start = values[0];
  const end = values[values.length - 1];
  const delta = start - end;
  const mag = Math.abs(delta);
  const trendIsPositive = higherIsBetter ? end >= start : end <= start;
  const arrow = delta > 0 ? '↘' : delta < 0 ? '↗' : '→';
  return {
    average: `${round1(avg)}%`,
    highest: `${round1(hi)}%`,
    lowest: `${round1(lo)}%`,
    trendDisplay: `${arrow} ${round1(mag)}%`,
    trendIsPositive,
  };
}

/** Total test runs per test run (synthetic, same axis as success-rate reference). */
const TOTAL_RUNS_SERIES = [2780, 2795, 2810, 2820, 2835, 2847, 2855, 2860, 2868, 2872];

function summarizeCountSeries(values: number[], higherIsBetter: boolean): TestingChartSummary {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const start = values[0];
  const end = values[values.length - 1];
  const delta = end - start;
  const mag = Math.abs(delta);
  const trendIsPositive = higherIsBetter ? delta >= 0 : delta <= 0;
  const arrow = delta > 0 ? '↗' : delta < 0 ? '↘' : '→';
  return {
    average: `${Math.round(avg).toLocaleString()}`,
    highest: `${Math.round(hi).toLocaleString()}`,
    lowest: `${Math.round(lo).toLocaleString()}`,
    trendDisplay: `${arrow} ${mag.toLocaleString()}`,
    trendIsPositive,
  };
}

/** Average test duration in seconds per test run. */
const AVG_DURATION_SEC_SERIES = [212, 208, 218, 205, 204, 198, 200, 202, 215, 204];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function summarizeDurationSeries(values: number[], lowerIsBetter: boolean): TestingChartSummary {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const hi = Math.max(...values);
  const lo = Math.min(...values);
  const start = values[0];
  const end = values[values.length - 1];
  const deltaSec = end - start;
  const mag = Math.abs(deltaSec);
  const trendIsPositive = lowerIsBetter ? deltaSec <= 0 : deltaSec >= 0;
  const arrow = deltaSec > 0 ? '↗' : deltaSec < 0 ? '↘' : '→';
  return {
    average: formatDuration(avg),
    highest: formatDuration(hi),
    lowest: formatDuration(lo),
    trendDisplay: `${arrow} ${mag}s`,
    trendIsPositive,
  };
}

/** Total duration in seconds per test run window. */
const TOTAL_DURATION_SEC_SERIES = [2800, 2820, 2910, 2750, 2780, 2650, 2700, 2680, 2920, 2836];

/** Historical testing metrics — trend series aligned to `TESTING_RUN_LABELS`. */
export const TESTING_HISTORICAL_KPIS: TestingHistoricalKPI[] = [
  {
    id: 'testing-success-rate',
    category: 'Testing',
    heading: 'Overall test success rate',
    description: 'Trend across recent test runs',
    value: '87.4',
    unit: '%',
    change: '+2.1%',
    isPositive: true,
    chartType: 'line',
    sparklineData: [...SUCCESS_RATE_SERIES],
    sparklineType: 'line',
    testLabels: TESTING_RUN_LABELS,
    trendSeries: SUCCESS_RATE_SERIES,
    chartSummary: summarizePercentSeries(SUCCESS_RATE_SERIES, true),
  },
  {
    id: 'testing-total-runs',
    category: 'Testing',
    heading: 'Total test runs',
    description: 'Cumulative runs recorded per test run',
    value: '2,847',
    unit: '',
    change: '+12.3%',
    isPositive: true,
    chartType: 'line',
    sparklineData: [...TOTAL_RUNS_SERIES],
    sparklineType: 'line',
    testLabels: TESTING_RUN_LABELS,
    trendSeries: TOTAL_RUNS_SERIES,
    chartSummary: summarizeCountSeries(TOTAL_RUNS_SERIES, true),
  },
  {
    id: 'testing-avg-duration',
    category: 'Testing',
    heading: 'Average test duration',
    description: 'Mean duration per test run',
    value: '3m 24s',
    unit: '',
    change: '-15s',
    isPositive: true,
    chartType: 'line',
    sparklineData: [...AVG_DURATION_SEC_SERIES],
    sparklineType: 'line',
    testLabels: TESTING_RUN_LABELS,
    trendSeries: AVG_DURATION_SEC_SERIES,
    chartSummary: summarizeDurationSeries(AVG_DURATION_SEC_SERIES, true),
  },
  {
    id: 'testing-total-duration',
    category: 'Testing',
    heading: 'Total test duration',
    description: 'Aggregated duration per test run',
    value: '47m 16s',
    unit: '',
    change: '+8.2%',
    isPositive: true,
    chartType: 'line',
    sparklineData: [...TOTAL_DURATION_SEC_SERIES],
    sparklineType: 'line',
    testLabels: TESTING_RUN_LABELS,
    trendSeries: TOTAL_DURATION_SEC_SERIES,
    chartSummary: summarizeDurationSeries(TOTAL_DURATION_SEC_SERIES, false),
  },
];

/** Recent run metrics — same chart payload shape as historical cards (expanded trend matches top section). */
const RECENT_AGENT_HEALTH_SERIES = [86.2, 87.1, 86.5, 88.0, 89.2, 88.7, 90.1, 90.5, 91.2, 92.1] as const;

/** Mirrors action / intent success style trends from observability (completed paths in test runs). */
const RECENT_TASK_INTENT_SUCCESS_SERIES = [94.0, 94.5, 95.0, 95.2, 95.8, 96.0, 96.1, 96.4, 96.5, 96.8] as const;

export const TESTING_RECENT_RUN_KPIS: TestingHistoricalKPI[] = [
  {
    id: 'recent-agent-health',
    category: 'Testing',
    heading: 'Agent health score',
    description: 'Performance indicators from the most recent test run.',
    value: '92.1',
    unit: '%',
    change: '+3.4%',
    isPositive: true,
    chartType: 'line',
    sparklineData: [...RECENT_AGENT_HEALTH_SERIES],
    sparklineType: 'line',
    testLabels: TESTING_RUN_LABELS,
    trendSeries: [...RECENT_AGENT_HEALTH_SERIES],
    chartSummary: summarizePercentSeries([...RECENT_AGENT_HEALTH_SERIES], true),
  },
  {
    id: 'recent-agent-task-intent-success',
    category: 'Testing',
    heading: 'Task / intent success (test runs)',
    description:
      'Share of scripted intents and actions that completed successfully — same idea as action / intent success on the observability dashboard.',
    value: '96.8',
    unit: '%',
    change: '+1.2%',
    isPositive: true,
    chartType: 'line',
    sparklineData: [...RECENT_TASK_INTENT_SUCCESS_SERIES],
    sparklineType: 'line',
    testLabels: TESTING_RUN_LABELS,
    trendSeries: [...RECENT_TASK_INTENT_SUCCESS_SERIES],
    chartSummary: summarizePercentSeries([...RECENT_TASK_INTENT_SUCCESS_SERIES], true),
  },
];
