import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { MainLayout } from './components/layout';
import {
  Dashboard,
  Agents,
  AssistantSkills,
  Knowledge,
  KnowledgeBaseDetail,
  Connections,
  Settings,
  OrganizationSettings,
} from './pages';
import { AgentConfigure, ActionConfigureV2, AgentSessions, AgentHistory, AgentAnalytics } from './pages/agent';
import '@momentum-design/fonts/dist/css/fonts.css';
import '@momentum-design/tokens/dist/css/theme/webex/dark-stable.css';
import '@momentum-design/tokens/dist/css/components/complete.css';

function ConfigureSwitch() {
  const { flowVersion } = useApp();
  return flowVersion === 'v2' ? <ActionConfigureV2 /> : <AgentConfigure />;
}

function App() {
  return (
    <div className="mds-theme-stable-darkWebex app-shell-root">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="agents" element={<Agents />} />
              <Route path="assistant-skills" element={<AssistantSkills />} />
              <Route path="agents/:agentId" element={<ConfigureSwitch />} />
              <Route path="agents/:agentId/configure" element={<ConfigureSwitch />} />
              <Route path="agents/:agentId/sessions" element={<AgentSessions />} />
              <Route path="agents/:agentId/history" element={<AgentHistory />} />
              <Route path="agents/:agentId/analytics" element={<AgentAnalytics />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="knowledge/:kbId" element={<KnowledgeBaseDetail />} />
              <Route path="connections" element={<Connections />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/organization" element={<OrganizationSettings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;
