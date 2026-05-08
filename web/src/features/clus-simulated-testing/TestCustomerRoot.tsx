import { useEffect, useLayoutEffect, useRef, useState, type ElementRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tab, TabList } from './momentum';
import { AgentConfigInstructionsTabContent } from '../agent-configuration/AgentConfigInstructionsTabContent';
import { AgentConfigProfileTabContent } from '../agent-configuration/AgentConfigProfileTabContent';
import { AgentConfigKnowledgeTabContent } from '../agent-configuration/AgentConfigKnowledgeTabContent';
import { AgentInteractionsTabContent } from './components/AgentInteractionsTabContent';
import { AgentHistoryTabContent } from './components/AgentHistoryTabContent';
import { AgentConfigConversationTabContent } from '../agent-configuration/AgentConfigConversationTabContent';
import { PageHeader, type AgentPageTab } from '../clus-kpi-dashboard/components/PageHeader';
import imgCoreAppShell from '../../assets/clus-kpi/c22556a75f9b2248e5bb2e52bdc5eea23430dc90.png';
import { hideMomentumTabListBackwardArrow } from '../clus-kpi-dashboard/hideMomentumTabListOverflowArrows';

const CONFIG_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'instructions', label: 'Instructions' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'conversation', label: 'Conversation' },
] as const;

type ConfigTabId = (typeof CONFIG_TABS)[number]['id'];

function resolvePrimaryTabFromQuery(value: string | null): AgentPageTab {
  const requested = (value ?? '').trim().toLowerCase();
  if (requested === 'configuration') return 'Configuration';
  if (requested === 'interactions') return 'Interactions';
  if (requested === 'history') return 'History';
  return 'Configuration';
}

export function TestCustomerRoot() {
  const [searchParams] = useSearchParams();
  const [primaryTab, setPrimaryTab] = useState<AgentPageTab>(() =>
    resolvePrimaryTabFromQuery(searchParams.get('primaryTab'))
  );

  useEffect(() => {
    setPrimaryTab(resolvePrimaryTabFromQuery(searchParams.get('primaryTab')));
  }, [searchParams]);

  const [configTab, setConfigTab] = useState<ConfigTabId>('profile');
  const [customerName, setCustomerName] = useState('New AI customer');
  const configTabListRef = useRef<ElementRef<typeof TabList> | null>(null);

  useLayoutEffect(() => {
    const el = configTabListRef.current;
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
  }, [configTab, primaryTab]);

  const stackedPrimary =
    primaryTab === 'Configuration' || primaryTab === 'Interactions' || primaryTab === 'History';

  return (
    <div className="clus-kpi-dashboard-root">
      <div className="clus-kpi-dashboard-bg" aria-hidden>
        <div className="clus-kpi-dashboard-bg-solid" />
        <img alt="" className="clus-kpi-dashboard-bg-img" src={imgCoreAppShell} />
      </div>

      <div className="clus-kpi-dashboard-body">
        <div
          className={`app-content-max-wide${stackedPrimary ? ' clus-kpi-simulated-testing-stacked-tabs' : ''}`}
        >
          <div className="mb-0">
            <PageHeader
              agentName={customerName}
              status="Draft"
              activeTab={primaryTab}
              onTabChange={setPrimaryTab}
              description="An AI customer role-plays a real customer so teams can practise conversations and train agents in a safe environment."
            />
          </div>

          {primaryTab === 'Configuration' && (
            <div className="clus-kpi-dashboard-main clus-kpi-dashboard-main--tight">
              <div className="agent-config-pill-tabs mt-1">
                <TabList
                  ref={configTabListRef}
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
                {configTab === 'profile' && (
                  <AgentConfigProfileTabContent
                    agentName={customerName}
                    onAgentNameChange={setCustomerName}
                  />
                )}
                {configTab === 'instructions' && <AgentConfigInstructionsTabContent />}
                {configTab === 'knowledge' && <AgentConfigKnowledgeTabContent />}
                {configTab === 'conversation' && <AgentConfigConversationTabContent />}
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
        </div>
      </div>
    </div>
  );
}
