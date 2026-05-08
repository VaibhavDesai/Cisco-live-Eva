import {
  Fragment,
  useState,
  useEffect,
  useRef,
  useMemo,
  useLayoutEffect,
  type ElementRef,
} from 'react';
import { ck } from '../clus-kpi-theme';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Button, Option, Searchfield, Select, Selectlistbox, Tab, TabList } from '../momentum';
import { KPICard } from './KPICard';
import { KPIChart } from './KPIChart';
import { FilterBar } from './FilterBar';
import { kpiData } from './kpiData';
import { buildObservabilityKpiDataset } from '../kpiThresholdPresentation';
import {
  getOrderedCategoryList,
  loadObservabilityConfiguration,
  OBSERVABILITY_CONFIGURATION_CHANGED_EVENT,
} from '../observabilityConfiguration';
import { kpiExpandedChartAxisProps } from '../kpiChartAxis';
import { PageHeader, type AgentPageTab } from './PageHeader';
import { RecentInteractions } from './RecentInteractions';
import { agentData } from './AgentTable';
import {
  KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT,
  OBSERVABILITY_PROJECTION_DIGITAL_ID,
  OBSERVABILITY_PROJECTION_VOICE_ID,
  observabilityProjectionIdForCategory,
} from '../data/phase1ObservabilityMetrics';
import { ObservabilityConfigurationTab } from './ObservabilityConfigurationTab';
import { ObservabilityDashboardEmptyState } from './ObservabilityDashboardEmptyState';
import { ObservabilityProjectionCard } from './ObservabilityProjectionCard';
import { hideMomentumTabListOverflowArrows } from '../hideMomentumTabListOverflowArrows';
import { parsePrimaryTabFromAgentHash } from '../agentHashNavigation';

interface SingleAgentViewProps {
  agentName: string;
  onBack: () => void;
}

type ObservabilitySubTab = 'dashboard' | 'configuration';

