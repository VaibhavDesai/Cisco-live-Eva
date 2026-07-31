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
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const location = useLocation();

  /* The agent-scoped side navigation needs its labels, so auto-expand the
     sidebar when drilling into a specific agent (excludes the /agents list
     and the /agents/eva-canvas overlay). Users can still collapse manually. */
  const isAgentContext =
    /^\/agents\/[^/]+/.test(location.pathname) &&
    !location.pathname.startsWith('/agents/eva-canvas');

  useEffect(() => {
    if (isAgentContext) setSidebarCollapsed(false);
  }, [isAgentContext]);

  return (
    <>
      <div className="app--ai__bg" aria-hidden />
      <Header
        onMenuClick={() => setSidebarCollapsed(prev => !prev)}
        onAiClick={() => setAiPanelOpen(prev => !prev)}
      />
      <div className={`app app--ai${sidebarCollapsed ? ' app--ai--sidebar-collapsed' : ''}${aiPanelOpen ? ' app--ai--assistant-open' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} />
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
