import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { V2ModeProvider } from './contexts/V2ModeContext';
import { MainLayout } from './components/layout';
import { ReviewProvider } from './features/review';
import { ToastProvider } from './components/shared/Toast';
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
import { ActionConfigureV2, AgentSessions, AgentHistory, AgentAnalytics } from './pages/agent';
import PolicyStudioV2 from './pages/agent/PolicyStudioV2';
import EvaCanvas from './features/eva/EvaCanvas';
import '@momentum-design/fonts/dist/css/fonts.css';
import '@momentum-design/tokens/dist/css/theme/webex/dark-stable.css';
import '@momentum-design/tokens/dist/css/theme/webex/light-stable.css';
import '@momentum-design/tokens/dist/css/components/complete.css';

function App() {
  return (
    <div className="app-shell-root">
      <AppProvider>
        <V2ModeProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <ToastProvider>
              <ReviewProvider>
                <Routes>
                  <Route path="/policy-studio-v2" element={<PolicyStudioV2 />} />
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="agents" element={<Agents />} />
                    <Route path="agents/eva-canvas" element={<EvaCanvas />} />
                    <Route path="assistant-skills" element={<AssistantSkills />} />
                    <Route path="agents/:agentId" element={<ActionConfigureV2 />} />
                    <Route path="agents/:agentId/configure" element={<ActionConfigureV2 />} />
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
              </ReviewProvider>
            </ToastProvider>
          </BrowserRouter>
        </V2ModeProvider>
      </AppProvider>
    </div>
  );
}

export default App;
