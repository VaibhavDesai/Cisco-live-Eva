import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastProvider, useToast } from '../shared/Toast';
import CreateAgentModal from '../agents/CreateAgentModal';
import { useApp } from '../../contexts/AppContext';

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
      <div className="app-background" aria-hidden />
      <Header />
      <div className="app">
        <Sidebar />
        <main className="main">
          <Outlet />
        </main>
      </div>
      <LegacyToastBridge />
      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </ToastProvider>
  );
}
