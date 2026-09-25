import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type MouseEvent,
} from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SharedButton from '../../components/shared/Button';
import Dropdown from '../../components/shared/Dropdown';
import { Input } from '../../components/shared/FormInput';
import Tabs, { Tab } from '../../components/shared/Tabs';
import { Icon } from '../../icons/Icon';
import { AgentTable, agentData } from './components/AgentTable';
import { FilterBar } from './components/FilterBar';
import { SingleAgentView } from './components/SingleAgentView';
import { ObservabilityView } from './components/ObservabilityView';
import { ObservabilityConfigurationTab } from './components/ObservabilityConfigurationTab';
import { ObservabilityDashboardEmptyState } from './components/ObservabilityDashboardEmptyState';
import { InteractionsTab } from './components/InteractionsTab';
import { ClusKpiDashboardNavContext } from './clus-kpi-dashboard-nav-context';
import { pageCopy } from './clus-kpi-theme';
import imgCoreAppShell from '../../assets/app-shell-bg.png';
import { kpiData } from './components/kpiData';
import { buildObservabilityKpiDataset } from './kpiThresholdPresentation';
import {
  getOrderedCategoryList,
  loadObservabilityConfiguration,
  OBSERVABILITY_CONFIGURATION_CHANGED_EVENT,
} from './observabilityConfiguration';
import { parseAgentPathFromHash } from './agentHashNavigation';
import type { KPIData } from './kpiTypes';
import { parseKpiNumericValue } from './kpiThresholdPresentation';
import { useApp } from '../../contexts/AppContext';
import {
  CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H,
  CISCO_LIVE_BUSINESS_IMPACT_METRICS,
  CISCO_LIVE_OPERATIONAL_HEALTH_METRICS,
  CISCO_LIVE_PRIMARY_AGENT_ID,
} from '../../demo/ciscoLiveDemo';
import {
  ACTION_CONTROL_OBSERVABILITY_CATEGORY,
  buildEagleActionControlKpis,
  isEagleGreenObservabilityAgent,
} from './actionControlObservability';

/* Default dashboard state so the Observability page opens scoped to the primary
   demo agent with its key metrics already pinned (matches the design spec). */
const DEFAULT_DASHBOARD_AGENT_FILTER = 'EAGLE GREEN Event Operations';
const DEFAULT_PINNED_CARD_IDS = [
  'kp-knowledge-coverage',
  'sec-guardrails-trigger-flag',
  'ce-containment-rate',
  'ap-intent-success-rate',
  'bi-autocsat-improvement',
  'ce-csat-predictor',
];

const DATE_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Select date range' },
];

function initialDashboardAgentFilter(): string | null {
  if (typeof window === 'undefined') return DEFAULT_DASHBOARD_AGENT_FILTER;
  const requestedAgent = new URLSearchParams(window.location.search).get('agent')?.trim();
  return requestedAgent || DEFAULT_DASHBOARD_AGENT_FILTER;
}

function stableSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

