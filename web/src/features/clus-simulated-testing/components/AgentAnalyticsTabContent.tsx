import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
  type MouseEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Button, Option, Select, Selectlistbox, Tab, TabList } from '../momentum';
import { clusKpiAgentObservabilityHashSegment } from '../../clus-kpi-dashboard/agentHashNavigation';
import { hideMomentumTabListOverflowArrows } from '../../clus-kpi-dashboard/hideMomentumTabListOverflowArrows';
import { ObservabilityConfigurationTab } from '../../clus-kpi-dashboard/components/ObservabilityConfigurationTab';
import { ObservabilityDashboardEmptyState } from '../../clus-kpi-dashboard/components/ObservabilityDashboardEmptyState';
import { ObservabilityView } from '../../clus-kpi-dashboard/components/ObservabilityView';
import { kpiData } from '../../clus-kpi-dashboard/components/kpiData';
import { buildObservabilityKpiDataset } from '../../clus-kpi-dashboard/kpiThresholdPresentation';
import {
  getOrderedCategoryList,
  loadObservabilityConfiguration,
  OBSERVABILITY_CONFIGURATION_CHANGED_EVENT,
} from '../../clus-kpi-dashboard/observabilityConfiguration';
import { KPI_OBSERVABILITY_CATEGORIES } from '../../clus-kpi-dashboard/dashboardKpiSparklines';
import { AgentTabPanelHeader } from './AgentTabPanelHeader';
import { useProjects } from '../../../projects/useProjects';
import { buildProjectPath } from '../../../projects/project-routing';

type DatePreset = '24h' | 'week' | 'month' | '90d' | 'custom';

type Props = {
  agentName: string;
};

/** Align with ClusKpiDashboardRoot / SingleAgentView Observability sub-tabs */
type SimulatedObservabilitySubTab = 'dashboard' | 'configuration';

export function AgentAnalyticsTabContent(props: Props) {
  const { agentName } = props;
  const navigate = useNavigate();
  const { currentProjectId } = useProjects();
  const observabilitySubTabListRef = useRef<ElementRef<typeof TabList> | null>(null);
  const [observabilitySubTab, setObservabilitySubTab] =
    useState<SimulatedObservabilitySubTab>('dashboard');
  const [dateRange, setDateRange] = useState<DatePreset>('24h');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
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
    () => loadObservabilityConfiguration(agentName),
    [observabilityConfigVersion, agentName],
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

  const filteredKpiData = useMemo(
    () => buildObservabilityKpiDataset(kpiData, dateRange, observabilityConfig),
    [dateRange, observabilityConfig],
  );

  const categories = useMemo(() => {
    const ordered = getOrderedCategoryList(observabilityConfig);
    return ordered.length > 0 ? ordered : [...KPI_OBSERVABILITY_CATEGORIES];
  }, [observabilityConfig]);

  useEffect(() => {
    const visibleIds = new Set(filteredKpiData.map((k) => k.id));
    setPinnedCardIds((prev) => {
      const next = prev.filter((id) => visibleIds.has(id));
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [filteredKpiData]);

  const observabilityAgentLocation = {
    pathname: buildProjectPath(currentProjectId, '/kpi-dashboard'),
    hash: clusKpiAgentObservabilityHashSegment(agentName),
  };

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
  }, [observabilitySubTab]);

  return (
    <>
      <div className="space-y-4">
        <AgentTabPanelHeader title="Observability metrics" />

        <div
          className="flex flex-wrap items-center gap-3 justify-between"
          style={{ marginTop: '4px' }}
        >
          <div className="min-w-0 flex-1">
            <TabList
              ref={observabilitySubTabListRef}
              data-aria-label="Observability views"
              activeTabId={observabilitySubTab}
              onChange={(e: CustomEvent<{ tabId: string }>) => {
                const id = e.detail.tabId as SimulatedObservabilitySubTab;
                if (id === 'dashboard' || id === 'configuration') setObservabilitySubTab(id);
              }}
            >
              <Tab tabId="dashboard" text="Dashboard" variant="pill" />
              <Tab tabId="configuration" text="Settings" variant="pill" />
            </TabList>
          </div>
          {observabilitySubTab === 'dashboard' ? (
            <div className="shrink-0 flex items-center gap-3 flex-wrap clus-kpi-toolbar">
              <Button
                color="default"
                variant="secondary"
                size={32}
                type="button"
                onClick={() => navigate(observabilityAgentLocation)}
              >
                All agents
              </Button>
              <div className="shrink-0 w-[11rem] clus-kpi-date-select-wrap">
                <Select
                  label=""
                  dataAriaLabel="Date range"
                  value={dateRange}
                  onChange={(e: Event) => {
                    const v = (e.target as HTMLElement & { value: string }).value as DatePreset;
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
            </div>
          ) : null}
        </div>

        {observabilitySubTab === 'dashboard' &&
          (dashboardMetricsAllOff ? (
            <ObservabilityDashboardEmptyState onOpenConfiguration={() => setObservabilitySubTab('configuration')} />
          ) : (
            <DndProvider backend={HTML5Backend}>
              <ObservabilityView
                filteredKpiData={filteredKpiData}
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
            </DndProvider>
          ))}

        {observabilitySubTab === 'configuration' && (
          <div className="space-y-6">
            <ObservabilityConfigurationTab key={agentName} agentScope={agentName} />
          </div>
        )}
      </div>

      {dateDialogOpen && dateRange === 'custom' && observabilitySubTab === 'dashboard' && (
        <div
          className="clus-kpi-modal-backdrop"
          role="presentation"
          onClick={() => setDateDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="clus-agent-analytics-date-title"
            className="clus-kpi-modal-panel clus-kpi-modal-panel--date"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="clus-agent-analytics-date-title" className="clus-kpi-modal-title">
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
    </>
  );
}
