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

const DATE_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Select date range' },
];

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

function scopeKpiToAgent(kpi: KPIData, agentName: string): KPIData {
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

  const sparklineData = kpi.sparklineData?.map((point, idx) => {
    const pointSeed = seed + (idx + 1) * 97;
    const pointVariance = (seededUnitFloat(pointSeed) - 0.5) * 0.08;
    const shifted = ratioLike
      ? point * (1 + variance * 0.7 + pointVariance)
      : point * aggregateToAgentScale * (1 + variance * 0.25 + pointVariance);

    if (kpi.sparklineKind === 'rating-5' || kpi.unit === '/5') return Math.min(5, Math.max(0, shifted));
    if (kpi.sparklineKind === 'percent-100' || kpi.sparklineKind === 'containment' || kpi.unit === '%') {
      return Math.min(100, Math.max(0, shifted));
    }
    return Math.max(0, shifted);
  });

  const effectiveDelta = ratioLike ? variance : aggregateToAgentScale - 1;
  const changeMagnitude = Math.abs(effectiveDelta) * 100;
  const isPositive = effectiveDelta >= 0;
  const change = `${isPositive ? '+' : '-'}${changeMagnitude.toFixed(1)}%`;

  return {
    ...kpi,
    value,
    unit,
    sparklineData,
    change,
    isPositive,
  };
}

export function ClusKpiDashboardRoot() {
  const [dateRange, setDateRange] = useState<'24h' | 'week' | 'month' | '90d' | 'custom'>('24h');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [dashboardAgentFilter, setDashboardAgentFilter] = useState<string | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [pinnedCardIds, setPinnedCardIds] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const [observabilityConfigVersion, setObservabilityConfigVersion] = useState(0);

  useEffect(() => {
    const bump = () => setObservabilityConfigVersion((v) => v + 1);
    window.addEventListener(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT, bump);
    return () => window.removeEventListener(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT, bump);
  }, []);

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

  const categories = useMemo(
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

  const dashboardKpiData = useMemo(() => {
    if (!dashboardAgentFilter) return filteredKpiData;
    return filteredKpiData.map((kpi) => scopeKpiToAgent(kpi, dashboardAgentFilter));
  }, [filteredKpiData, dashboardAgentFilter]);

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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--mds-color-theme-outline-secondary-normal)] bg-[var(--mds-color-theme-background-secondary-normal)] px-3 py-1">
            <span className="mds-type-body-small-medium">Filtered by agent:</span>
            <span className="mds-type-body-small-medium">{dashboardAgentFilter}</span>
          </span>
          <SharedButton
            type="button"
            variant="tertiary"
            size="sm"
            onClick={() => setDashboardAgentFilter(null)}
          >
            <span className="btn-icon" aria-hidden>
              <Icon name="cancel" weight="bold" size={16} />
            </span>
            Clear filter
          </SharedButton>
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