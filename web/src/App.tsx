import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
} from './pages';
import { ActionConfigureV2, AgentSessions, AgentHistory, AgentAnalytics } from './pages/agent';
import PolicyStudioV2 from './pages/agent/PolicyStudioV2';
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
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <ToastProvider>
                <ReviewProvider>
                  <Routes>
                    <Route path="/policy-studio-v2" element={<PolicyStudioV2 />} />
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<Dashboard />} />
                      {/* Sibling canvas route under the Dashboard root.
                          When the user is on / under the "Chat-based in
                          Dashboard" variation, opening the canvas
                          navigates to /eva-canvas instead of /agents/eva-canvas
                          so the Dashboard sidebar item stays highlighted
                          and Dashboard.tsx (which also renders the canvas
                          overlay for that variation) stays mounted. */}
                      <Route path="eva-canvas" element={<Dashboard />} />
                      <Route path="agents" element={<Agents />} />
                      {/* The canvas slides in as an overlay over the chat/form
                          view at /agents (see EvaCanvasOverlay). Pointing
                          /agents/eva-canvas at the same Agents element keeps
                          the chat/form mounted underneath so the open/close
                          animation has both panels available simultaneously,
                          while still preserving deep-linkability of the URL. */}
                      <Route path="agents/eva-canvas" element={<Agents />} />
                      <Route path="assistant-skills" element={<AssistantSkills />} />
                      <Route path="agents/:agentId" element={<ActionConfigureV2 />} />
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
          </DesignVariationProvider>
        </ProjectProvider>
      </AppProvider>
    </div>
  );
}

export default App;
