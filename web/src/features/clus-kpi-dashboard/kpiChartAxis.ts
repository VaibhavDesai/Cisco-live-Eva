import type { KPIData } from './kpiTypes';

/** Expanded KPI chart uses a fixed 0–5 axis for 1–5 / 0–5 score metrics. */
export function kpiExpandedChartAxisProps(kpi: KPIData): {
  yDomain?: [number, number];
  ticks?: number[];
} {
  if (kpi.sparklineKind === 'rating-5') {
    return { yDomain: [0, 5], ticks: [0, 1, 2, 3, 4, 5] };
  }
  return {};
}
