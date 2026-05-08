import {
  defaultAggregatedMetricsFromRate,
  defaultScenarioFailureReasons,
  defaultScenarioMetricsFromRate,
  defaultScenarioSuccessReasons,
  defaultScenarioTranscript,
  sampleEvaluationResults,
  type EvaluationResultRow,
  type EvaluationScenarioRow,
} from './simulated-testing-data';
import type { EvaluationDetailModalPayload, EvaluationDetailScenarioCard } from './components/EvaluationDetailModal';
import type { ScenarioDetailModalPayload } from './components/ScenarioDetailModal';

export function findEvaluationResultById(id: string): EvaluationResultRow | undefined {
  return sampleEvaluationResults.find((r) => r.id === id);
}

/** Prefer dynamic rows (e.g. runs from Scenarios tab) then sample data. */
export function resolveEvaluationResultRow(
  evaluationId: string,
  dynamicRows: EvaluationResultRow[],
): EvaluationResultRow | undefined {
  const fromDynamic = dynamicRows.find((r) => r.id === evaluationId);
  if (fromDynamic) return fromDynamic;
  return sampleEvaluationResults.find((r) => r.id === evaluationId);
}

export function buildEvaluationDetailPayload(row: EvaluationResultRow): EvaluationDetailModalPayload {
  const aggregated =
    row.aggregatedMetrics && row.aggregatedMetrics.length > 0
      ? row.aggregatedMetrics
      : defaultAggregatedMetricsFromRate(row.successRate);

  let scenarioCards: EvaluationDetailScenarioCard[];
  if (row.scenarios.length > 0) {
    scenarioCards = row.scenarios.map((s, i) => ({
      index: i + 1,
      name: s.name,
      status: s.status,
      metrics:
        s.detailMetrics && s.detailMetrics.length > 0
          ? s.detailMetrics
          : defaultScenarioMetricsFromRate(s.successRate),
    }));
  } else {
    scenarioCards = [
      {
        index: 1,
        name: row.name,
        status: row.status,
        metrics: aggregated,
      },
    ];
  }

  return {
    title: row.name,
    subtitle: `Aggregated metrics across all ${row.scenarioCount} scenario${row.scenarioCount === 1 ? '' : 's'} in this evaluation`,
    totalScenarios: row.scenarioCount,
    totalDuration: row.duration,
    status: row.status,
    aggregatedMetrics: aggregated,
    scenarioCards,
  };
}

export function buildScenarioDetailPayload(
  parent: EvaluationResultRow,
  scenario: EvaluationScenarioRow,
): EvaluationDetailModalPayload {
  const metrics =
    scenario.detailMetrics && scenario.detailMetrics.length > 0
      ? scenario.detailMetrics
      : defaultScenarioMetricsFromRate(scenario.successRate);

  return {
    title: scenario.name,
    subtitle: `From evaluation: ${parent.name}`,
    totalScenarios: 1,
    totalDuration: scenario.duration,
    status: scenario.status,
    aggregatedMetrics: metrics,
    scenarioCards: [
      {
        index: 1,
        name: scenario.name,
        status: scenario.status,
        metrics,
      },
    ],
  };
}

/**
 * Build the payload for the new “Scenario detail” modal — the deep view that includes
 * success/failure reasons, performance metrics, and a conversation transcript.
 */
export function buildScenarioFullDetailPayload(scenario: EvaluationScenarioRow): ScenarioDetailModalPayload {
  const metrics =
    scenario.detailMetrics && scenario.detailMetrics.length > 0
      ? scenario.detailMetrics
      : defaultScenarioMetricsFromRate(scenario.successRate);

  const reasonsFromData =
    scenario.status === 'Success' ? scenario.successReasons : scenario.failureReasons;

  const reasons =
    reasonsFromData && reasonsFromData.length > 0
      ? reasonsFromData
      : scenario.status === 'Success'
        ? defaultScenarioSuccessReasons
        : defaultScenarioFailureReasons;

  const transcript =
    scenario.transcript && scenario.transcript.length > 0 ? scenario.transcript : defaultScenarioTranscript;

  return {
    title: scenario.name,
    duration: scenario.duration,
    status: scenario.status,
    reasons,
    metrics,
    transcript,
  };
}
