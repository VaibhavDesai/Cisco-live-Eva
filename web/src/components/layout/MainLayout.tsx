import { useEffect, useState, type CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../products/ai-agent-studio/components/Header';
import Sidebar from '../../products/ai-agent-studio/components/Sidebar';
import DialogOsHeader from '../../products/ai-agent-studio/components/DialogOsHeader';
import DialogOsSidebar from '../../products/ai-agent-studio/components/DialogOsSidebar';
import AiAssistantPanel from '../../products/ai-agent-studio/components/AiAssistantPanel';
import { useToast } from '../shared/Toast';
import CreateAgentModal from '../agents/CreateAgentModal';
import QuickCreateAgentModal from '../agents/QuickCreateAgentModal';
import { useApp } from '../../contexts/AppContext';
import { ReviewOverlay } from '../../features/review';
import { useAgentHomeScenario } from '../../features/agent-home/AgentHomeScenarioContext';
import AgentStudioShaderBackground from '../../motion/AgentStudioShaderBackground';
import {
  AgentStudioWelcomeProvider,
  agentStudioWelcomeDurationMs,
  agentStudioWelcomeFinalStartMs,
  agentStudioWelcomeTitleStartMs,
  useAgentStudioWelcome,
} from '../../motion/agentStudioWelcome';
import '../../motion/agentStudioWelcome.css';

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
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isQuickCreateModalOpen,
    setIsQuickCreateModalOpen,
  } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [agentPanelOpen, setAgentPanelOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const location = useLocation();
  const { mode: homeScenarioMode } = useAgentHomeScenario();

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
  const isAgentTesting =
    isAgentContext && /^\/agents\/[^/]+\/analytics\/?$/.test(location.pathname);
  const isObservability = /^\/observability\/?$/.test(location.pathname);
  const isNewAgent = /^\/new-agent\/?$/.test(location.pathname);
  const isDialogOsLanding = isNewAgent && homeScenarioMode === 'first-time';
  const isProtectedLandingRoute = isNewAgent;
  const welcome = useAgentStudioWelcome(isDialogOsLanding);
  const usesStudioAurora =
    isAgentsList || isAgentOverview || isAgentConfigure || isAgentTesting || isObservability || isNewAgent;

  useEffect(() => {
    if (isAgentContext) {
      setSidebarCollapsed(true);
      setAgentPanelOpen(true);
    }
  }, [isAgentContext]);

  useEffect(() => {
    if (isObservability) setSidebarCollapsed(false);
  }, [isObservability]);

  const welcomeStyle = isDialogOsLanding
    ? ({
        '--agent-studio-welcome-duration': `${agentStudioWelcomeDurationMs}ms`,
        '--agent-studio-welcome-title-start': `${agentStudioWelcomeTitleStartMs}ms`,
        '--agent-studio-welcome-final-start': `${agentStudioWelcomeFinalStartMs}ms`,
      } as CSSProperties)
    : undefined;

  return (
    <AgentStudioWelcomeProvider
      value={{
        enabled: isDialogOsLanding,
        phase: welcome.phase,
        reducedMotion: welcome.reducedMotion,
      }}
    >
      <div
        className={`app--ai__bg${usesStudioAurora ? ' app--ai__bg--studio-aurora' : ''}${isProtectedLandingRoute ? '' : ' app--ai__bg--minimized'}`}
        data-motion-system={isDialogOsLanding ? 'v1' : undefined}
        data-agent-studio-welcome={isDialogOsLanding ? welcome.phase : undefined}
        aria-hidden
      />
      {isDialogOsLanding && <AgentStudioShaderBackground mode="home" />}
      {isProtectedLandingRoute ? (
        <DialogOsHeader
          onMenuClick={() => setSidebarCollapsed(prev => !prev)}
          onAiClick={() => setAiPanelOpen(prev => !prev)}
        />
      ) : (
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
      )}
      <div
        className={`app app--ai${sidebarCollapsed ? ' app--ai--sidebar-collapsed' : ''}${isAgentContext ? ' app--ai--agent-context' : ''}${usesStudioAurora ? ' app--ai--studio-aurora' : ''}${isAgentContext && agentPanelOpen ? ' app--ai--agent-panel-open' : ''}${aiPanelOpen ? ' app--ai--assistant-open' : ''}`}
        data-motion-system={isDialogOsLanding ? 'v1' : undefined}
        data-dialogos-landing={isProtectedLandingRoute ? 'true' : undefined}
        data-agent-studio-welcome={isDialogOsLanding ? welcome.phase : undefined}
        onAnimationEnd={isDialogOsLanding ? welcome.onAnimationEnd : undefined}
        style={welcomeStyle}
      >
        {isProtectedLandingRoute ? (
          <DialogOsSidebar
            collapsed={sidebarCollapsed}
            agentPanelOpen={agentPanelOpen}
            onAgentPanelOpenChange={setAgentPanelOpen}
          />
        ) : (
          <Sidebar
            collapsed={sidebarCollapsed}
            agentPanelOpen={agentPanelOpen}
            onAgentPanelOpenChange={setAgentPanelOpen}
          />
        )}
        <main className="main">
          <Outlet />
        </main>
      </div>
      <AiAssistantPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      <LegacyToastBridge />
      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      {isQuickCreateModalOpen && (
        <QuickCreateAgentModal onClose={() => setIsQuickCreateModalOpen(false)} />
      )}
      <ReviewOverlay />
    </AgentStudioWelcomeProvider>
  );
}