function seededUnitFloat(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function formatScopedValue(kpi: KPIData, nextNumeric: number): Pick<KPIData, 'value' | 'unit'> {
  const pctLike =
    kpi.sparklineKind === 'percent-100' ||
    kpi.sparklineKind === 'containment' ||
    kpi.unit === '%' ||
    /%/.test(kpi.value);

  if (kpi.sparklineKind === 'latency-ms' || kpi.unit.trim().toLowerCase() === 'ms') {
    return { value: Math.max(0, Math.round(nextNumeric)).toLocaleString('en-US'), unit: 'ms' };
  }

  if (kpi.sparklineKind === 'rating-5' || kpi.unit === '/5') {
    const clamped = Math.min(5, Math.max(0, nextNumeric));
    return { value: clamped.toFixed(1), unit: '/5' };
  }

  if (pctLike) {
    const clamped = Math.min(100, Math.max(0, nextNumeric));
    const asText = clamped.toFixed(1);
    if (kpi.unit === '%') return { value: asText, unit: '%' };
    if (kpi.unit === '') return { value: `${asText}%`, unit: '' };
    return { value: asText, unit: kpi.unit };
  }

  return { value: Math.max(0, Math.round(nextNumeric)).toLocaleString('en-US'), unit: kpi.unit };
}

function scopeKpiToAgent(
  kpi: KPIData,
  agentName: string,
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): KPIData {
  const seed = stableSeed(`${agentName}:${kpi.id}`);
  const baseNumeric = parseKpiNumericValue(kpi.value, kpi.unit, kpi.sparklineKind);
  if (baseNumeric === null) return kpi;

  const ratioLike =
    kpi.sparklineKind === 'rating-5' ||
    kpi.sparklineKind === 'percent-100' ||
    kpi.sparklineKind === 'containment' ||
    kpi.unit === '/5' ||
    kpi.unit === '%';
  // Keep ratios in-range; scale absolute metrics to roughly 1/20 of all-agent totals.
  const variance = (seededUnitFloat(seed) - 0.5) * 0.24;
  const aggregateToAgentScale = 0.045 + seededUnitFloat(seed + 17) * 0.015; // 4.5%-6.0%
  const nextNumeric = ratioLike
    ? baseNumeric * (1 + variance)
    : baseNumeric * aggregateToAgentScale * (1 + variance * 0.35);
  const { value, unit } = formatScopedValue(kpi, nextNumeric);

  // Agent scoping changes the absolute value, not its time-over-time trend.
  // Keep the catalog's business direction, add stable per-agent variation,
  // and cap the result so scoped cards do not all report an artificial -95%.
  const reportedChangeMatch = kpi.change.trim().match(/^([+-]?\d+(?:\.\d+)?)%$/);
  const scopedChangeFactor = 0.78 + seededUnitFloat(seed + 47) * 0.44;
  const fallbackDirection = seededUnitFloat(seed + 61) >= 0.5 ? 1 : -1;
  const fallbackMagnitude = 1.2 + seededUnitFloat(seed + 79) * 8.6;
  const reportedChange = reportedChangeMatch ? Number(reportedChangeMatch[1]) : null;
  const changeDirection = reportedChange === null || reportedChange === 0
    ? fallbackDirection
    : Math.sign(reportedChange);
  const changeMagnitude = reportedChange === null
    ? fallbackMagnitude
    : Math.min(14.8, Math.max(1.2, Math.abs(reportedChange) * scopedChangeFactor));
  const change = `${changeDirection >= 0 ? '+' : '-'}${changeMagnitude.toFixed(1)}%`;
  const isPositive = reportedChangeMatch ? kpi.isPositive : changeDirection >= 0;
  const scopedKpi = { ...kpi, value, unit };

  return {
    ...scopedKpi,
    sparklineData: buildReportedTrendSeries(scopedKpi, value, unit, change, dateRange),
    sparklineScale: 'relative-change',
    change,
    isPositive,
  };
}

function reportedTrendPointCount(
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): number {
  switch (dateRange) {
    case '24h': return 24;
    case 'week': return 7;
    case 'month': return 30;
    case '90d': return 90;
    case 'custom': return 24;
  }
}

function clampReportedTrendValue(kpi: KPIData, value: number): number {
  if (kpi.sparklineKind === 'rating-5' || kpi.unit === '/5') {
    return Math.min(5, Math.max(0, value));
  }
  if (
    kpi.sparklineKind === 'percent-100'
    || kpi.sparklineKind === 'containment'
    || kpi.unit === '%'
    || kpi.value.includes('%')
  ) {
    return Math.min(100, Math.max(0, value));
  }
  return Math.max(0, value);
}

/**
 * Builds one deterministic demo series shared by the card and expanded chart.
 * The reported previous/current values remain exact; a seeded, correlated
 * bridge supplies non-periodic in-window variation without changing the delta.
 */
function buildReportedTrendSeries(
  kpi: KPIData,
  value: string,
  unit: string,
  change: string,
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): number[] | undefined {
  const currentValue = parseKpiNumericValue(value, unit, kpi.sparklineKind);
  const changeMatch = change.trim().match(/^([+-]?\d+(?:\.\d+)?)%$/);
  if (currentValue === null || !changeMatch) return undefined;

  const changeRatio = Number(changeMatch[1]) / 100;
  const priorPeriodFactor = 1 + changeRatio;
  if (!Number.isFinite(changeRatio) || priorPeriodFactor <= 0) return undefined;

  const priorPeriodValue = currentValue / priorPeriodFactor;
  const pointCount = reportedTrendPointCount(dateRange);
  const seed = stableSeed(`reported-trend:${kpi.id}:${dateRange}`);
  const correlatedNoise: number[] = [];
  let noiseState = 0;

  for (let index = 0; index < pointCount; index += 1) {
    const innovation = (seededUnitFloat(seed + (index + 1) * 193) - 0.5) * 2;
    noiseState = noiseState * 0.62 + innovation * 0.58;
    correlatedNoise.push(noiseState);
  }

  const firstNoise = correlatedNoise[0] ?? 0;
  const lastNoise = correlatedNoise[pointCount - 1] ?? 0;
  const reportedMovement = Math.abs(currentValue - priorPeriodValue);
  const metricScale = Math.max(Math.abs(priorPeriodValue), Math.abs(currentValue), 0.01);
  const volatilityFloor = metricScale * (kpi.sparklineKind === 'rating-5' ? 0.018 : 0.012);
  const volatility = Math.max(reportedMovement * 0.38, volatilityFloor);

  const series = correlatedNoise.map((noise, index) => {
    const progress = pointCount <= 1 ? 1 : index / (pointCount - 1);
    const easedProgress = progress * progress * (3 - 2 * progress);
    const reportedTrend = priorPeriodValue
      + (currentValue - priorPeriodValue) * easedProgress;
    const bridgeNoise = noise - (firstNoise * (1 - progress) + lastNoise * progress);
    return clampReportedTrendValue(kpi, reportedTrend + bridgeNoise * volatility);
  });

  series[0] = clampReportedTrendValue(kpi, priorPeriodValue);
  series[series.length - 1] = clampReportedTrendValue(kpi, currentValue);
  return series;
}

function alignKpiWithCiscoLiveOverview(
  kpi: KPIData,
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): KPIData {
  const overviewMetric = CISCO_LIVE_OPERATIONAL_HEALTH_METRICS.find(
    metric => metric.observabilityKpiId === kpi.id,
  );
  if (!overviewMetric) return kpi;

  let value = overviewMetric.value;
  let unit = kpi.unit;
  if (unit === '%' && value.endsWith('%')) value = value.slice(0, -1);
  if (unit === '/5' && value.endsWith('/5')) value = value.slice(0, -2);

  return {
    ...kpi,
    value,
    unit,
    change: overviewMetric.change,
    isPositive: overviewMetric.isPositive,
    sparklineData: buildReportedTrendSeries(
      kpi,
      value,
      unit,
      overviewMetric.change,
      dateRange,
    ),
    sparklineType: 'line',
    sparklineScale: 'relative-change',
    thresholdStatus: 'good',
  };
}

function alignKpiWithCiscoLiveBusinessImpact(
  kpi: KPIData,
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): KPIData {
  const storyMetric = CISCO_LIVE_BUSINESS_IMPACT_METRICS.find(
    metric => metric.observabilityKpiId === kpi.id,
  );
  if (!storyMetric) return kpi;

  let value = storyMetric.value;
  let unit = kpi.unit;
  if (unit === '%' && value.endsWith('%')) value = value.slice(0, -1);

  return {
    ...kpi,
    value,
    unit,
    change: storyMetric.change,
    isPositive: storyMetric.isPositive,
    sparklineData: buildReportedTrendSeries(
      kpi,
      value,
      unit,
      storyMetric.change,
      dateRange,
    ),
    sparklineType: 'line',
    sparklineScale: 'relative-change',
    thresholdStatus: storyMetric.thresholdStatus,
  };
}

const FIGMA_OBSERVABILITY_VALUES: Record<string, {
  value: string;
  change: string;
  isPositive: boolean;
  thresholdStatus: 'good' | 'bad';
}> = {
  'kp-knowledge-coverage': { value: '94.6%', change: '-3.9%', isPositive: false, thresholdStatus: 'bad' },
  'sec-guardrails-trigger-flag': { value: '5.6%', change: '+1.2%', isPositive: false, thresholdStatus: 'good' },
  'ce-containment-rate': { value: '89%', change: '+3.2%', isPositive: true, thresholdStatus: 'bad' },
  'ap-intent-success-rate': { value: '100%', change: '-1.2%', isPositive: false, thresholdStatus: 'good' },
  'bi-autocsat-improvement': { value: '89.2%', change: '+5.5%', isPositive: true, thresholdStatus: 'good' },
  'ce-csat-predictor': { value: '4.2/5', change: '-5.3%', isPositive: false, thresholdStatus: 'good' },
  'bi-aht-reduction': { value: '100%', change: '-2.8%', isPositive: false, thresholdStatus: 'good' },
  'bi-first-contact-resolution': { value: '100%', change: '-6.1%', isPositive: false, thresholdStatus: 'good' },
  'bi-ai-agent-productivity-voice': { value: '85.5%', change: '+4.5%', isPositive: true, thresholdStatus: 'bad' },
  'bi-ai-agent-productivity-digital': { value: '83.6%', change: '+1.6%', isPositive: true, thresholdStatus: 'good' },
};

function alignKpiWithFigmaObservability(
  kpi: KPIData,
  dateRange: '24h' | 'week' | 'month' | '90d' | 'custom',
): KPIData {
  const aligned = FIGMA_OBSERVABILITY_VALUES[kpi.id];
  if (!aligned) return kpi;

  let value = aligned.value;
  if (kpi.unit === '%' && value.endsWith('%')) value = value.slice(0, -1);
  if (kpi.unit === '/5' && value.endsWith('/5')) value = value.slice(0, -2);

  const next = {
    ...kpi,
    value,
    change: aligned.change,
    isPositive: aligned.isPositive,
    thresholdStatus: aligned.thresholdStatus,
  };

  return {
    ...next,
    sparklineData: buildReportedTrendSeries(
      next,
      value,
      next.unit,
      aligned.change,
      dateRange,
    ),
    sparklineType: 'line',
    sparklineScale: 'relative-change',
  };
}

function alignKpiWithCiscoLiveActionControl24h(kpi: KPIData): KPIData {
  const summary = CISCO_LIVE_ACTION_CONTROL_SUMMARY_24H;
  const valuesById: Record<string, { value: string; unit?: string }> = {
    'ac-control-evaluations': { value: summary.evaluated.toLocaleString('en-US') },
    'ac-control-match-rate': { value: String(summary.matchRate), unit: '%' },
    'ac-steer-outcomes': { value: summary.steered.toLocaleString('en-US') },
    'ac-denied-actions': { value: summary.denied.toLocaleString('en-US') },
    'ac-gated-action-unlocks': { value: summary.unlocked.toLocaleString('en-US') },
  };
  const aligned = valuesById[kpi.id];
  if (!aligned) return kpi;

  return {
    ...kpi,
    value: aligned.value,
    unit: aligned.unit ?? kpi.unit,
    change: '24h aggregate',
    changeTone: 'neutral',
    // The 24-hour totals are curated aggregates; the seeded Session records are
    // drill-down samples, not a complete time series for those totals.
    sparklineData: undefined,
    sparklineType: undefined,
    sparklineScale: undefined,
    thresholdStatus: 'good',
  };
}

export function ClusKpiDashboardRoot() {
  const { agentDrafts } = useApp();
  const [dateRange, setDateRange] = useState<'24h' | 'week' | 'month' | '90d' | 'custom'>('24h');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [dashboardAgentFilter, setDashboardAgentFilter] = useState<string | null>(
    initialDashboardAgentFilter,
  );
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [pinnedCardIds, setPinnedCardIds] = useState<string[]>(DEFAULT_PINNED_CARD_IDS);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const [observabilityConfigVersion, setObservabilityConfigVersion] = useState(0);

  useEffect(() => {
    const bump = () => setObservabilityConfigVersion((v) => v + 1);
    window.addEventListener(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT, bump);
    return () => window.removeEventListener(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT, bump);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (dashboardAgentFilter) {
      url.searchParams.set('agent', dashboardAgentFilter);
    } else {
      url.searchParams.delete('agent');
    }
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }, [dashboardAgentFilter]);

  const observabilityConfig = useMemo(
    () => loadObservabilityConfiguration(),
    [observabilityConfigVersion],
  );

  const dashboardMetricsAllOff = observabilityConfig.allMetricsOff === true;

  useEffect(() => {
    if (dashboardMetricsAllOff) {
      setActiveCardId(null);
    }
  }, [dashboardMetricsAllOff]);

  const togglePin = useCallback((cardId: string, e: MouseEvent) => {
    e.stopPropagation();
    setPinnedCardIds((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId],
    );
  }, []);

  const movePinnedCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setPinnedCardIds((prev) => {
      const draggedId = prev[dragIndex];
      const next = [...prev];
      next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, draggedId);
      return next;
    });
  }, []);

  const clusKpiNav = useMemo(
    () => ({
      openInteraction: (id: string) => {
        setSelectedAgent(null);
        setSelectedInteraction(id);
        setActiveTab('interactions');
        window.location.hash = `#/interaction/${encodeURIComponent(id)}`;
      },
    }),
    [],
  );

  // Listen to hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/agent/')) {
        const agentName = parseAgentPathFromHash(hash);
        if (agentName) {
          setSelectedAgent(agentName);
        }
        setSelectedInteraction(null);
      } else if (hash.startsWith('#/interaction/')) {
        const interactionId = hash.replace('#/interaction/', '');
        setSelectedInteraction(decodeURIComponent(interactionId));
        setSelectedAgent(null);
        setActiveTab('interactions');
      } else if (hash === '' || hash === '#/') {
        setSelectedAgent(null);
        setSelectedInteraction(null);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const kpiDataWithSparklines = useMemo(
    () => buildObservabilityKpiDataset(kpiData, dateRange, observabilityConfig),
    [dateRange, observabilityConfig],
  );

  const configuredCategories = useMemo(
    () => getOrderedCategoryList(observabilityConfig),
    [observabilityConfig],
  );

  // Filter KPIs based on search query
  const filteredKpiData = useMemo(() => {
    if (!searchQuery.trim()) {
      return kpiDataWithSparklines;
    }

    const query = searchQuery.toLowerCase();
    return kpiDataWithSparklines.filter((kpi) => kpi.heading.toLowerCase().includes(query));
  }, [kpiDataWithSparklines, searchQuery]);

  const eagleActionValues = agentDrafts[CISCO_LIVE_PRIMARY_AGENT_ID]
    ?.familyConfiguration.actions?.values;

  const dashboardKpiData = useMemo(() => {
    const scopedKpis = dashboardAgentFilter
      ? filteredKpiData.map((kpi) => scopeKpiToAgent(
          kpi,
          dashboardAgentFilter,
          dateRange,
        ))
      : filteredKpiData;

    if (!isEagleGreenObservabilityAgent(dashboardAgentFilter)) return scopedKpis;

    const overviewAlignedKpis = scopedKpis
      .map(kpi => alignKpiWithCiscoLiveOverview(kpi, dateRange))
      .map(kpi => alignKpiWithCiscoLiveBusinessImpact(kpi, dateRange))
      .map(kpi => alignKpiWithFigmaObservability(kpi, dateRange));

    const query = searchQuery.trim().toLowerCase();
    const actionControlKpis = buildEagleActionControlKpis({
      dateRange,
      customDateRange,
      actionValues: eagleActionValues,
    }).filter(kpi => (
      !query
      || kpi.heading.toLowerCase().includes(query)
      || kpi.description.toLowerCase().includes(query)
    ));
    const alignedActionControlKpis = actionControlKpis
      .map(kpi => alignKpiWithCiscoLiveOverview(kpi, dateRange))
      .map(kpi => dateRange === '24h' ? alignKpiWithCiscoLiveActionControl24h(kpi) : kpi);
    return [...overviewAlignedKpis, ...alignedActionControlKpis];
  }, [
    filteredKpiData,
    dashboardAgentFilter,
    searchQuery,
    dateRange,
    customDateRange,
    eagleActionValues,
  ]);

  const categories = useMemo(() => {
    if (!isEagleGreenObservabilityAgent(dashboardAgentFilter)) return configuredCategories;
    const withoutActionControls = configuredCategories.filter(
      category => category !== ACTION_CONTROL_OBSERVABILITY_CATEGORY,
    );
    const businessImpactFirst = [
      ...withoutActionControls.filter(category => category === 'Business Impact'),
      ...withoutActionControls.filter(category => category !== 'Business Impact'),
    ];
    const actionPerformanceIndex = businessImpactFirst.indexOf('Action Performance');
    const insertionIndex = actionPerformanceIndex >= 0
      ? actionPerformanceIndex + 1
      : Math.min(2, businessImpactFirst.length);
    return [
      ...businessImpactFirst.slice(0, insertionIndex),
      ACTION_CONTROL_OBSERVABILITY_CATEGORY,
      ...businessImpactFirst.slice(insertionIndex),
    ];
  }, [configuredCategories, dashboardAgentFilter]);

  useEffect(() => {
    const visibleIds = new Set(dashboardKpiData.map((k) => k.id));
    setPinnedCardIds((prev) => {
      const next = prev.filter((id) => visibleIds.has(id));
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [dashboardKpiData]);

  const filtersContent = (
    <>
      <div className="clus-kpi-toolbar flex gap-3 items-center flex-wrap">
        <SharedButton
          type="button"
          variant="secondary"
          size="sm"
          className={showFilterBar ? 'active' : ''}
          aria-pressed={showFilterBar}
          onClick={() => setShowFilterBar(!showFilterBar)}
        >
          <span className="btn-icon" aria-hidden>
            <Icon name="filter-circle" weight="bold" size={16} />
          </span>
          Filters
        </SharedButton>

        <div className="flex-1 min-w-[200px] max-w-[400px] clus-kpi-search-wrap">
          <Input
            aria-label="Search metrics"
            placeholder="Search metrics"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leadingIcon="search"
            clearable
            onClear={() => setSearchQuery('')}
            className="clus-kpi-search-input"
          />
        </div>

        <div className="shrink-0 w-[11rem] clus-kpi-date-select-wrap">
          <Dropdown
            aria-label="Date range"
            options={DATE_RANGE_OPTIONS}
            value={dateRange}
            onChange={(v) => {
              const next = v as '24h' | 'week' | 'month' | '90d' | 'custom';
              if (next === 'custom') {
                setDateRange('custom');
                setDateDialogOpen(true);
              } else {
                setDateRange(next);
                setCustomDateRange(undefined);
                setDateDialogOpen(false);
              }
            }}
            size="compact"
            className="clus-kpi-date-select"
          />
        </div>

      </div>

      {dashboardAgentFilter ? (
        <div className="clus-kpi-agent-filter-row mt-3 flex flex-wrap items-center gap-2">
          <span className="clus-kpi-agent-filter-chip inline-flex items-center gap-2 border border-[var(--mds-color-theme-outline-secondary-normal)] bg-[var(--mds-color-theme-background-secondary-normal)] px-3 py-1">
            <span className="mds-type-body-small-medium">Filter by agent:</span>
            <span className="mds-type-body-small-medium">{dashboardAgentFilter}</span>
            <button
              type="button"
              className="clus-kpi-agent-filter-clear"
              aria-label="Clear agent filter"
              onClick={() => setDashboardAgentFilter(null)}
            >
              <Icon name="cancel" weight="bold" size={16} />
            </button>
          </span>
        </div>
      ) : null}

      {dateDialogOpen && dateRange === 'custom' && (
        <div
          className="clus-kpi-modal-backdrop"
          role="presentation"
          onClick={() => setDateDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="clus-kpi-date-title"
            className="clus-kpi-modal-panel clus-kpi-modal-panel--date"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="clus-kpi-date-title" className="clus-kpi-modal-title">
              Select date range
            </h4>
            <div className="clus-kpi-date-custom">
              <SharedButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDateRange('24h');
                  setCustomDateRange(undefined);
                  setDateDialogOpen(false);
                }}
              >
                Back to presets
              </SharedButton>
              <DayPicker
                mode="range"
                selected={customDateRange}
                onSelect={(range) => setCustomDateRange(range)}
                className="clus-kpi-daypicker"
              />
            </div>
            <div className="clus-kpi-modal-actions">
              <SharedButton variant="primary" size="sm" onClick={() => setDateDialogOpen(false)}>
                Done
              </SharedButton>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <ClusKpiDashboardNavContext.Provider value={clusKpiNav}>
      <DndProvider backend={HTML5Backend}>
      <div className="clus-kpi-dashboard-root">
        <div className="clus-kpi-dashboard-bg" aria-hidden>
          <div className="clus-kpi-dashboard-bg-solid" />
          <img alt="" className="clus-kpi-dashboard-bg-img" src={imgCoreAppShell} />
        </div>

        <div className="clus-kpi-dashboard-body">
        {selectedAgent ? (
          <SingleAgentView agentName={selectedAgent} onBack={() => setSelectedAgent(null)} />
        ) : (
          <>
            <div className="clus-kpi-page-header">
              <div className={pageCopy.headingBlock}>
                <h1 className="screen-title">Observability</h1>
                <p className="app-page-description clus-kpi-observability-subtitle">
                  Manage and monitor your AI agents
                </p>
              </div>
            </div>

            <Tabs
              variant="glass"
              aria-label="Observability views"
              className="clus-kpi-observability-tablist"
            >
              <Tab
                active={activeTab === 'dashboard'}
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedInteraction(null);
                  if (window.location.hash.startsWith('#/interaction/')) {
                    window.location.hash = '#/';
                  }
                }}
              >
                Dashboard
              </Tab>
              <Tab
                active={activeTab === 'interactions'}
                onClick={() => setActiveTab('interactions')}
              >
                Interactions
              </Tab>
              <Tab
                active={activeTab === 'configuration'}
                onClick={() => {
                  setActiveTab('configuration');
                  setSelectedInteraction(null);
                  if (window.location.hash.startsWith('#/interaction/')) {
                    window.location.hash = '#/';
                  }
                }}
              >
                Settings
              </Tab>
            </Tabs>

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {filtersContent}
                <div className="clus-kpi-split">
                  {showFilterBar && (
                    <FilterBar
                      agentNames={agentData.map((agent) => agent.agentName)}
                      onAgentClick={(agentName) => {
                        setDashboardAgentFilter(agentName);
                        setActiveTab('dashboard');
                      }}
                    />
                  )}
                  <div className="clus-kpi-split-main">
                    {dashboardMetricsAllOff ? (
                      <ObservabilityDashboardEmptyState
                        onOpenConfiguration={() => setActiveTab('configuration')}
                      />
                    ) : (
                      <ObservabilityView
                        filteredKpiData={dashboardKpiData}
                        categories={categories}
                        dateRange={dateRange}
                        customDateRange={customDateRange}
                        actionValues={eagleActionValues}
                        pinnedCardIds={pinnedCardIds}
                        onPinToggle={togglePin}
                        onMoveCard={movePinnedCard}
                        activeCardId={activeCardId}
                        onActiveCardChange={setActiveCardId}
                        onDateRangeChange={(range, custom) => {
                          setDateRange(range);
                          setCustomDateRange(custom);
                        }}
                      />
                    )}
                  </div>
                </div>
                <AgentTable
                  onViewAgent={(agentName) => {
                    setDashboardAgentFilter(agentName);
                    setActiveTab('dashboard');
                  }}
                />
              </div>
            )}

            {activeTab === 'interactions' && (
              <InteractionsTab
                dateRange={dateRange}
                customDateRange={customDateRange}
                interactionId={selectedInteraction}
                onBack={() => {
                  setSelectedInteraction(null);
                  window.location.hash = '#/';
                }}
                onDateRangeChange={(
                  range: '24h' | 'week' | 'month' | '90d' | 'custom',
                  custom: DateRange | undefined,
                ) => {
                  setDateRange(range);
                  setCustomDateRange(custom);
                }}
              />
            )}

            {activeTab === 'configuration' && (
              <ObservabilityConfigurationTab key="workspace-observability-settings" />
            )}
          </>
        )}
        </div>
      </div>
      </DndProvider>
    </ClusKpiDashboardNavContext.Provider>
  );
}