export function SingleAgentView({ agentName, onBack }: SingleAgentViewProps) {
  const [activeTab, setActiveTab] = useState<AgentPageTab>(() => {
    if (typeof window === 'undefined') return 'Observability';
    return parsePrimaryTabFromAgentHash(window.location.hash) ?? 'Observability';
  });
  /** Matches ClusKpiDashboardRoot: Dashboard vs Configuration under Observability. */
  const [observabilitySubTab, setObservabilitySubTab] = useState<ObservabilitySubTab>('dashboard');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'24h' | 'week' | 'month' | '90d' | 'custom'>('24h');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [stickyChart] = useState(false);
  const [pinnedCardIds, setPinnedCardIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const observabilitySubTabListRef = useRef<ElementRef<typeof TabList> | null>(null);
  
  const agentStatus = agentData.find(a => a.agentName === agentName)?.availability || 'Live';

  const [observabilityConfigVersion, setObservabilityConfigVersion] = useState(0);

  useEffect(() => {
    const bump = () => setObservabilityConfigVersion((v) => v + 1);
    window.addEventListener(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT, bump);
    return () => window.removeEventListener(OBSERVABILITY_CONFIGURATION_CHANGED_EVENT, bump);
  }, []);

  const observabilityConfig = useMemo(
    () => loadObservabilityConfiguration(agentName),
    [observabilityConfigVersion, agentName],
  );

  const categories = useMemo(
    () => getOrderedCategoryList(observabilityConfig),
    [observabilityConfig],
  );

  const dashboardMetricsAllOff = observabilityConfig.allMetricsOff === true;

  useEffect(() => {
    if (dashboardMetricsAllOff) {
      setActiveCardId(null);
    }
  }, [dashboardMetricsAllOff]);

  useEffect(() => {
    setObservabilitySubTab('dashboard');
  }, [agentName]);

  useEffect(() => {
    const syncTabFromHash = () => {
      const tab = parsePrimaryTabFromAgentHash(window.location.hash);
      if (tab) setActiveTab(tab);
    };
    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, []);

  useEffect(() => {
    const tab = parsePrimaryTabFromAgentHash(window.location.hash);
    if (tab) setActiveTab(tab);
  }, [agentName]);

  useLayoutEffect(() => {
    const el = observabilitySubTabListRef.current;
    if (!el) return;

    const hide = () => hideMomentumTabListOverflowArrows(el);
    hide();
    const raf = requestAnimationFrame(hide);

    const root = el.shadowRoot;
    const mo =
      root &&
      new MutationObserver(() => {
        hide();
      });
    if (root) {
      mo?.observe(root, { childList: true, subtree: true });
    }

    const ro = new ResizeObserver(hide);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      mo?.disconnect();
      ro.disconnect();
    };
  }, [observabilitySubTab, activeTab]);

  // Scroll to top when component mounts or agent changes
  useEffect(() => {
    // Scroll the parent scrolling container to top
    topRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [agentName]);

  const kpiDataWithSparklines = useMemo(
    () => buildObservabilityKpiDataset(kpiData, dateRange, observabilityConfig),
    [dateRange, observabilityConfig],
  );

  const filteredKpiData = useMemo(() => {
    if (!searchQuery.trim()) {
      return kpiDataWithSparklines;
    }
    const q = searchQuery.toLowerCase();
    return kpiDataWithSparklines.filter((kpi) => kpi.heading.toLowerCase().includes(q));
  }, [kpiDataWithSparklines, searchQuery]);

  const activeKPI = filteredKpiData.find((kpi) => kpi.id === activeCardId);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedCardIds(prev => 
      prev.includes(id) ? prev.filter(pinId => pinId !== id) : [...prev, id]
    );
  };

  const movePinnedCard = (dragIndex: number, hoverIndex: number) => {
    const draggedId = pinnedCardIds[dragIndex];
    const newPinnedIds = [...pinnedCardIds];
    newPinnedIds.splice(dragIndex, 1);
    newPinnedIds.splice(hoverIndex, 0, draggedId);
    setPinnedCardIds(newPinnedIds);
  };

  /** Align with ClusKpiDashboardRoot: configuration has no filters/search/date toolbar */
  const hideObservabilityToolbar =
    activeTab === 'Observability' && observabilitySubTab === 'configuration';

  return (
    <div ref={topRef} className="flex-1 w-full min-w-0">
      {/* Header */}
      <div className="mb-2">
        <PageHeader 
          agentName={agentName} 
          status={agentStatus}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {activeTab === 'Observability' && (
        <TabList
          ref={observabilitySubTabListRef}
          data-aria-label="Observability views"
          style={{ marginTop: '4px' }}
          activeTabId={observabilitySubTab}
          onChange={(e: CustomEvent<{ tabId: string }>) => {
            const tabId = e.detail.tabId as ObservabilitySubTab;
            if (tabId === 'dashboard' || tabId === 'configuration') {
              setObservabilitySubTab(tabId);
            }
          }}
        >
          <Tab tabId="dashboard" text="Dashboard" variant="pill" />
          <Tab tabId="configuration" text="Settings" variant="pill" />
        </TabList>
      )}

      {/* Top filter bar — same pattern as Observability dashboard (ClusKpiDashboardRoot filtersContent) */}
      {!hideObservabilityToolbar && (
      <div className="clus-kpi-toolbar flex gap-3 items-center flex-wrap mb-4">
        <Button
          type="button"
          color="default"
          variant="secondary"
          size={32}
          active={showFilterBar}
          onClick={() => setShowFilterBar(!showFilterBar)}
          prefixIcon="filter-circle-bold"
        >
          Filters
        </Button>

        {activeTab === 'Observability' && observabilitySubTab === 'dashboard' && (
          <div className="flex-1 min-w-[200px] max-w-[400px] clus-kpi-search-wrap">
            <Searchfield
              label=""
              dataAriaLabel="Search metrics"
              placeholder="Search metrics"
              value={searchQuery}
              onInput={(e: Event) =>
                setSearchQuery((e.target as HTMLElement & { value: string }).value)
              }
              className="clus-kpi-search-input"
            />
          </div>
        )}

        {activeTab === 'Interactions' && (
          <div className="w-[600px] min-w-0 flex-1 clus-kpi-search-wrap">
            <Searchfield
              label=""
              dataAriaLabel="Search transcripts, interactions, or customer IDs"
              placeholder="Search transcripts or for interactions and customer IDs"
              className="clus-kpi-search-input"
            />
          </div>
        )}

        <div className="shrink-0 w-[11rem] clus-kpi-date-select-wrap">
          <Select
            label=""
            dataAriaLabel="Date range"
            value={dateRange}
            onChange={(e: Event) => {
              const v = (e.target as HTMLElement & { value: string }).value as
                | '24h'
                | 'week'
                | 'month'
                | '90d'
                | 'custom';
              if (v === 'custom') {
                setDateRange('custom');
                setDateDialogOpen(true);
              } else {
                setDateRange(v);
                setCustomDateRange(undefined);
                setDateDialogOpen(false);
              }
            }}
            className="clus-kpi-date-select"
          >
            <Selectlistbox>
              <Option value="24h" label="Last 24 hours" selected={dateRange === '24h'} />
              <Option value="week" label="Last week" selected={dateRange === 'week'} />
              <Option value="month" label="Last month" selected={dateRange === 'month'} />
              <Option value="90d" label="Last 90 days" selected={dateRange === '90d'} />
              <Option value="custom" label="Select date range" selected={dateRange === 'custom'} />
            </Selectlistbox>
          </Select>
        </div>

        {activeTab !== 'Interactions' && (
          <Button
            type="button"
            color="default"
            variant="secondary"
            size={32}
            onClick={() => {
              window.location.hash = '/';
              onBack();
            }}
          >
            All agents
          </Button>
        )}
      </div>
      )}

      {dateDialogOpen && dateRange === 'custom' && (
        <div
          className="clus-kpi-modal-backdrop"
          role="presentation"
          onClick={() => setDateDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="clus-kpi-sa-date-title"
            className="clus-kpi-modal-panel clus-kpi-modal-panel--date"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="clus-kpi-sa-date-title" className="clus-kpi-modal-title">
              Select date range
            </h4>
            <div className="clus-kpi-date-custom">
              <Button
                color="default"
                variant="secondary"
                size={32}
                onClick={() => {
                  setDateRange('24h');
                  setCustomDateRange(undefined);
                  setDateDialogOpen(false);
                }}
              >
                Back to presets
              </Button>
              <DayPicker
                mode="range"
                selected={customDateRange}
                onSelect={(range) => setCustomDateRange(range)}
                className="clus-kpi-daypicker"
              />
            </div>
            <div className="clus-kpi-modal-actions">
              <Button color="accent" variant="primary" size={32} onClick={() => setDateDialogOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Observability' && observabilitySubTab === 'configuration' && (
        <div className="space-y-6">
          <ObservabilityConfigurationTab key={agentName} agentScope={agentName} />
        </div>
      )}

      {/* Observability dashboard — KPI grid (mirrors all-agents Dashboard tab) */}
      {activeTab === 'Observability' && observabilitySubTab === 'dashboard' && (
        <>
          {dashboardMetricsAllOff ? (
            <ObservabilityDashboardEmptyState
              onOpenConfiguration={() => setObservabilitySubTab('configuration')}
            />
          ) : (
            <>
          {/* Sticky Chart (shown when a card is active and stickyChart is true) */}
          {stickyChart && activeKPI && (
            <div className="sticky top-0 z-10 mb-4">
              <KPIChart 
                heading={activeKPI.heading}
                description={activeKPI.description}
                chartType={activeKPI.chartType}
                dateRange={dateRange}
                customDateRange={customDateRange}
                sparklineData={activeKPI.sparklineData}
                unit={activeKPI.unit}
                value={activeKPI.value}
                {...kpiExpandedChartAxisProps(activeKPI)}
              />
            </div>
          )}

          {/* KPI Cards Grid - Grouped by Category */}
          <div className={`flex gap-4 ${showFilterBar ? '' : ''}`}>
            {/* Filter Bar - Conditionally rendered (without Agents section) */}
            {showFilterBar && (
              <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
            )}
            
            {/* Content Area */}
            <div className="flex-1 space-y-8">
              {/* Pinned Section */}
              {pinnedCardIds.length > 0 && (
                  <div>
                    <h2 className={`${ck.sectionHeading} mb-4`}>Pinned</h2>
                    <div className="kpi-card-grid">
                      {pinnedCardIds.map((pinnedId, index) => {
                        const CARDS_PER_ROW = 4;
                        const projSup =
                          pinnedId === OBSERVABILITY_PROJECTION_VOICE_ID
                            ? KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT['Voice usage']
                            : pinnedId === OBSERVABILITY_PROJECTION_DIGITAL_ID
                              ? KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT['Digital usage']
                              : undefined;

                        const isLastInRow =
                          (index + 1) % CARDS_PER_ROW === 0 || index === pinnedCardIds.length - 1;
                        const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
                        const idsInRow = pinnedCardIds.slice(
                          currentRowStart,
                          Math.min(currentRowStart + CARDS_PER_ROW, pinnedCardIds.length),
                        );
                        const isActiveCardInThisRow =
                          !stickyChart &&
                          idsInRow.some((id) => {
                            const rowK = filteredKpiData.find((x) => x.id === id);
                            return rowK && rowK.id === activeCardId;
                          });

                        const expandedChart =
                          isLastInRow && isActiveCardInThisRow && activeKPI ? (
                            <div className="kpi-card-grid__expanded">
                              <KPIChart
                                heading={activeKPI.heading}
                                description={activeKPI.description}
                                chartType={activeKPI.chartType}
                                dateRange={dateRange}
                                customDateRange={customDateRange}
                                sparklineData={activeKPI.sparklineData}
                                unit={activeKPI.unit}
                                value={activeKPI.value}
                                {...kpiExpandedChartAxisProps(activeKPI)}
                              />
                            </div>
                          ) : null;

                        if (projSup) {
                          return (
                            <Fragment key={pinnedId}>
                              <ObservabilityProjectionCard
                                cardId={pinnedId}
                                title={projSup.title}
                                dateLabel={projSup.dateLabel}
                                thresholdStatus={projSup.thresholdStatus}
                                isPinned
                                onPinToggle={(e) => togglePin(pinnedId, e)}
                                dragIndex={index}
                                onMoveCard={movePinnedCard}
                              />
                              {expandedChart}
                            </Fragment>
                          );
                        }

                        const kpi = filteredKpiData.find((k) => k.id === pinnedId);
                        if (!kpi) return null;

                        return (
                          <Fragment key={kpi.id}>
                            <KPICard
                              data={kpi}
                              isActive={activeCardId === kpi.id}
                              onClick={() => setActiveCardId(kpi.id === activeCardId ? null : kpi.id)}
                              onPinToggle={(e) => togglePin(kpi.id, e)}
                              isPinned={true}
                              dragIndex={index}
                              onMoveCard={movePinnedCard}
                            />
                            {expandedChart}
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
              )}
              
              {/* Regular Category Sections */}
              {categories.map((category) => {
                const CARDS_PER_ROW = 4;
                // Filter by search query and filter out pinned cards from regular sections
                const unpinnedKpis = filteredKpiData.filter(kpi => kpi.category === category && !pinnedCardIds.includes(kpi.id));
                
                if (unpinnedKpis.length === 0) return null;
                
                const sectionSupplement = KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT[
                  category as keyof typeof KPI_OBSERVABILITY_SECTION_HEADER_SUPPLEMENT
                ];
                const projectionCardId = observabilityProjectionIdForCategory(category);

                return (
                  <div key={category}>
                    <h2 className={`${ck.sectionHeading} mb-4 mt-8 first:mt-0`}>{category}</h2>
                    <div className="kpi-card-grid">
                      {unpinnedKpis.map((kpi, index) => {
                        const isLastInRow = (index + 1) % CARDS_PER_ROW === 0 || index === unpinnedKpis.length - 1;
                        const currentRowStart = Math.floor(index / CARDS_PER_ROW) * CARDS_PER_ROW;
                        const currentRowEnd = Math.min(currentRowStart + CARDS_PER_ROW, unpinnedKpis.length);
                        const cardsInCurrentRow = unpinnedKpis.slice(currentRowStart, currentRowEnd);
                        const isActiveCardInThisRow = !stickyChart && cardsInCurrentRow.some(card => card.id === activeCardId);
                        
                        return (
                          <Fragment key={kpi.id}>
                            <KPICard
                              data={kpi}
                              isActive={activeCardId === kpi.id}
                              onClick={() => setActiveCardId(kpi.id === activeCardId ? null : kpi.id)}
                              onPinToggle={(e) => togglePin(kpi.id, e)}
                              isPinned={false}
                            />
                            {/* Inline Chart (shown after the row when a card in this row is selected) */}
                            {isLastInRow && isActiveCardInThisRow && activeKPI && (
                              <div className="kpi-card-grid__expanded">
                                <KPIChart 
                                  heading={activeKPI.heading}
                                  description={activeKPI.description}
                                  chartType={activeKPI.chartType}
                                  dateRange={dateRange}
                                  customDateRange={customDateRange}
                                  sparklineData={activeKPI.sparklineData}
                                  unit={activeKPI.unit}
                                  value={activeKPI.value}
                                  {...kpiExpandedChartAxisProps(activeKPI)}
                                />
                              </div>
                            )}
                          </Fragment>
                        );
                      })}
                      {sectionSupplement && projectionCardId && !pinnedCardIds.includes(projectionCardId) ? (
                        <ObservabilityProjectionCard
                          cardId={projectionCardId}
                          title={sectionSupplement.title}
                          dateLabel={sectionSupplement.dateLabel}
                          thresholdStatus={sectionSupplement.thresholdStatus}
                          onPinToggle={(e) => togglePin(projectionCardId, e)}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
            </>
          )}
        </>
      )}
      
      {/* Interactions View */}
      {activeTab === 'Interactions' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {/* Filter Bar - Conditionally rendered */}
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
            <RecentInteractions 
              currentAgent={agentName} 
              chartView={true}
              dateRange={dateRange}
              className="mt-0 w-full"
            />
          </div>
        </div>
      )}

      {/* Testing View */}
      {activeTab === 'Testing' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
            <div className={`p-8 text-center rounded-lg w-full border ${ck.borderDefault} ${ck.bgSubtle} ${ck.text}`}>
              Testing View
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {activeTab === 'History' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {/* Filter Bar - Conditionally rendered */}
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
            <div className={`p-8 text-center rounded-lg w-full border ${ck.borderDefault} ${ck.bgSubtle} ${ck.text}`}>
              History View
            </div>
          </div>
        </div>
      )}

      {/* Configuration View */}
      {activeTab === 'Configuration' && (
        <div className={`w-full ${showFilterBar ? 'flex gap-4' : ''}`}>
          {/* Filter Bar - Conditionally rendered */}
          {showFilterBar && (
            <FilterBar agentNames={[]} hideAgents={true} hideType={true} hideStatus={true} />
          )}
          
          <div className="flex-1 min-w-0 w-full grid grid-cols-1">
             <div className={`p-8 text-center rounded-lg w-full border ${ck.borderDefault} ${ck.bgSubtle} ${ck.text}`}>
              Configuration View
            </div>
          </div>
        </div>
      )}
    </div>
  );
}