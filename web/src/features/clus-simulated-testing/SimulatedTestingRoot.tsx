import { useEffect, useLayoutEffect, useRef, useState, type ElementRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Button, Tab, TabList } from './momentum';
import { TestingOverviewTab } from './components/TestingOverviewTab';
import { TestingScenariosSection } from './components/TestingScenariosSection';
import { TestingChangeLogTab } from './components/TestingChangeLogTab';
import { TestingResultsTab } from './components/TestingResultsTab';
import { SimulatedTestingResultsProvider } from './simulated-testing-results-context';
import { SecurityTabContent } from './components/SecurityTabContent';
import { AgentConfigInstructionsTabContent } from '../agent-configuration/AgentConfigInstructionsTabContent';
import { AgentConfigProfileTabContent } from '../agent-configuration/AgentConfigProfileTabContent';
import { AgentConfigKnowledgeTabContent } from '../agent-configuration/AgentConfigKnowledgeTabContent';
import { AgentInteractionsTabContent } from './components/AgentInteractionsTabContent';
import { AgentHistoryTabContent } from './components/AgentHistoryTabContent';
import { AgentAnalyticsTabContent } from './components/AgentAnalyticsTabContent';
import { AgentConfigActionTabContent } from './components/AgentConfigActionTabContent';
import { AgentConfigConversationTabContent } from '../agent-configuration/AgentConfigConversationTabContent';
import { PageHeader, type AgentPageTab } from '../clus-kpi-dashboard/components/PageHeader';
import imgCoreAppShell from '../../assets/clus-kpi/c22556a75f9b2248e5bb2e52bdc5eea23430dc90.png';
import { ck } from '../clus-kpi-dashboard/clus-kpi-theme';
import { hideMomentumTabListBackwardArrow } from '../clus-kpi-dashboard/hideMomentumTabListOverflowArrows';
import type { SimulatedDatePreset } from './simulated-testing-data';

const CONFIG_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'security', label: 'Security' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'action', label: 'Actions' },
  { id: 'conversation', label: 'Conversation' },
] as const;

type ConfigTabId = (typeof CONFIG_TABS)[number]['id'];

function resolvePrimaryTabFromQuery(value: string | null): AgentPageTab {
  const requested = (value ?? '').trim().toLowerCase();
  if (requested === 'configuration') return 'Configuration';
  if (requested === 'interactions') return 'Interactions';
  if (requested === 'history') return 'History';
  if (requested === 'analytics' || requested === 'observability') return 'Testing';
  return 'Testing';
}

