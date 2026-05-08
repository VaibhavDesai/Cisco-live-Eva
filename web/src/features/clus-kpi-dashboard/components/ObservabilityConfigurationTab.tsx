/**
 * Observability Configuration tab — metric groups and per-metric thresholds (prototype).
 * Metric rows use the same collapsible rail pattern as StandardRailCard (Security tab).
 * Category and metric order sync to the Dashboard via persisted configuration.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Phase1MetricSeed } from '../data/phase1ObservabilityMetrics';
import {
  createDefaultConfiguration,
  getOrderedCategoryList,
  getOrderedMetricSeedsForCategory,
  isObservabilityUsageCategory,
  loadObservabilityConfiguration,
  normalizeCategoryOrder,
  normalizeMetricOrderForCategory,
  saveObservabilityConfiguration,
  type ObservabilityConfigurationState,
} from '../observabilityConfiguration';
import { ck, pageCopy } from '../clus-kpi-theme';
import SharedButton from '../../../components/shared/Button';
import { Input } from '../../../components/shared/FormInput';
import Toggle from '../../../components/shared/Toggle';
import { Icon } from '../../../icons/Icon';

function unitLabel(seed: Phase1MetricSeed): string {
  if (seed.sparklineKind === 'latency-ms') return 'ms';
  if (seed.sparklineKind === 'rating-5') return '/5';
  if (seed.id === 'kp-knowledge-confidence') return '';
  if (seed.unit === '%' || seed.sparklineKind === 'percent-100') return '%';
  if (seed.unit) return seed.unit.trim();
  return '';
}

interface MetricRailCardProps {
  seed: Phase1MetricSeed;
  catEnabled: boolean;
  allMetricsOff: boolean;
  entry: ObservabilityConfigurationState['metrics'][string] | undefined;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onMetricEnabled: (metricId: string, enabled: boolean) => void;
  onThreshold: (metricId: string, field: 'redValue' | 'greenValue', value: number) => void;
  metricIndex: number;
  metricCount: number;
  onReorderMetric: (delta: -1 | 1) => void;
}

function ObservabilityMetricRailCard({
  seed,
  catEnabled,
  allMetricsOff,
  entry,
  expanded,
  onExpandedChange,
  onMetricEnabled,
  onThreshold,
  metricIndex,
  metricCount,
  onReorderMetric,
}: MetricRailCardProps) {
  const unit = unitLabel(seed);
  const suffix = unit ? ` (${unit})` : '';
  const metricEnabled = entry?.enabled !== false;
  const controlsDisabled = allMetricsOff || !catEnabled || !metricEnabled;
  const metricToggleDisabled = allMetricsOff || !catEnabled;

  const lowerThresholdLabel = `Lower threshold${suffix}`;
  const upperThresholdLabel = `Upper threshold${suffix}`;

  return (
    <section
      className={`sec-tab__rail-card${!catEnabled ? ' obs-config-card--dimmed' : ''}`}
      aria-labelledby={`obs-metric-${seed.id}`}
    >
      <h3 id={`obs-metric-${seed.id}`} className="obs-config-sr-only">
        {seed.heading}
      </h3>
      <button
        type="button"
        className="sec-tab__rail-header obs-config-rail-header"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
      >
        <div className="sec-tab__rail-header-left obs-config-rail-header-toggle">
          <span
            role="presentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Toggle
              label={seed.heading}
              size="compact"
              checked={metricEnabled}
              disabled={metricToggleDisabled}
              onChange={() => onMetricEnabled(seed.id, !metricEnabled)}
            />
          </span>
        </div>
        <div className="obs-config-rail-header-actions">
          <span
            role="presentation"
            className="obs-config-rail-header-reorder"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="btn-group">
              <SharedButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={metricToggleDisabled || metricIndex === 0}
                aria-label={`Move "${seed.heading}" up in this section`}
                onClick={(e) => {
                  e.stopPropagation();
                  onReorderMetric(-1);
                }}
              >
                <Icon name="arrow-up" weight="bold" size={16} />
              </SharedButton>
              <SharedButton
                type="button"
                variant="secondary"
                size="sm"
                disabled={metricToggleDisabled || metricIndex >= metricCount - 1}
                aria-label={`Move "${seed.heading}" down in this section`}
                onClick={(e) => {
                  e.stopPropagation();
                  onReorderMetric(1);
                }}
              >
                <Icon name="arrow-down" weight="bold" size={16} />
              </SharedButton>
            </div>
          </span>
          <Icon
            name={expanded ? 'arrow-up' : 'arrow-down'}
            weight="bold"
            size={16}
            className={ck.textMuted}
          />
        </div>
      </button>

      {expanded ? (
        <p className={`obs-config-metric-desc ${ck.textMuted}`}>{seed.description}</p>
      ) : null}

      {expanded && catEnabled ? (
        <div className="sec-tab__rail-body">
          <div className="obs-config-threshold-fields">
            <Input
              label={lowerThresholdLabel}
              value={entry === undefined ? '' : String(entry.redValue)}
              disabled={controlsDisabled}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') return;
                const v = parseFloat(raw);
                if (!Number.isFinite(v)) return;
                onThreshold(seed.id, 'redValue', v);
              }}
            />
            <Input
              label={upperThresholdLabel}
              value={entry === undefined ? '' : String(entry.greenValue)}
              disabled={controlsDisabled}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') return;
                const v = parseFloat(raw);
                if (!Number.isFinite(v)) return;
                onThreshold(seed.id, 'greenValue', v);
              }}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function categoryMetricsAllExpanded(
  seeds: Phase1MetricSeed[],
  expandedMap: Record<string, boolean>,
): boolean {
  if (seeds.length === 0) return false;
  return seeds.every((s) => expandedMap[s.id] === true);
}

interface CategoryReorderSectionProps {
  category: string;
  categoryIndex: number;
  categoryCount: number;
  nudgeCategory: (idx: number, delta: -1 | 1) => void;
  expandAllControl: ReactNode;
  children: ReactNode;
}

function CategoryReorderSection({
  category,
  categoryIndex,
  categoryCount,
  nudgeCategory,
  expandAllControl,
  children,
}: CategoryReorderSectionProps) {
  return (
    <section
      className="obs-config-category"
      aria-labelledby={`obs-config-cat-title-${categoryIndex}`}
    >
      <div className="obs-config-category-heading-row">
        <h2 id={`obs-config-cat-title-${categoryIndex}`} className="gr-panel__section-title">
          {category}
        </h2>
        <div className="obs-config-category-heading-actions">
          <div className="btn-group">
            <SharedButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={categoryIndex === 0}
              aria-label={`Move section "${category}" up`}
              onClick={() => nudgeCategory(categoryIndex, -1)}
            >
              <Icon name="arrow-up" weight="bold" size={16} />
            </SharedButton>
            <SharedButton
              type="button"
              variant="secondary"
              size="sm"
              disabled={categoryIndex >= categoryCount - 1}
              aria-label={`Move section "${category}" down`}
              onClick={() => nudgeCategory(categoryIndex, 1)}
            >
              <Icon name="arrow-down" weight="bold" size={16} />
            </SharedButton>
          </div>
          {expandAllControl ? (
            <div className="obs-config-category-expand-slot">{expandAllControl}</div>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricCardWrap({ children }: { children: ReactNode }) {
  return <div className="obs-config-metric-wrap">{children}</div>;
}

export type ObservabilityConfigurationTabProps = {
  /**
   * When set, load/save settings for this agent only (`ObservabilityConfigurationTab` should be
   * remounted when the agent changes, e.g. `key={agentName}`).
   */
  agentScope?: string;
};

