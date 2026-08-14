import type { KPIData } from './kpiTypes';

/** Expanded KPI chart uses a fixed 0–5 axis for 1–5 / 0–5 score metrics. */
export function kpiExpandedChartAxisProps(kpi: KPIData): {
  yDomain?: [number, number];
  ticks?: number[];
} {
  if (kpi.sparklineKind === 'rating-5') {
    return { yDomain: [0, 5], ticks: [0, 1, 2, 3, 4, 5] };
  }

  const trend = kpi.sparklineData?.filter(Number.isFinite);
  if (kpi.sparklineScale === 'relative-change' && trend && trend.length >= 2) {
    const dataMin = Math.min(...trend);
    const dataMax = Math.max(...trend);
    const midpoint = (dataMin + dataMax) / 2;
    const metricScale = Math.max(Math.abs(midpoint), 0.1);
    const dataSpan = Math.max(dataMax - dataMin, metricScale * 0.01);

    // Keep a visible but honest frame around the observed range. The minimum
    // window avoids an exaggerated micro-axis while still making a 24h trend
    // legible instead of flattening every percentage metric onto 0–100.
    const minimumWindow = Math.max(metricScale * 0.12, 0.1);
    const domainSpan = Math.max(dataSpan * 1.5, minimumWindow);
    let domainMin = midpoint - domainSpan / 2;
    let domainMax = midpoint + domainSpan / 2;

    if (kpi.unit === '%' || kpi.value.includes('%')) {
      if (domainMin < 0) {
        domainMax -= domainMin;
        domainMin = 0;
      }
      if (domainMax > 100) {
        domainMin = Math.max(0, domainMin - (domainMax - 100));
        domainMax = 100;
      }
    }

    return {
      yDomain: [
        Number(domainMin.toFixed(2)),
        Number(domainMax.toFixed(2)),
      ],
    };
  }
  return {};
}
