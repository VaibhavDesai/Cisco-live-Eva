export type KpiChartType =
  | 'line'
  | 'line-threshold'
  | 'area'
  | 'bar'
  | 'stacked-bar'
  | 'histogram'
  | 'pie'
  | 'donut'
  | 'grouped-bar'
  | 'column'
  | 'stacked-area';

export type SparklineKind = 'rating-5' | 'containment' | 'latency-ms' | 'percent-100' | 'default';

export type KpiThresholdStatus = 'good' | 'bad' | 'neutral';

export interface KPIData {
  id: string;
  category: string;
  heading: string;
  description: string;
  value: string;
  unit: string;
  change: string;
  isPositive: boolean;
  /** Informational runtime counts should not be forced into success/error trend colours. */
  changeTone?: 'positive' | 'negative' | 'neutral';
  chartType: KpiChartType;
  sparklineData?: number[];
  sparklineType?: 'line' | 'area' | 'bar';
  /** Keeps exact previous/current comparisons on one shared percentage-change scale. */
  sparklineScale?: 'local' | 'relative-change';
  curveType?: 'monotone' | 'linear' | 'step';
  /** Drives expanded chart axis + sparkline generator in `dashboardKpiSparklines.ts`. */
  sparklineKind?: SparklineKind;
  /** Compared to Configuration thresholds when present (Observability dashboard). */
  thresholdStatus?: KpiThresholdStatus;
}
