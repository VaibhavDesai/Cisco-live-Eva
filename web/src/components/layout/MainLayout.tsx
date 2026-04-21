import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../../products/ai-agent-studio/components/Header';
import Sidebar from '../../products/ai-agent-studio/components/Sidebar';
import { ToastProvider, useToast } from '../shared/Toast';
import CreateAgentModal from '../agents/CreateAgentModal';
import { useApp } from '../../contexts/AppContext';
import { ReviewOverlay } from '../../features/review';

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

  return (
    <ToastProvider>
      <div className="app--ai__bg" aria-hidden />
      <Header />
      <div className="app app--ai">
        <Sidebar />
        <main className="main">
          <Outlet />
        </main>
      </div>
      <LegacyToastBridge />
      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      <ReviewOverlay />
    </ToastProvider>
  );
}
