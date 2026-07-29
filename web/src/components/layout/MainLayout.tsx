import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../../products/ai-agent-studio/components/Header';
import Sidebar from '../../products/ai-agent-studio/components/Sidebar';
import AssistantControlRail from '../../products/ai-agent-studio/components/AssistantControlRail';
import {
  ASSISTANT_RAIL_GUTTER,
  ASSISTANT_RAIL_WIDTH,
  MOBILE_SHELL_BREAKPOINT,
  PRODUCT_RAIL_WIDTH,
  type ProductSurfaceSnap,
  useUpliftWorkspace,
} from '../../products/ai-agent-studio/UpliftWorkspaceContext';
import EvaChatExperience from '../../features/eva/EvaChatExperience';
import EvaCanvasOverlay from '../../features/eva/EvaCanvasOverlay';
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

const isAgentRoute = (pathname: string) => (
  /^\/agents\/[^/]+/.test(pathname)
  && !pathname.startsWith('/agents/eva-canvas')
);
const ASSISTANT_CONTENT_GUTTER = 8;

export default function MainLayout() {
  const { isCreateModalOpen, setIsCreateModalOpen } = useApp();
  const location = useLocation();
  const {
    state,
    viewportWidth,
    surfaceWidth,
    activeThread,
    setSnap,
    setDragWidth,
    snapToNearestWidth,
    closeThreadHistory,
    setAgentPanelOpen,
    setAssistantContextPath,
    createThread,
    selectThread,
    renameThread,
    deleteThread,
    updateActiveThreadSnapshot,
  } = useUpliftWorkspace();
  const dragStateRef = useRef<{ pointerId: number; width: number } | null>(null);
  const previousPathRef = useRef(location.pathname);
  const agentContext = isAgentRoute(location.pathname);
  const compact = state.productSurface.snap === 'compact';
  const agentPanelVisible = agentContext && state.productSurface.agentPanelOpen && !compact;
  const maxSurfaceWidth = Math.max(
    PRODUCT_RAIL_WIDTH,
    viewportWidth - ASSISTANT_RAIL_WIDTH - ASSISTANT_RAIL_GUTTER,
  );
  const assistantWorkspaceWidth = Math.max(
    0,
    viewportWidth
      - surfaceWidth
      - ASSISTANT_RAIL_WIDTH
      - ASSISTANT_RAIL_GUTTER
      - ASSISTANT_CONTENT_GUTTER,
  );

  useEffect(() => {
    setAssistantContextPath(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search, setAssistantContextPath]);

  useEffect(() => {
    const routeChanged = previousPathRef.current !== location.pathname;
    previousPathRef.current = location.pathname;
    if (
      routeChanged
      && state.productSurface.snap === 'compact'
      && !state.productSurface.threadHistoryOpen
    ) {
      setSnap('expanded');
    }
  }, [
    location.pathname,
    setSnap,
    state.productSurface.snap,
    state.productSurface.threadHistoryOpen,
  ]);

  const handleResizePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStateRef.current = { pointerId: event.pointerId, width: surfaceWidth };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.classList.add('uplift-workspace--resizing');
  };

  const handleResizePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    const nextWidth = Math.max(
      PRODUCT_RAIL_WIDTH,
      Math.min(maxSurfaceWidth, event.clientX),
    );
    dragStateRef.current.width = nextWidth;
    setDragWidth(nextWidth);
  };

  const finishPointerResize = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    const finalWidth = dragStateRef.current.width;
    dragStateRef.current = null;
    document.documentElement.classList.remove('uplift-workspace--resizing');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    snapToNearestWidth(finalWidth);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home') {
      event.preventDefault();
      setSnap('compact');
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setSnap('expanded');
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      snapToNearestWidth(surfaceWidth);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const snapOrder: ProductSurfaceSnap[] = viewportWidth < MOBILE_SHELL_BREAKPOINT
      ? ['compact', 'expanded']
      : ['compact', 'split', 'expanded'];
    const currentIndex = Math.max(0, snapOrder.indexOf(state.productSurface.snap));
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(snapOrder.length - 1, currentIndex + direction));
    setSnap(snapOrder[nextIndex]);
  };

  const workspaceStyle = {
    '--uplift-product-width': `${surfaceWidth}px`,
    '--uplift-assistant-width': `${assistantWorkspaceWidth}px`,
  } as CSSProperties;

  return (
    <div
      className={`uplift-workspace uplift-workspace--${state.productSurface.snap}${agentContext ? ' uplift-workspace--agent' : ''}${agentPanelVisible ? ' uplift-workspace--agent-panel-open' : ''}`}
      data-product-snap={state.productSurface.snap}
      data-assistant-workspace-width={Math.round(assistantWorkspaceWidth)}
      style={workspaceStyle}
    >
      <div className="app--ai__bg" aria-hidden />

      <section className="uplift-assistant-base app--ai" aria-label="AI Assistant workspace">
        <EvaChatExperience
          key={activeThread.id}
          shellMode
          voiceTranscribePath="/elevenlabs/transcribe"
          initialSession={activeThread.creationWorkflowSnapshot}
          onSessionChange={updateActiveThreadSnapshot}
          threadPanelOpen={state.productSurface.threadHistoryOpen}
          threads={state.assistant.threads}
          activeThreadId={state.assistant.activeThreadId}
          onSelectThread={selectThread}
          onNewThread={createThread}
          onRenameThread={renameThread}
          onDeleteThread={deleteThread}
          onThreadPanelClose={closeThreadHistory}
          onProductNavigate={() => setSnap('expanded')}
        />
        <EvaCanvasOverlay />
      </section>

      <section
        className="uplift-product-surface"
        aria-label="AI Agent Studio product surface"
      >
        {!compact && (
          <Header
            embedded
            onMenuClick={() => setSnap('compact')}
          />
        )}
        <div className="uplift-product-surface__body">
          <Sidebar
            collapsed={compact}
            agentPanelOpen={state.productSurface.agentPanelOpen}
            surfaceCompact={compact}
            onAgentPanelOpenChange={setAgentPanelOpen}
          />
          {!compact && (
            <main className="main">
              <Outlet />
            </main>
          )}
        </div>

        <div
          className="uplift-product-surface__resize-handle"
          role="separator"
          aria-label="Resize AI Agent Studio workspace"
          aria-orientation="vertical"
          aria-valuemin={PRODUCT_RAIL_WIDTH}
          aria-valuemax={maxSurfaceWidth}
          aria-valuenow={Math.round(surfaceWidth)}
          tabIndex={0}
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={finishPointerResize}
          onPointerCancel={finishPointerResize}
          onKeyDown={handleResizeKeyDown}
          onBlur={() => snapToNearestWidth(surfaceWidth)}
        >
          <span aria-hidden />
        </div>
      </section>

      <AssistantControlRail />
      <LegacyToastBridge />
      {isCreateModalOpen && (
        <CreateAgentModal onClose={() => setIsCreateModalOpen(false)} />
      )}
      <ReviewOverlay />
    </div>
  );
}
