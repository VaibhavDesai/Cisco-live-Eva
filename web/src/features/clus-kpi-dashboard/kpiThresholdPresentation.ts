/**
 * Threshold bands vs observability configuration — demo value shaping (~60% good / ~10% bad
 * per category/section) and derived UI status for KPI cards on the Observability dashboard.
 */

import type { KPIData, KpiThresholdStatus, SparklineKind } from './kpiTypes';
import { phase1ObservabilityMetricSeeds, type Phase1MetricSeed } from './data/phase1ObservabilityMetrics';
import {
  inferMetricSemantics,
  isObservabilityUsageCategory,
  normalizeCategoryOrder,
  normalizeMetricOrderForCategory,
  type MetricEvaluationSemantics,
  type ObservabilityConfigurationState,
} from './observabilityConfiguration';
import { buildKpiDataWithDashboardSparklines } from './dashboardKpiSparklines';

const seedById = new Map(phase1ObservabilityMetricSeeds.map((s) => [s.id, s]));

/**
 * Per-section demo bands — approx. 60% good, 10% bad, remainder neutral within each category.
 * Metric order inside a section follows the sorted catalog (observability ordering).
 */
export function buildDemoThresholdBandsForCatalog(sortedCatalog: readonly KPIData[]): Map<string, KpiThresholdStatus> {
  const byCategory = new Map<string, string[]>();
  for (const k of sortedCatalog) {
    let ids = byCategory.get(k.category);
    if (!ids) {
      ids = [];
      byCategory.set(k.category, ids);
    }
    ids.push(k.id);
  }

  const map = new Map<string, KpiThresholdStatus>();
  for (const ids of byCategory.values()) {
    const n = ids.length;
    const goodN = Math.round(n * 0.6);
    const badN = Math.round(n * 0.1);
    ids.forEach((id, i) => {
      if (i < goodN) map.set(id, 'good');
      else if (i < goodN + badN) map.set(id, 'bad');
      else map.set(id, 'neutral');
    });
  }
  return map;
}

export function filterKpiCatalogByObservabilityConfig(
  catalog: readonly KPIData[],
  config: ObservabilityConfigurationState,
): KPIData[] {
  if (config.allMetricsOff === true) {
    return [];
  }
  return catalog.filter((k) => {
    if (config.categories[k.category]?.enabled === false) return false;
    if (config.metrics[k.id]?.enabled === false) return false;
    return true;
  });
}

