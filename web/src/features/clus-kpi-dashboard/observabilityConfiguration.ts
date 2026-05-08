/**
 * Observability metric configuration state — thresholds, toggles, evaluation cost estimate.
 * Persisted to localStorage for the Configuration tab (see ObservabilityConfigurationTab).
 */

import {
  KPI_OBSERVABILITY_CATEGORY_ORDER,
  phase1ObservabilityMetricSeeds,
  type Phase1MetricSeed,
} from './data/phase1ObservabilityMetrics';

export type MetricEvaluationSemantics = 'higherIsBetter' | 'lowerIsBetter';

/** Voice and Digital usage sections cannot be disabled as a whole; hide individual cards instead. */
export const OBSERVABILITY_USAGE_CATEGORIES: readonly string[] = ['Voice usage', 'Digital usage'];

export function isObservabilityUsageCategory(category: string): boolean {
  return OBSERVABILITY_USAGE_CATEGORIES.includes(category);
}

export const OBSERVABILITY_CONFIG_STORAGE_KEY = 'builder.observability.configuration.v1';

/** Dashboard / listeners refresh when configuration is persisted. */
export const OBSERVABILITY_CONFIGURATION_CHANGED_EVENT = 'builder:observability-configuration-changed';

/**
 * Workspace-wide settings (KPI dashboard, all agents) use `OBSERVABILITY_CONFIG_STORAGE_KEY`.
 * Per-agent settings use a namespaced key so each agent’s dashboard matches that agent’s Settings.
 */
export function observabilityConfigurationStorageKey(agentScope?: string | null): string {
  const trimmed = typeof agentScope === 'string' ? agentScope.trim() : '';
  if (!trimmed) {
    return OBSERVABILITY_CONFIG_STORAGE_KEY;
  }
  return `${OBSERVABILITY_CONFIG_STORAGE_KEY}::agent::${encodeURIComponent(trimmed)}`;
}

export interface MetricConfigEntry {
  enabled: boolean;
  redValue: number;
  greenValue: number;
}

export interface CategoryConfigEntry {
  enabled: boolean;
}

