import { buildKpiDataWithDashboardSparklines } from '../dashboardKpiSparklines';
import {
  phase1ObservabilityMetricSeeds,
  toSentenceCaseMetricHeading,
} from '../data/phase1ObservabilityMetrics';
import type { KPIData } from '../kpiTypes';

export type { KPIData, SparklineKind } from '../kpiTypes';

/** Phase 1 Observability catalog (sparklines added via `buildKpiDataWithDashboardSparklines`). */
export const kpiData: KPIData[] = phase1ObservabilityMetricSeeds.map((s) => ({
  id: s.id,
  category: s.category,
  heading: toSentenceCaseMetricHeading(s.heading),
  description: s.description,
  value: s.value,
  unit: s.unit,
  change: s.change,
  isPositive: s.isPositive,
  chartType: s.chartType,
  curveType: s.curveType,
  sparklineKind: s.sparklineKind,
}));

export function getSparklineType(chartType: KPIData['chartType']): 'line' | 'area' | 'bar' {
  switch (chartType) {
    case 'area':
    case 'stacked-area':
      return 'area';
    case 'bar':
    case 'stacked-bar':
    case 'histogram':
    case 'grouped-bar':
    case 'column':
      return 'bar';
    case 'line':
    case 'line-threshold':
    case 'pie':
    case 'donut':
    default:
      return 'line';
  }
}

/** Regenerates sparklines for the shared `kpiData` catalog (same rules as Observability dashboard). */
export function kpiDataWithSparklinesForRange(dateRange: '24h' | 'week' | 'month' | '90d'): KPIData[] {
  return buildKpiDataWithDashboardSparklines(kpiData, dateRange);
}