export function ObservabilityConfigurationTab({ agentScope }: ObservabilityConfigurationTabProps) {
  const [state, setState] = useState<ObservabilityConfigurationState>(() =>
    loadObservabilityConfiguration(agentScope),
  );

  const [metricRailExpanded, setMetricRailExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    saveObservabilityConfiguration(state, agentScope);
  }, [state, agentScope]);

  const orderedCategories = useMemo(() => getOrderedCategoryList(state), [state]);

  const setCategoryEnabled = useCallback((category: string, enabled: boolean) => {
    if (isObservabilityUsageCategory(category)) return;
    setState((prev) => ({
      ...prev,
      categories: { ...prev.categories, [category]: { enabled } },
    }));
  }, []);

  const setMetricEnabled = useCallback((metricId: string, enabled: boolean) => {
    setState((prev) => {
      const prevM = prev.metrics[metricId];
      if (!prevM) return prev;
      return {
        ...prev,
        metrics: {
          ...prev.metrics,
          [metricId]: { ...prevM, enabled },
        },
      };
    });
  }, []);

  const setMetricThreshold = useCallback(
    (metricId: string, field: 'redValue' | 'greenValue', value: number) => {
      setState((prev) => {
        const prevM = prev.metrics[metricId];
        if (!prevM) return prev;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            [metricId]: { ...prevM, [field]: value },
          },
        };
      });
    },
    [],
  );

  const setOneMetricExpanded = useCallback((metricId: string, next: boolean) => {
    setMetricRailExpanded((prev) => ({ ...prev, [metricId]: next }));
  }, []);

  const toggleExpandAllInCategory = useCallback((seeds: Phase1MetricSeed[]) => {
    if (seeds.length === 0) return;
    setMetricRailExpanded((prev) => {
      const allExpanded = categoryMetricsAllExpanded(seeds, prev);
      const next = { ...prev };
      for (const s of seeds) {
        next[s.id] = !allExpanded;
      }
      return next;
    });
  }, []);

  const nudgeCategory = useCallback((idx: number, delta: -1 | 1) => {
    const to = idx + delta;
    setState((prev) => {
      const order = [...prev.categoryOrder];
      if (to < 0 || to >= order.length) return prev;
      const [r] = order.splice(idx, 1);
      order.splice(to, 0, r);
      return { ...prev, categoryOrder: normalizeCategoryOrder(order) };
    });
  }, []);

  const reorderMetrics = useCallback((category: string, from: number, to: number) => {
    setState((prev) => {
      const ids = [...normalizeMetricOrderForCategory(category, prev.metricOrderByCategory[category])];
      const [r] = ids.splice(from, 1);
      ids.splice(to, 0, r);
      return {
        ...prev,
        metricOrderByCategory: { ...prev.metricOrderByCategory, [category]: ids },
      };
    });
  }, []);

  const allMetricsOff = state.allMetricsOff === true;

  const resetToDefaults = useCallback(() => {
    setState(createDefaultConfiguration());
    setMetricRailExpanded({});
  }, []);

  const trackMetricsLabel = agentScope ? 'Track metrics for this agent' : 'Track metrics';
  const trackMetricsHelp = agentScope
    ? 'When on, metrics for this agent are evaluated and appear on the Dashboard. When off, they are not evaluated.'
    : 'When on, metrics are evaluated and appear on the Dashboard. When off, metrics are not evaluated.';

  return (
    <div className="gr-panel observability-configuration-tab">
      <div className={pageCopy.headingBlock}>
        <h2 className={`${ck.sectionHeading} m-0`}>Metrics and thresholds</h2>
        <p className={`${ck.typo.bodyMidsizeRegular} ${ck.text} m-0`}>
          Choose which metrics to evaluate and set thresholds for status colouring. When tracking is on,
          Voice usage and Digital usage stay on; you can hide individual usage cards with each metric’s
          toggle. For other categories, when a category is off, metrics in that category are not evaluated.
          After expanding a metric, use the arrow buttons beside the thresholds to match Dashboard section
          and card order.
        </p>
      </div>

      <div className="mt-24 obs-config-track-row">
        <div className="obs-config-track-row-toggle">
          <Toggle
            label={trackMetricsLabel}
            helperText={trackMetricsHelp}
            size="compact"
            checked={!allMetricsOff}
            onChange={() =>
              setState((prev) => ({
                ...prev,
                allMetricsOff: !allMetricsOff,
              }))
            }
          />
        </div>
        <div className="obs-config-track-row-actions">
          <SharedButton type="button" variant="secondary" size="sm" onClick={resetToDefaults}>
            Reset to defaults
          </SharedButton>
        </div>
      </div>

      <div className="gr-panel__rail-list">
        {orderedCategories.map((category, categoryIndex) => {
          const catEnabled = state.categories[category]?.enabled !== false;
          const seeds = getOrderedMetricSeedsForCategory(state, category);
          const allInCategoryExpanded = categoryMetricsAllExpanded(seeds, metricRailExpanded);

          return (
            <CategoryReorderSection
              key={category}
              category={category}
              categoryIndex={categoryIndex}
              categoryCount={orderedCategories.length}
              nudgeCategory={nudgeCategory}
              expandAllControl={
                seeds.length > 0 ? (
                  <SharedButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleExpandAllInCategory(seeds)}
                  >
                    <span className="btn-icon" aria-hidden>
                      <Icon name={allInCategoryExpanded ? 'arrow-up' : 'arrow-down'} weight="bold" size={16} />
                    </span>
                    {allInCategoryExpanded ? 'Collapse all' : 'Expand all'}
                  </SharedButton>
                ) : null
              }
            >
              <div className="obs-config-category-inner">
                {isObservabilityUsageCategory(category) ? (
                  <Toggle
                    label={`${category} metrics stay on`}
                    helperText={
                      allMetricsOff
                        ? 'Turn tracking on above to show usage on the dashboard and configure cards.'
                        : 'Hide individual cards below if you do not need them on the dashboard.'
                    }
                    size="compact"
                    checked
                    disabled
                  />
                ) : (
                  <Toggle
                    label={`Include ${category} metrics`}
                    size="compact"
                    checked={catEnabled}
                    disabled={allMetricsOff}
                    onChange={() => setCategoryEnabled(category, !catEnabled)}
                  />
                )}

                <div className="obs-config-category-metrics">
                  {seeds.map((seed, metricIndex) => (
                    <MetricCardWrap key={seed.id}>
                      <ObservabilityMetricRailCard
                        seed={seed}
                        catEnabled={catEnabled}
                        allMetricsOff={allMetricsOff}
                        entry={state.metrics[seed.id]}
                        expanded={metricRailExpanded[seed.id] ?? false}
                        onExpandedChange={(next) => setOneMetricExpanded(seed.id, next)}
                        onMetricEnabled={setMetricEnabled}
                        onThreshold={setMetricThreshold}
                        metricIndex={metricIndex}
                        metricCount={seeds.length}
                        onReorderMetric={(delta) => {
                          const to = metricIndex + delta;
                          if (to < 0 || to >= seeds.length) return;
                          reorderMetrics(category, metricIndex, to);
                        }}
                      />
                    </MetricCardWrap>
                  ))}
                </div>
              </div>
            </CategoryReorderSection>
          );
        })}
      </div>
    </div>
  );
}