export interface ObservabilityConfigurationState {
  version: 1;
  categories: Record<string, CategoryConfigEntry>;
  metrics: Record<string, MetricConfigEntry>;
  /** Dashboard section order (subset of `KPI_OBSERVABILITY_CATEGORY_ORDER`). */
  categoryOrder: string[];
  /** Metric card order within each category (metric ids). */
  metricOrderByCategory: Record<string, string[]>;
  /**
   * When true, no observability metric cards are shown on the Dashboard tab.
   * Configure under Observability → Configuration.
   */
  allMetricsOff?: boolean;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Stable evaluation cost per metric, between 50 and 80 ms inclusive. */
export function metricEvaluationCostMs(metricId: string): number {
  return 50 + (hashId(metricId) % 31);
}

/** Infer whether higher or lower raw values are healthier for status colouring. */
export function inferMetricSemantics(seed: Phase1MetricSeed): MetricEvaluationSemantics {
  const { id, heading, sparklineKind } = seed;
  const hl = heading.toLowerCase();

  if (sparklineKind === 'latency-ms') return 'lowerIsBetter';

  const lowerById = new Set([
    'ap-fallback-rate',
    'ap-avg-actions-per-conversation',
    'aq-hallucination-rate',
    'sec-guardrails-trigger-flag',
    'ce-negative-sentiment-rate',
    'ce-transfer-escalation-rate',
    'ce-avg-turns-to-solve',
    'dig-avg-response-latency',
    'kp-knowledge-staleness-rate',
    'kp-missing-content-trigger',
    'sec-toxic-content-generation',
    'sec-policy-violation-guardrail-block-rate',
    'sec-pci-leakage',
    'vo-client-barge-in-rate',
    'vo-dtmf-fallback-rate',
    'vo-avg-response-latency',
    'sec-adversarial-block-count',
  ]);

  if (lowerById.has(id)) return 'lowerIsBetter';

  if (hl.includes('latency')) {
    return 'lowerIsBetter';
  }

  if (
    /\bfallback\b|\bhallucination\b|\bnegative sentiment\b|\btoxic\b|\bleakage\b|\bstaleness\b|\btransfer\b|\bescalation\b|\bbarge-in\b|\bdtmf\b/i.test(
      heading,
    )
  ) {
    return 'lowerIsBetter';
  }

  if (sparklineKind === 'rating-5' || sparklineKind === 'containment') {
    return 'higherIsBetter';
  }

  if (id === 'kp-knowledge-confidence') return 'higherIsBetter';

  if (sparklineKind === 'percent-100' || seed.unit === '%') {
    return 'higherIsBetter';
  }

  return 'higherIsBetter';
}

export function defaultThresholds(
  seed: Phase1MetricSeed,
  semantics: MetricEvaluationSemantics,
): Pick<MetricConfigEntry, 'redValue' | 'greenValue'> {
  const { id, sparklineKind } = seed;

  if (sparklineKind === 'latency-ms') {
    return semantics === 'lowerIsBetter'
      ? { redValue: 4000, greenValue: 1200 }
      : { redValue: 5000, greenValue: 1500 };
  }

  if (sparklineKind === 'rating-5') {
    return semantics === 'higherIsBetter'
      ? { redValue: 3.5, greenValue: 4.2 }
      : { redValue: 2.5, greenValue: 1.8 };
  }

  if (id === 'kp-knowledge-confidence') {
    return { redValue: 0.62, greenValue: 0.78 };
  }

  if (id === 'kp-missing-content-trigger') {
    return { redValue: 52, greenValue: 28 };
  }

  if (id === 'sec-adversarial-block-count') {
    return { redValue: 20, greenValue: 6 };
  }

  const looksPercent =
    sparklineKind === 'percent-100' ||
    seed.unit === '%' ||
    /%/.test(seed.value);

  if (looksPercent) {
    if (semantics === 'higherIsBetter') {
      return { redValue: 85, greenValue: 95 };
    }
    return { redValue: 14, greenValue: 6 };
  }

  return { redValue: 40, greenValue: 72 };
}

export function createDefaultConfiguration(): ObservabilityConfigurationState {
  const categories: ObservabilityConfigurationState['categories'] = {};
  for (const cat of KPI_OBSERVABILITY_CATEGORY_ORDER) {
    categories[cat] = { enabled: true };
  }

  const metrics: ObservabilityConfigurationState['metrics'] = {};
  for (const seed of phase1ObservabilityMetricSeeds) {
    const semantics = inferMetricSemantics(seed);
    const { redValue, greenValue } = defaultThresholds(seed, semantics);
    metrics[seed.id] = {
      enabled: true,
      redValue,
      greenValue,
    };
  }

  const categoryOrder = [...KPI_OBSERVABILITY_CATEGORY_ORDER];
  const metricOrderByCategory: Record<string, string[]> = {};
  for (const cat of KPI_OBSERVABILITY_CATEGORY_ORDER) {
    metricOrderByCategory[cat] = metricsForCategory(cat).map((s) => s.id);
  }

  return {
    version: 1,
    categories,
    metrics,
    categoryOrder,
    metricOrderByCategory,
    allMetricsOff: false,
  };
}

function mergeWithDefaults(partial: unknown): ObservabilityConfigurationState {
  const base = createDefaultConfiguration();
  if (!partial || typeof partial !== 'object') return base;

  const obj = partial as Record<string, unknown>;
  if (obj.version !== 1) return base;

  const cats = obj.categories;
  if (cats && typeof cats === 'object') {
    for (const key of Object.keys(base.categories)) {
      const c = (cats as Record<string, unknown>)[key];
      if (c && typeof c === 'object' && 'enabled' in c) {
        base.categories[key] = {
          enabled: Boolean((c as { enabled?: boolean }).enabled),
        };
      }
    }
  }

  for (const u of OBSERVABILITY_USAGE_CATEGORIES) {
    if (base.categories[u]) {
      base.categories[u] = { enabled: true };
    }
  }

  const met = obj.metrics;
  if (met && typeof met === 'object') {
    for (const seed of phase1ObservabilityMetricSeeds) {
      const m = (met as Record<string, unknown>)[seed.id];
      if (m && typeof m === 'object') {
        const entry = m as { enabled?: boolean; redValue?: number; greenValue?: number };
        const semantics = inferMetricSemantics(seed);
        const defaults = defaultThresholds(seed, semantics);
        base.metrics[seed.id] = {
          enabled: entry.enabled !== undefined ? Boolean(entry.enabled) : true,
          redValue:
            typeof entry.redValue === 'number' && Number.isFinite(entry.redValue)
              ? entry.redValue
              : defaults.redValue,
          greenValue:
            typeof entry.greenValue === 'number' && Number.isFinite(entry.greenValue)
              ? entry.greenValue
              : defaults.greenValue,
        };
      }
    }
  }

  const co = obj.categoryOrder;
  if (Array.isArray(co) && co.every((x) => typeof x === 'string')) {
    base.categoryOrder = normalizeCategoryOrder(co as string[]);
  }

  const mob = obj.metricOrderByCategory;
  if (mob && typeof mob === 'object') {
    for (const cat of KPI_OBSERVABILITY_CATEGORY_ORDER) {
      const arr = (mob as Record<string, unknown>)[cat];
      if (Array.isArray(arr) && arr.every((x) => typeof x === 'string')) {
        base.metricOrderByCategory[cat] = normalizeMetricOrderForCategory(cat, arr as string[]);
      }
    }
  }

  if (typeof obj.allMetricsOff === 'boolean') {
    base.allMetricsOff = obj.allMetricsOff;
  }

  return base;
}

/**
 * Load persisted observability settings. With `agentScope`, reads that agent’s store; if none yet,
 * falls back to workspace-wide settings so the main KPI Settings tab remains the default baseline.
 */
export function loadObservabilityConfiguration(agentScope?: string | null): ObservabilityConfigurationState {
  if (typeof window === 'undefined') return createDefaultConfiguration();
  try {
    const key = observabilityConfigurationStorageKey(agentScope);
    let raw = window.localStorage.getItem(key);
    if (!raw && agentScope?.trim()) {
      raw = window.localStorage.getItem(OBSERVABILITY_CONFIG_STORAGE_KEY);
    }
    if (!raw) return createDefaultConfiguration();
    const parsed = JSON.parse(raw) as unknown;
    return mergeWithDefaults(parsed);
  } catch {
    return createDefaultConfiguration();
  }
}

export function saveObservabilityConfiguration(
  state: ObservabilityConfigurationState,
  agentScope?: string | null,
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = observabilityConfigurationStorageKey(agentScope);
    window.localStorage.setItem(key, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT));
  } catch {
    /* quota or private mode */
  }
}

