import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import {
  allocEvalIds,
  defaultAggregatedMetricsFromRate,
  maxEvalSequenceNumber,
  sampleEvaluationResults,
  type EvaluationResultRow,
  type EvaluationScenarioRow,
  type ScenarioVariableRow,
  type TestScenarioRow,
} from './simulated-testing-data';
import {
  buildEvaluationDetailPayload,
  buildScenarioFullDetailPayload,
  resolveEvaluationResultRow,
} from './evaluation-detail-payload';
import { EvaluationDetailModal, type EvaluationDetailModalPayload } from './components/EvaluationDetailModal';
import { ScenarioDetailModal, type ScenarioDetailModalPayload } from './components/ScenarioDetailModal';

/** Placeholder duration / rate while a manual run is in progress (shown ~15s). */
export const RUN_IN_PROGRESS_PLACEHOLDER = '-';

const RUN_COMPLETE_MS = 15_000;

function parseScenarioSuccessRatePct(s: string): number | null {
  if (!s || s === 'N/A') return null;
  const n = Number.parseInt(s.replace(/%/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

function finalizeScenarioRunRow(
  evalId: string,
  ts: TestScenarioRow,
  dateLabel: string,
  dateSortKey: string,
): EvaluationResultRow {
  const sec = 30 + Math.floor(Math.random() * 180);
  const mm = Math.floor(sec / 60);
  const rs = sec % 60;
  const duration = mm > 0 ? `${mm}m ${rs}s` : `${rs}s`;
  const basePct = parseScenarioSuccessRatePct(ts.successRate);
  const pct =
    basePct !== null
      ? Math.min(100, Math.max(0, basePct + Math.floor(Math.random() * 11) - 5))
      : 70 + Math.floor(Math.random() * 25);
  const passed = pct >= 72;
  const successRate = `${pct}%`;
  const status: 'Success' | 'Failed' = passed ? 'Success' : 'Failed';
  const child: EvaluationScenarioRow = {
    id: `${evalId}-s1`,
    name: ts.name,
    testType: ts.type,
    date: dateLabel,
    scenarioCount: 1,
    duration,
    successRate,
    status,
  };

  return {
    id: evalId,
    name: ts.name,
    testType: ts.type ?? 'Functional',
    dateLabel,
    dateSortKey,
    scenarioCount: 1,
    duration,
    successRate,
    status,
    scenarios: [child],
    aggregatedMetrics: defaultAggregatedMetricsFromRate(successRate),
  };
}

export type SimulatedTestingResultsContextValue = {
  dynamicEvaluationRows: EvaluationResultRow[];
  startEvaluationRun: (scenarios: TestScenarioRow[]) => void;
  /** Open evaluation detail by ID (Overview charts / failure table / shared links). */
  openEvaluationById: (evaluationId: string) => void;
  /** Open evaluation detail from a results row (honours Running). */
  openEvaluationFromRow: (row: EvaluationResultRow) => void;
  /** Scenario detail with Back → evaluation modal. */
  openScenarioFromEvaluationFlow: (cardIndex: number) => void;
  /** Scenario detail from expanded row — no Back. */
  openScenarioStandalone: (scenario: EvaluationScenarioRow) => void;
  /**
   * Test scenarios / variables workspace — lives in context so data survives switching
   * away from Testing (e.g. Configuration) on the agent shell.
   */
  userScenarios: TestScenarioRow[];
  setUserScenarios: Dispatch<SetStateAction<TestScenarioRow[]>>;
  sampleScenarioOverrides: Map<string, TestScenarioRow>;
  setSampleScenarioOverrides: Dispatch<SetStateAction<Map<string, TestScenarioRow>>>;
  removedSampleScenarioIds: Set<string>;
  setRemovedSampleScenarioIds: Dispatch<SetStateAction<Set<string>>>;
  userScenarioVariables: ScenarioVariableRow[];
  setUserScenarioVariables: Dispatch<SetStateAction<ScenarioVariableRow[]>>;
  sampleVariableOverrides: Map<string, ScenarioVariableRow>;
  setSampleVariableOverrides: Dispatch<SetStateAction<Map<string, ScenarioVariableRow>>>;
  removedSampleVariableIds: Set<string>;
  setRemovedSampleVariableIds: Dispatch<SetStateAction<Set<string>>>;
  runningScenarioIds: Set<string>;
  setRunningScenarioIds: Dispatch<SetStateAction<Set<string>>>;
};

const SimulatedTestingResultsContext = createContext<SimulatedTestingResultsContextValue | null>(null);

export function SimulatedTestingResultsProvider({ children }: { children: ReactNode }) {
  const [dynamicEvaluationRows, setDynamicEvaluationRows] = useState<EvaluationResultRow[]>([]);
  const [userScenarios, setUserScenarios] = useState<TestScenarioRow[]>([]);
  const [sampleScenarioOverrides, setSampleScenarioOverrides] = useState<Map<string, TestScenarioRow>>(
    () => new Map(),
  );
  const [removedSampleScenarioIds, setRemovedSampleScenarioIds] = useState<Set<string>>(() => new Set());
  const [userScenarioVariables, setUserScenarioVariables] = useState<ScenarioVariableRow[]>([]);
  const [sampleVariableOverrides, setSampleVariableOverrides] = useState<Map<string, ScenarioVariableRow>>(
    () => new Map(),
  );
  const [removedSampleVariableIds, setRemovedSampleVariableIds] = useState<Set<string>>(() => new Set());
  const [runningScenarioIds, setRunningScenarioIds] = useState<Set<string>>(() => new Set());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [evaluationDetailOpen, setEvaluationDetailOpen] = useState(false);
  const [evaluationDetailPayload, setEvaluationDetailPayload] = useState<EvaluationDetailModalPayload | null>(null);
  const [evaluationDetailRow, setEvaluationDetailRow] = useState<EvaluationResultRow | null>(null);

  const [scenarioDetailOpen, setScenarioDetailOpen] = useState(false);
  const [scenarioDetailPayload, setScenarioDetailPayload] = useState<ScenarioDetailModalPayload | null>(null);
  const [scenarioOpenedFromEvaluation, setScenarioOpenedFromEvaluation] = useState(false);

  useEffect(() => {
    return () => {
      for (const t of timeoutsRef.current) {
        clearTimeout(t);
      }
    };
  }, []);

  const startEvaluationRun = useCallback((scenarios: TestScenarioRow[]) => {
    if (scenarios.length === 0) return;

    const now = new Date();
    const dateSortKey = now.toISOString();
    const dateLabel = now.toLocaleDateString(undefined, {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });

    setDynamicEvaluationRows((prev) => {
      const sampleIds = sampleEvaluationResults.map((r) => r.id);
      const prevIds = prev.map((r) => r.id);
      const maxSoFar = Math.max(maxEvalSequenceNumber(sampleIds), maxEvalSequenceNumber(prevIds));
      const evalIds = allocEvalIds(maxSoFar, scenarios.length);

      const placeholders: EvaluationResultRow[] = scenarios.map((ts, i) => ({
        id: evalIds[i],
        name: ts.name,
        testType: ts.type ?? 'Functional',
        dateLabel,
        dateSortKey,
        scenarioCount: 1,
        duration: RUN_IN_PROGRESS_PLACEHOLDER,
        successRate: RUN_IN_PROGRESS_PLACEHOLDER,
        status: 'Running',
        scenarios: [],
      }));

      const t = window.setTimeout(() => {
        setDynamicEvaluationRows((rows) =>
          rows.map((row) => {
            const idx = evalIds.indexOf(row.id);
            if (idx === -1) return row;
            return finalizeScenarioRunRow(row.id, scenarios[idx], dateLabel, dateSortKey);
          }),
        );
      }, RUN_COMPLETE_MS);
      timeoutsRef.current.push(t);

      return [...placeholders, ...prev];
    });
  }, []);

  const closeEvaluationDetail = useCallback(() => {
    setEvaluationDetailOpen(false);
    setEvaluationDetailPayload(null);
    setEvaluationDetailRow(null);
  }, []);

  const openEvaluationById = useCallback(
    (evaluationId: string) => {
      const evalRow = resolveEvaluationResultRow(evaluationId, dynamicEvaluationRows);
      if (!evalRow || evalRow.status === 'Running') return;
      setEvaluationDetailRow(evalRow);
      setEvaluationDetailPayload(buildEvaluationDetailPayload(evalRow));
      setEvaluationDetailOpen(true);
    },
    [dynamicEvaluationRows],
  );

  const openEvaluationFromRow = useCallback((row: EvaluationResultRow) => {
    if (row.status === 'Running') return;
    setEvaluationDetailRow(row);
    setEvaluationDetailPayload(buildEvaluationDetailPayload(row));
    setEvaluationDetailOpen(true);
  }, []);

  const openScenarioFromEvaluationFlow = useCallback(
    (cardIndex: number) => {
      if (!evaluationDetailRow) return;
      const scenarioFromRow = evaluationDetailRow.scenarios[cardIndex - 1];
      const fallbackScenario: EvaluationScenarioRow = {
        id: evaluationDetailRow.id,
        name: evaluationDetailRow.name,
        testType: evaluationDetailRow.testType,
        date: evaluationDetailRow.dateLabel,
        scenarioCount: 1,
        duration: evaluationDetailRow.duration,
        successRate: evaluationDetailRow.successRate,
        status: evaluationDetailRow.status === 'Failed' ? 'Failed' : 'Success',
        detailMetrics: evaluationDetailRow.aggregatedMetrics,
      };
      const scenario = scenarioFromRow ?? fallbackScenario;
      setScenarioDetailPayload(buildScenarioFullDetailPayload(scenario));
      setScenarioOpenedFromEvaluation(true);
      setEvaluationDetailOpen(false);
      setScenarioDetailOpen(true);
    },
    [evaluationDetailRow],
  );

  const openScenarioStandalone = useCallback((scenario: EvaluationScenarioRow) => {
    setScenarioDetailPayload(buildScenarioFullDetailPayload(scenario));
    setScenarioOpenedFromEvaluation(false);
    setScenarioDetailOpen(true);
  }, []);

  const closeScenarioDetail = useCallback(() => {
    setScenarioDetailOpen(false);
    setScenarioDetailPayload(null);
    setScenarioOpenedFromEvaluation(false);
    setEvaluationDetailOpen(false);
    setEvaluationDetailPayload(null);
    setEvaluationDetailRow(null);
  }, []);

  const backFromScenarioDetail = useCallback(() => {
    setScenarioDetailOpen(false);
    setScenarioDetailPayload(null);
    setScenarioOpenedFromEvaluation(false);
    if (evaluationDetailRow) {
      setEvaluationDetailOpen(true);
    }
  }, [evaluationDetailRow]);

  const value = useMemo(
    () => ({
      dynamicEvaluationRows,
      startEvaluationRun,
      openEvaluationById,
      openEvaluationFromRow,
      openScenarioFromEvaluationFlow,
      openScenarioStandalone,
      userScenarios,
      setUserScenarios,
      sampleScenarioOverrides,
      setSampleScenarioOverrides,
      removedSampleScenarioIds,
      setRemovedSampleScenarioIds,
      userScenarioVariables,
      setUserScenarioVariables,
      sampleVariableOverrides,
      setSampleVariableOverrides,
      removedSampleVariableIds,
      setRemovedSampleVariableIds,
      runningScenarioIds,
      setRunningScenarioIds,
    }),
    [
      dynamicEvaluationRows,
      startEvaluationRun,
      openEvaluationById,
      openEvaluationFromRow,
      openScenarioFromEvaluationFlow,
      openScenarioStandalone,
      userScenarios,
      sampleScenarioOverrides,
      removedSampleScenarioIds,
      userScenarioVariables,
      sampleVariableOverrides,
      removedSampleVariableIds,
      runningScenarioIds,
    ],
  );

  return (
    <SimulatedTestingResultsContext.Provider value={value}>
      {children}
      <EvaluationDetailModal
        open={evaluationDetailOpen}
        onClose={closeEvaluationDetail}
        data={evaluationDetailPayload}
        onScenarioOpen={openScenarioFromEvaluationFlow}
      />
      <ScenarioDetailModal
        open={scenarioDetailOpen}
        onClose={closeScenarioDetail}
        onBack={scenarioOpenedFromEvaluation ? backFromScenarioDetail : undefined}
        data={scenarioDetailPayload}
      />
    </SimulatedTestingResultsContext.Provider>
  );
}

export function useSimulatedTestingResultsOptional(): SimulatedTestingResultsContextValue | null {
  return useContext(SimulatedTestingResultsContext);
}

/** Use under {@link SimulatedTestingResultsProvider} (Overview + Results tabs). */
export function useSimulatedTestingResults(): SimulatedTestingResultsContextValue {
  const ctx = useContext(SimulatedTestingResultsContext);
  if (!ctx) {
    throw new Error('useSimulatedTestingResults must be used within SimulatedTestingResultsProvider');
  }
  return ctx;
}
