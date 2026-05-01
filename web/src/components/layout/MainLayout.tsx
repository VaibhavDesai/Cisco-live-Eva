import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../products/ai-agent-studio/components/Header';
import Sidebar from '../../products/ai-agent-studio/components/Sidebar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <>
      <div className="app--ai__bg" aria-hidden />
      <Header onMenuClick={() => setSidebarCollapsed(prev => !prev)} />
      <div className={`app app--ai${sidebarCollapsed ? ' app--ai--sidebar-collapsed' : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} />
        <main className="main">
          <Outlet />
        </main>
      </div>
      <LegacyToastBridge />
      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      <ReviewOverlay />
    </>
  );
}
