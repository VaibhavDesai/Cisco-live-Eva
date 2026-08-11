import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../products/ai-agent-studio/components/Header';
import Sidebar from '../../products/ai-agent-studio/components/Sidebar';
import AiAssistantPanel from '../../products/ai-agent-studio/components/AiAssistantPanel';
import { useToast } from '../shared/Toast';
import CreateAgentModal from '../agents/CreateAgentModal';
import { useApp } from '../../contexts/AppContext';
import { ReviewOverlay } from '../../features/review';

/* Bridges the legacy `AppContext.toast` event bus onto the shared
   `ToastProvider` (now hoisted to App root). Lives inside the layout because
   the legacy bus is only used by in-app flows that all route through here. */
function LegacyToastBridge() {
  const { toast } = useApp();
  const { notify } = useToast();

  useEffect(() => {
    if (toast) {
      notify({ message: toast.message, type: toast.type, duration: 3000 });
    }
  }, [toast, notify]);

  return null;
}

export default function MainLayout() {
  const { isCreateModalOpen, setIsCreateModalOpen } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const location = useLocation();

  /* Agent pages use the floating Uplift progress rail. Open it when entering
     agent context, while preserving its manual collapsed state between the
     agent's Overview, Configure, and Monitor routes. */
  const isAgentContext =
    /^\/agents\/[^/]+/.test(location.pathname) &&
    !location.pathname.startsWith('/agents/eva-canvas');
  const isAgentOverview =
    isAgentContext && /^\/agents\/[^/]+\/?$/.test(location.pathname);
  const isAgentsList = /^\/agents\/?$/.test(location.pathname);
  const isAgentConfigure =
    isAgentContext && /^\/agents\/[^/]+\/configure\/?$/.test(location.pathname);
  const usesStudioAurora = isAgentsList || isAgentOverview || isAgentConfigure;

  useEffect(() => {
    if (isAgentContext) {
      setSidebarCollapsed(false);
      setAgentPanelOpen(true);
    }
  }, [isAgentContext]);

  return (
    <>
      <div
        className={`app--ai__bg${usesStudioAurora ? ' app--ai__bg--studio-aurora' : ''}`}
        aria-hidden
      />
      <Header
        onMenuClick={() => {
          if (isAgentContext) {
            setAgentPanelOpen(prev => !prev);
          } else {
            setSidebarCollapsed(prev => !prev);
          }
        }}
        onAiClick={() => setAiPanelOpen(prev => !prev)}
      />
      <div
        className={`app app--ai${sidebarCollapsed ? ' app--ai--sidebar-collapsed' : ''}${isAgentContext ? ' app--ai--agent-context' : ''}${usesStudioAurora ? ' app--ai--studio-aurora' : ''}${isAgentContext && agentPanelOpen ? ' app--ai--agent-panel-open' : ''}${aiPanelOpen ? ' app--ai--assistant-open' : ''}`}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          agentPanelOpen={agentPanelOpen}
          onAgentPanelOpenChange={setAgentPanelOpen}
        />
        <main className="main">
          <Outlet />
        </main>
      </div>
      <AiAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      <LegacyToastBridge />
      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      <ReviewOverlay />
    </>
  );
}
