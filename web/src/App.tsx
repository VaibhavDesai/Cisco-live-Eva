import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { DesignVariationProvider } from './contexts/DesignVariationContext';
import { MainLayout } from './components/layout';
import { ReviewProvider } from './features/review';
import { ProjectProvider } from './projects/ProjectContext';
import { ToastProvider } from './components/shared/Toast';
import {
  Dashboard,
  Agents,
  AssistantSkills,
  Knowledge,
  KnowledgeBaseDetail,
  Connections,
  Observability,
  Settings,
  OrganizationSettings,
  ControlHubLanding,
} from './pages';
import { ActionConfigureV2, AgentStudioLanding, AgentSessions, AgentHistory, AgentAnalytics } from './pages/agent';
import PolicyStudioV2 from './pages/agent/PolicyStudioV2';
import { AgentHomeScenarioProvider } from './features/agent-home/AgentHomeScenarioContext';

/* The agent Overview lives at the canonical bare /agents/:agentId URL. Any
   lingering /studio links funnel back to it so there is a single Overview
   entry point. */
function AgentStudioRedirect() {
  const { agentId } = useParams();
  return <Navigate to={`/agents/${agentId}`} replace />;
}
import '@momentum-design/fonts/dist/css/fonts.css';
import '@momentum-design/tokens/dist/css/theme/webex/dark-stable.css';
import '@momentum-design/tokens/dist/css/theme/webex/light-stable.css';
import '@momentum-design/tokens/dist/css/components/complete.css';

function App() {
  return (
    <div className="app-shell-root">
      <AppProvider>
        <ProjectProvider>
          <DesignVariationProvider>
            <AgentHomeScenarioProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <ToastProvider>
                  <ReviewProvider>
                    <Routes>
                    <Route path="/policy-studio-v2" element={<PolicyStudioV2 />} />
                    <Route index element={<ControlHubLanding />} />
                    <Route element={<MainLayout />}>
                      <Route path="new-agent" element={<Dashboard />} />
                      {/* The legacy canvas/chat entry points are no longer part
                          of New-MVO. Keep old links recoverable by returning to
                          the canonical Home or AI Agents surface. */}
                      <Route path="new-agent/eva-canvas" element={<Navigate to="/new-agent" replace />} />
                      <Route path="eva-canvas" element={<Navigate to="/new-agent" replace />} />
                      <Route path="agents" element={<Agents />} />
                      <Route path="agents/eva-canvas" element={<Navigate to="/agents" replace />} />
                      <Route path="assistant-skills" element={<AssistantSkills />} />
                      <Route path="agents/:agentId" element={<AgentStudioLanding />} />
                      <Route path="agents/:agentId/studio" element={<AgentStudioRedirect />} />
                      <Route path="agents/:agentId/configure" element={<ActionConfigureV2 />} />
                      <Route path="agents/:agentId/sessions" element={<AgentSessions />} />
                      <Route path="agents/:agentId/history" element={<AgentHistory />} />
                      <Route path="agents/:agentId/analytics" element={<AgentAnalytics />} />
                      <Route path="observability" element={<Observability />} />
                      <Route path="kpi-dashboard" element={<Observability />} />
                      <Route path=":projectId/kpi-dashboard" element={<Observability />} />
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
            </AgentHomeScenarioProvider>
          </DesignVariationProvider>
        </ProjectProvider>
      </AppProvider>
    </div>
  );
}

export default App;
