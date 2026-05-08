import type { KPIData } from './kpiTypes';
import { KPI_OBSERVABILITY_CATEGORY_ORDER } from './data/phase1ObservabilityMetrics';

/** Stable numeric seed for sparkline variance (Phase 1 ids are often slug strings without digits). */
function sparklineSeedFromKpiId(id: string): number {
  const digits = parseInt(id.replace(/\D/g, ''), 10);
  if (!Number.isNaN(digits) && digits !== 0) {
    return digits % 100000;
  }
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % 100000;
}

function getSparklineType(chartType: KPIData['chartType']): 'line' | 'area' | 'bar' {
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

/** Same generators as the Observability dashboard (`ClusKpiDashboardRoot`) for matching KPI sparklines. */

function generateSparkline(
  changePercent: string,
  _isPositive: boolean,
  dateRange: string,
  seed: number = 0,
  targetValueStr?: string,
): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;

  let targetMean = 50;
  if (targetValueStr) {
    const match = targetValueStr.match(/-?[\d,]+(\.\d+)?/);
    if (match) {
      targetMean = parseFloat(match[0].replace(/,/g, ''));
    }
  }

  let points: number;
  switch (dateRange) {
    case '24h':
      points = 24;
      break;
    case 'week':
      points = 7;
      break;
    case 'month':
      points = 30;
      break;
    case '90d':
      points = 90;
      break;
    default:
      points = 12;
  }

  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const varianceScale = targetMean === 0 ? 5 : Math.abs(targetMean) * 0.15;

  const rawData: number[] = [];
  let currentVal = 0;
  rawData.push(currentVal);

  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    const trendStep = (trendDirection * (Math.abs(change) / 100) * varianceScale) / points;
    const randomStep = (seededRandom(i) - 0.5) * varianceScale;

    currentVal += trendStep + randomStep;
    rawData.push(currentVal);
  }

  const currentAvg = rawData.reduce((a, b) => a + b, 0) / rawData.length;
  const shift = targetMean - currentAvg;
  const isPercentage = targetValueStr ? targetValueStr.includes('%') : false;

  return rawData.map((v) => {
    let final = v + shift;
    if (targetMean >= 0) final = Math.max(0, final);
    if (isPercentage) final = Math.min(100, final);
    return final;
  });
}

function generateRatingSparkline(
  changePercent: string,
  _isPositive: boolean,
  dateRange: string,
  seed: number = 0,
  targetValueStr?: string,
): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;

  let targetMean = 4.2;
  if (targetValueStr) {
    const match = targetValueStr.match(/-?[\d,]+(\.\d+)?/);
    if (match) targetMean = parseFloat(match[0]);
  }

  let points: number;
  switch (dateRange) {
    case '24h':
      points = 24;
      break;
    case 'week':
      points = 7;
      break;
    case 'month':
      points = 30;
      break;
    case '90d':
      points = 90;
      break;
    default:
      points = 12;
  }

  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const varianceScale = 0.5;

  const rawData: number[] = [];
  let currentVal = 0;
  rawData.push(currentVal);

  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    const trendStep = (trendDirection * (Math.abs(change) / 100) * 0.5) / points;
    const randomStep = (seededRandom(i) - 0.5) * varianceScale;

    currentVal += trendStep + randomStep;
    rawData.push(currentVal);
  }

  const currentAvg = rawData.reduce((a, b) => a + b, 0) / rawData.length;
  const shift = targetMean - currentAvg;

  return rawData.map((v) => {
    const final = v + shift;
    return Math.max(0, Math.min(5, final));
  });
}

function generateContainmentSparkline(
  changePercent: string,
  _isPositive: boolean,
  dateRange: string,
  seed: number = 0,
  targetValueStr?: string,
): number[] {
  const change = parseFloat(changePercent.replace('%', ''));
  const isIncreasing = change > 0;

  let targetMean = 76;
  if (targetValueStr) {
    const match = targetValueStr.match(/-?[\d,]+(\.\d+)?/);
    if (match) targetMean = parseFloat(match[0]);
  }

  let points: number;
  switch (dateRange) {
    case '24h':
      points = 24;
      break;
    case 'week':
      points = 7;
      break;
    case 'month':
      points = 30;
      break;
    case '90d':
      points = 90;
      break;
    default:
      points = 12;
  }

  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const varianceScale = 8;

  const rawData: number[] = [];
  let currentVal = 0;
  rawData.push(currentVal);

  for (let i = 1; i < points; i++) {
    const trendDirection = isIncreasing ? 1 : -1;
    const trendStep = (trendDirection * (Math.abs(change) / 100) * varianceScale) / points;
    const randomStep = (seededRandom(i) - 0.5) * varianceScale;

    currentVal += trendStep + randomStep;
    rawData.push(currentVal);
  }

  const currentAvg = rawData.reduce((a, b) => a + b, 0) / rawData.length;
  const shift = targetMean - currentAvg;

  return rawData.map((v) => {
    const final = v + shift;
    return Math.max(0, Math.min(100, final));
  });
}

/** Observability dashboard section order — Phase 1 IA (see `observability-metrics-phase1.csv`). */
export const KPI_OBSERVABILITY_CATEGORIES = [...KPI_OBSERVABILITY_CATEGORY_ORDER];

/**
 * Recomputes sparklines for the shared KPI catalog using the same rules as the Observability dashboard.
 */
export function buildKpiDataWithDashboardSparklines(
  catalog: readonly KPIData[],
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): KPIData[] {
  return catalog.map((kpi) => {
    const seed = sparklineSeedFromKpiId(kpi.id);
    let sparklineData: number[];

    const kind = kpi.sparklineKind ?? 'default';
    if (kind === 'containment') {
      sparklineData = generateContainmentSparkline(kpi.change, kpi.isPositive, dateRange, seed, kpi.value);
    } else if (kind === 'rating-5') {
      sparklineData = generateRatingSparkline(kpi.change, kpi.isPositive, dateRange, seed, kpi.value);
    } else {
      sparklineData = generateSparkline(kpi.change, kpi.isPositive, dateRange, seed, kpi.value);
    }

    return {
      ...kpi,
      sparklineData,
      sparklineType: getSparklineType(kpi.chartType),
    };
  });
}