export function sortKpiCatalogByObservabilityOrder(
  catalog: readonly KPIData[],
  config: ObservabilityConfigurationState,
): KPIData[] {
  const catOrder = normalizeCategoryOrder(config.categoryOrder);
  const catIndex = new Map(catOrder.map((c, i) => [c, i]));

  return [...catalog].sort((a, b) => {
    const ca = catIndex.get(a.category) ?? 999;
    const cb = catIndex.get(b.category) ?? 999;
    if (ca !== cb) return ca - cb;

    const orderA = normalizeMetricOrderForCategory(a.category, config.metricOrderByCategory[a.category]);
    const ia = orderA.indexOf(a.id);
    const ib = orderA.indexOf(b.id);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export function parseKpiNumericValue(
  value: string,
  unit: string,
  sparklineKind?: SparklineKind,
): number | null {
  const v = value.trim();
  const u = unit.trim();

  if (sparklineKind === 'latency-ms' || u.toLowerCase() === 'ms') {
    const num = parseFloat(v.replace(/,/g, ''));
    return Number.isFinite(num) ? num : null;
  }

  const combined = `${v}${u}`;
  if (/%/.test(combined)) {
    const m = combined.match(/(-?[\d,]+(?:\.\d+)?)\s*%/);
    if (m) return parseFloat(m[1].replace(/,/g, ''));
  }

  const plain = parseFloat(v.replace(/,/g, '').replace(/%/g, ''));
  return Number.isFinite(plain) ? plain : null;
}

export function evaluateMetricThresholdStatus(
  n: number,
  red: number,
  green: number,
  semantics: MetricEvaluationSemantics,
): KpiThresholdStatus {
  const low = Math.min(red, green);
  const high = Math.max(red, green);

  if (semantics === 'higherIsBetter') {
    if (n >= high) return 'good';
    if (n <= low) return 'bad';
    return 'neutral';
  }

  if (n <= low) return 'good';
  if (n >= high) return 'bad';
  return 'neutral';
}

function pickDemoNumericForBand(
  seed: Phase1MetricSeed,
  semantics: MetricEvaluationSemantics,
  red: number,
  green: number,
  band: KpiThresholdStatus,
): number {
  const hi = Math.max(red, green);
  const lo = Math.min(red, green);

  if (seed.id === 'kp-knowledge-confidence') {
    if (band === 'good') return Math.min(0.995, hi + 0.03);
    if (band === 'bad') return Math.max(0, lo - 0.08);
    return (lo + hi) / 2;
  }

  if (seed.sparklineKind === 'latency-ms') {
    const goodLine = Math.min(red, green);
    const badLine = Math.max(red, green);
    if (band === 'good') return Math.max(0, goodLine * 0.72);
    if (band === 'bad') return badLine * 1.06;
    return (goodLine + badLine) / 2;
  }

  if (seed.sparklineKind === 'rating-5') {
    if (band === 'good') return Math.min(5, hi + 0.2);
    if (band === 'bad') return Math.max(0, lo - 0.35);
    return (lo + hi) / 2;
  }

  const pctLike =
    seed.sparklineKind === 'percent-100' ||
    seed.sparklineKind === 'containment' ||
    seed.unit === '%' ||
    /%/.test(seed.value);

  if (semantics === 'higherIsBetter') {
    if (pctLike) {
      if (band === 'good') return Math.min(100, hi + 1.25);
      if (band === 'bad') return Math.max(0, lo - 2.5);
      return (lo + hi) / 2;
    }
    if (band === 'good') return hi + (hi - lo) * 0.06;
    if (band === 'bad') return Math.max(0, lo - (hi - lo) * 0.06);
    return (lo + hi) / 2;
  }

  const goodLine = Math.min(red, green);
  const badLine = Math.max(red, green);
  if (pctLike) {
    if (band === 'good') return Math.max(0, goodLine - 1);
    if (band === 'bad') return Math.min(100, badLine + 2);
    return (goodLine + badLine) / 2;
  }

  if (band === 'good') return Math.max(0, goodLine * 0.88);
  if (band === 'bad') return badLine * 1.07;
  return (goodLine + badLine) / 2;
}

function formatKpiDisplayForNumeric(seed: Phase1MetricSeed, n: number): Pick<KPIData, 'value' | 'unit'> {
  if (seed.sparklineKind === 'latency-ms') {
    return { value: Math.round(n).toLocaleString('en-US'), unit: 'ms' };
  }

  if (seed.id === 'kp-knowledge-confidence') {
    return { value: n.toFixed(2), unit: '' };
  }

  if (seed.sparklineKind === 'rating-5') {
    return { value: n.toFixed(1), unit: seed.unit };
  }

  const pctLike =
    seed.sparklineKind === 'percent-100' ||
    seed.sparklineKind === 'containment' ||
    seed.unit === '%' ||
    /%/.test(seed.value);

  if (pctLike) {
    const decimals =
      /\.\d{2}/.test(seed.value.replace(/,/g, '')) ||
      (seed.value.includes('.') && (seed.value.match(/\.(\d+)/)?.[1]?.length ?? 0) >= 2)
        ? 2
        : 1;
    const text = decimals >= 2 ? n.toFixed(2) : n.toFixed(1);
    if (seed.unit === '%') return { value: text, unit: '%' };
    return { value: `${text}%`, unit: '' };
  }

  return { value: String(Math.round(n)), unit: seed.unit };
}

function applyDemoThresholdBandsToKpiCatalog(
  catalog: readonly KPIData[],
  config: ObservabilityConfigurationState,
  bands: Map<string, KpiThresholdStatus>,
): KPIData[] {
  return catalog.map((kpi) => {
    const seed = seedById.get(kpi.id);
    if (!seed) return { ...kpi };

    // Voice/Digital usage cards represent explicit budget consumption inputs (including projected dates),
    // so do not replace those values with synthetic threshold demo numbers.
    if (seed.category === 'Voice usage' || seed.category === 'Digital usage') {
      return { ...kpi };
    }

    const band = bands.get(kpi.id);
    const entry = config.metrics[kpi.id];
    if (!band || !entry) return { ...kpi };

    const semantics = inferMetricSemantics(seed);
    const n = pickDemoNumericForBand(seed, semantics, entry.redValue, entry.greenValue, band);
    const { value, unit } = formatKpiDisplayForNumeric(seed, n);
    return { ...kpi, value, unit };
  });
}

function applyThresholdStatusToKpiData(
  catalog: readonly KPIData[],
  config: ObservabilityConfigurationState,
  demoBands: Map<string, KpiThresholdStatus>,
): KPIData[] {
  return catalog.map((kpi) => {
    const seed = seedById.get(kpi.id);
    if (!seed) return { ...kpi };

    const entry = config.metrics[kpi.id];
    if (!entry) return { ...kpi };

    /**
     * Usage cards keep seeded budget-style values (not rescaled to Configuration thresholds).
     * Threshold chrome still follows the same ~60% good / ~10% bad demo bands as other categories.
     */
    if (isObservabilityUsageCategory(seed.category)) {
      const band = demoBands.get(kpi.id);
      if (band) return { ...kpi, thresholdStatus: band };
    }

    const semantics = inferMetricSemantics(seed);
    const n = parseKpiNumericValue(kpi.value, kpi.unit, seed.sparklineKind);
    if (n === null) return { ...kpi };

    const thresholdStatus = evaluateMetricThresholdStatus(n, entry.redValue, entry.greenValue, semantics);
    return { ...kpi, thresholdStatus };
  });
}

/**
 * Full Observability KPI pipeline: demo bands → sparklines → threshold status for card chrome.
 */
export function buildObservabilityKpiDataset(
  catalog: readonly KPIData[],
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
  config: ObservabilityConfigurationState,
): KPIData[] {
  const filtered = filterKpiCatalogByObservabilityConfig(catalog, config);
  const sorted = sortKpiCatalogByObservabilityOrder(filtered, config);
  const bands = buildDemoThresholdBandsForCatalog(sorted);
  const adjusted = applyDemoThresholdBandsToKpiCatalog(sorted, config, bands);
  const sparklined = buildKpiDataWithDashboardSparklines(adjusted, dateRange);
  return applyThresholdStatusToKpiData(sparklined, config, bands);
}
