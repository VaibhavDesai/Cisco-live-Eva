import { useEffect, useState, type ReactNode } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import Tabs, { Tab } from '../../components/shared/Tabs';
import { TestingOverviewPanel } from '../../features/clus-simulated-testing/components/TestingOverviewPanel';
import { TestingScenariosSection } from '../../features/clus-simulated-testing/components/TestingScenariosSection';
import { TestingResultsTab } from '../../features/clus-simulated-testing/components/TestingResultsTab';
import { TestingChangeLogTab } from '../../features/clus-simulated-testing/components/TestingChangeLogTab';
import { SimulatedTestingResultsProvider } from '../../features/clus-simulated-testing/simulated-testing-results-context';
import { ThemeModeProvider, useThemeMode } from '../../app/ThemeContext';
import { publicAssetUrl } from '../../app/publicAsset';
import { IconProvider, ThemeProvider } from '@momentum-design/components/react';
import AgentMonitorHeader from './AgentMonitorHeader';

type TestingTab = 'overview' | 'scenarios' | 'results' | 'changelog';

function BuilderTestingProviders({ children }: { children: ReactNode }) {
  const { themeClass } = useThemeMode();

  return (
    <ThemeProvider themeclass={themeClass}>
      <IconProvider
        iconSet="custom-icons"
        url={publicAssetUrl('icons').replace(/\/$/, '')}
        fileExtension="svg"
      >
        {children}
      </IconProvider>
    </ThemeProvider>
  );
}

export default function AgentAnalytics() {
  const { agentId } = useParams();
  const { agents, currentAgent, selectAgent } = useApp();
  const [activeTab, setActiveTab] = useState<TestingTab>('overview');

  const agent = agentId ? agents[agentId] : undefined;

  useEffect(() => {
    if (agent && currentAgent?.id !== agent.id) {
      selectAgent(agent.id);
    }
  }, [agent, currentAgent?.id, selectAgent]);

  if (!agent) return <Navigate to="/agents" replace />;

  return (
    <div className="primary-content agent-monitor-page agent-workspace-page">
      <AgentMonitorHeader agent={agent} activeTab="analytics" />

      <div className="secondary-content agent-testing-page agent-testing-page--builder agent-monitor-content">
        <h1 className="agent-workspace-section-title">Testing</h1>
        <ThemeModeProvider>
          <BuilderTestingProviders>
            <SimulatedTestingResultsProvider>
              <Tabs variant="pill" aria-label="Testing sections">
                <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</Tab>
                <Tab active={activeTab === 'scenarios'} onClick={() => setActiveTab('scenarios')}>Scenarios</Tab>
                <Tab active={activeTab === 'results'} onClick={() => setActiveTab('results')}>Results</Tab>
                <Tab active={activeTab === 'changelog'} onClick={() => setActiveTab('changelog')}>Change log</Tab>
              </Tabs>

              <div className="agent-testing-page__cloned-panel">
                {activeTab === 'overview' && <TestingOverviewPanel />}
                {activeTab === 'scenarios' && <TestingScenariosSection />}
                {activeTab === 'results' && <TestingResultsTab />}
                {activeTab === 'changelog' && <TestingChangeLogTab />}
              </div>
            </SimulatedTestingResultsProvider>
          </BuilderTestingProviders>
        </ThemeModeProvider>
      </div>
    </div>
  );
}