export function metricsForCategory(category: string): Phase1MetricSeed[] {
  return phase1ObservabilityMetricSeeds.filter((s) => s.category === category);
}

const VALID_CATEGORY_SET = new Set<string>(KPI_OBSERVABILITY_CATEGORY_ORDER);

/** Merge saved order with canonical categories — drops unknowns, appends missing. */
export function normalizeCategoryOrder(order: string[] | undefined): string[] {
  const base = [...KPI_OBSERVABILITY_CATEGORY_ORDER];
  if (!order?.length) return base;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of order) {
    if (VALID_CATEGORY_SET.has(c) && !seen.has(c)) {
      out.push(c);
      seen.add(c);
    }
  }
  for (const c of base) {
    if (!seen.has(c)) out.push(c);
  }
  return out;
}

/** Merge saved metric ids with seeds for the category. */
export function normalizeMetricOrderForCategory(category: string, order: string[] | undefined): string[] {
  const defaultIds = metricsForCategory(category).map((s) => s.id);
  if (!order?.length) return defaultIds;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of order) {
    if (defaultIds.includes(id) && !seen.has(id)) {
      out.push(id);
      seen.add(id);
    }
  }
  for (const id of defaultIds) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export function getOrderedCategoryList(state: ObservabilityConfigurationState): string[] {
  return normalizeCategoryOrder(state.categoryOrder);
}

export function getOrderedMetricIdsForCategory(
  state: ObservabilityConfigurationState,
  category: string,
): string[] {
  return normalizeMetricOrderForCategory(category, state.metricOrderByCategory[category]);
}

export function getOrderedMetricSeedsForCategory(
  state: ObservabilityConfigurationState,
  category: string,
): Phase1MetricSeed[] {
  const ids = getOrderedMetricIdsForCategory(state, category);
  const byId = new Map(phase1ObservabilityMetricSeeds.map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Phase1MetricSeed[];
}

export function totalEvaluationCostMs(
  state: ObservabilityConfigurationState,
): number {
  if (state.allMetricsOff === true) {
    return 0;
  }
  let sum = 0;
  for (const seed of phase1ObservabilityMetricSeeds) {
    const cat = state.categories[seed.category]?.enabled !== false;
    const m = state.metrics[seed.id];
    if (!cat || !m?.enabled) continue;
    sum += metricEvaluationCostMs(seed.id);
  }
  return sum;
}