export function SimulatedTestingRoot() {
  const [searchParams] = useSearchParams();
  const [primaryTab, setPrimaryTab] = useState<AgentPageTab>(() =>
    resolvePrimaryTabFromQuery(searchParams.get('primaryTab'))
  );
  useEffect(() => {
    setPrimaryTab(resolvePrimaryTabFromQuery(searchParams.get('primaryTab')));
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'results' | 'changelog'>('overview');
  const [configTab, setConfigTab] = useState<ConfigTabId>('profile');
  const [configAgentName, setConfigAgentName] = useState('Billing Support');
  const testingTabListRef = useRef<ElementRef<typeof TabList> | null>(null);
  const [dateRange, setDateRange] = useState<SimulatedDatePreset>('week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  useLayoutEffect(() => {
    const el = testingTabListRef.current;
    if (!el) return;

    const hide = () => hideMomentumTabListBackwardArrow(el);
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
  }, [activeTab, primaryTab]);

  return (
    <div className="clus-kpi-dashboard-root">
      <div className="clus-kpi-dashboard-bg" aria-hidden>
        <div className="clus-kpi-dashboard-bg-solid" />
        <img alt="" className="clus-kpi-dashboard-bg-img" src={imgCoreAppShell} />
      </div>

      <div className="clus-kpi-dashboard-body">
        <div
          className={`app-content-max-wide${primaryTab === 'Testing' ? ' app-content-max-wide--testing-fluid' : ''}${
            primaryTab === 'Testing' ||
            primaryTab === 'Configuration' ||
            primaryTab === 'Interactions' ||
            primaryTab === 'History' ||
            primaryTab === 'Observability'
              ? ' clus-kpi-simulated-testing-stacked-tabs'
              : ''
          }`}
        >
          <SimulatedTestingResultsProvider>
          <div className="mb-0">
            <PageHeader
              agentName={configAgentName}
              status="Live"
              description="Handles billing and account inquiries • Last updated 2 hours ago"
              activeTab={primaryTab}
              showObservabilityTab={false}
              onTabChange={setPrimaryTab}
            />
          </div>

        {primaryTab === 'Testing' && (
            <div className="clus-kpi-dashboard-main clus-kpi-dashboard-main--tight">
              <TabList
                ref={testingTabListRef}
                data-aria-label="Simulated testing views"
                activeTabId={activeTab}
                onChange={(e: CustomEvent<{ tabId: string }>) => {
                  const id = e.detail.tabId as 'overview' | 'scenarios' | 'results' | 'changelog';
                  setActiveTab(id);
                }}
              >
                <Tab tabId="overview" text="Overview" variant="pill" />
                <Tab tabId="scenarios" text="Scenarios" variant="pill" />
                <Tab tabId="results" text="Results" variant="pill" />
                <Tab tabId="changelog" text="Change log" variant="pill" />
              </TabList>

              <div className="min-h-[12rem]">
                {/* Keep mounted so user-created scenarios and dialog state survive pill-tab switches */}
                <div hidden={activeTab !== 'overview'}>
                  <TestingOverviewTab
                    dateRange={dateRange}
                    customDateRange={customDateRange}
                    onDateRangeChange={(e: Event) => {
                      const v = (e.target as HTMLElement & { value: string }).value as SimulatedDatePreset;
                      if (v === 'custom') {
                        setDateRange('custom');
                        setDateDialogOpen(true);
                      } else {
                        setDateRange(v);
                        setCustomDateRange(undefined);
                        setDateDialogOpen(false);
                      }
                    }}
                  />
                </div>
                <div hidden={activeTab !== 'scenarios'}>
                  <TestingScenariosSection />
                </div>
                <div hidden={activeTab !== 'results'}>
                  <TestingResultsTab />
                </div>
                <div hidden={activeTab !== 'changelog'}>
                  <TestingChangeLogTab />
                </div>
              </div>
            </div>
        )}

        {primaryTab === 'Configuration' && (
          <div className="clus-kpi-dashboard-main clus-kpi-dashboard-main--tight">
            <div className="agent-config-pill-tabs mt-1">
              <TabList
                data-aria-label="Configuration tabs"
                activeTabId={configTab}
                onChange={(e: CustomEvent<{ tabId: string }>) => {
                  setConfigTab(e.detail.tabId as ConfigTabId);
                }}
              >
                {CONFIG_TABS.map((t) => (
                  <Tab key={t.id} tabId={t.id} text={t.label} variant="pill" />
                ))}
              </TabList>
            </div>

            <div className="min-h-[12rem]">
              {configTab === 'security' && <SecurityTabContent />}
              {configTab === 'profile' && (
                <AgentConfigProfileTabContent agentName={configAgentName} onAgentNameChange={setConfigAgentName} />
              )}
              {configTab === 'instructions' && <AgentConfigInstructionsTabContent />}
              {configTab === 'knowledge' && <AgentConfigKnowledgeTabContent />}
              {configTab === 'action' && <AgentConfigActionTabContent />}
              {configTab === 'conversation' && <AgentConfigConversationTabContent />}
              {configTab !== 'security' &&
                configTab !== 'profile' &&
                configTab !== 'instructions' &&
                configTab !== 'knowledge' &&
                configTab !== 'action' &&
                configTab !== 'conversation' && (
                <p className={`text-sm ${ck.textMuted}`}>
                  {CONFIG_TABS.find((t) => t.id === configTab)?.label} settings will appear here.
                </p>
              )}
            </div>
          </div>
        )}

        {primaryTab === 'Interactions' && (
          <div className="clus-kpi-dashboard-main clus-kpi-dashboard-main--tight">
            <div className="min-h-[12rem]">
              <AgentInteractionsTabContent />
            </div>
          </div>
        )}

        {primaryTab === 'History' && (
          <div className="clus-kpi-dashboard-main clus-kpi-dashboard-main--tight">
            <div className="min-h-[12rem]">
              <AgentHistoryTabContent />
            </div>
          </div>
        )}

        {primaryTab === 'Observability' && (
          <div className="clus-kpi-dashboard-main clus-kpi-dashboard-main--tight">
            <div className="min-h-[12rem]">
              <AgentAnalyticsTabContent agentName={configAgentName} />
            </div>
          </div>
        )}
          </SimulatedTestingResultsProvider>
        </div>
      </div>

      {dateDialogOpen && dateRange === 'custom' && (
        <div
          className="clus-kpi-modal-backdrop"
          role="presentation"
          onClick={() => setDateDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="clus-simulated-date-title"
            className="clus-kpi-modal-panel clus-kpi-modal-panel--date"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="clus-simulated-date-title" className="clus-kpi-modal-title">
              Select date range
            </h4>
            <div className="clus-kpi-date-custom">
              <Button
                color="default"
                variant="secondary"
                size={32}
                onClick={() => {
                  setDateRange('week');
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
    </div>
  );
}
