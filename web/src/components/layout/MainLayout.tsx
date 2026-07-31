import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../products/ai-agent-studio/components/Sidebar';
import AssistantControlRail from '../../products/ai-agent-studio/components/AssistantControlRail';
import { Icon } from '../../icons/Icon';
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
import { AgentOverviewProvider } from '../../features/agent-overview/AgentOverviewContext';

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
const KEYBOARD_RESIZE_STEP = 24;
const KEYBOARD_RESIZE_LARGE_STEP = 96;
const getNextAssistantWorkspaceSnap = (snap: ProductSurfaceSnap): ProductSurfaceSnap => {
  if (snap === 'split') return 'compact';
  if (snap === 'compact') return 'expanded';
  return 'split';
};

export default function MainLayout() {
  const { isCreateModalOpen, setIsCreateModalOpen } = useApp();
  const location = useLocation();
  const {
    state,
    viewportWidth,
    surfaceWidth,
    activeThread,
    visibleThreads,
    setSnap,
    setDragWidth,
    openThreadHistory,
    closeThreadHistory,
    setAgentPanelOpen,
    setAssistantContextPath,
    createThread,
    selectThread,
    renameThread,
    deleteThread,
    updateActiveThreadSnapshot,
  } = useUpliftWorkspace();
  const dragStateRef = useRef<{
    pointerId: number;
    width: number;
    handle: HTMLDivElement;
  } | null>(null);
  const previousPathRef = useRef(location.pathname);
  const preserveAssistantOnNextRouteRef = useRef(false);
  const agentContext = isAgentRoute(location.pathname);
  const compact = state.productSurface.snap === 'compact';
  const showAssistantSideEmptyState =
    state.productSurface.snap !== 'expanded'
    && activeThread.messages.length === 0;
  const assistantWorkspaceSizeActionLabel = state.productSurface.snap === 'split'
    ? 'Make AI Assistant full screen'
    : state.productSurface.snap === 'compact'
      ? 'Collapse AI Assistant workspace'
      : 'Restore default AI Assistant workspace';
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
    const preserveAssistant = preserveAssistantOnNextRouteRef.current;
    if (routeChanged) {
      preserveAssistantOnNextRouteRef.current = false;
    }
    if (
      routeChanged
      && !preserveAssistant
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

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      const nextWidth = Math.max(
        PRODUCT_RAIL_WIDTH,
        Math.min(maxSurfaceWidth, event.clientX),
      );
      dragStateRef.current.width = nextWidth;
      setDragWidth(nextWidth);
    };

    const finishPointerResize = (event: PointerEvent) => {
      if (dragStateRef.current?.pointerId !== event.pointerId) return;
      const { width, handle } = dragStateRef.current;
      dragStateRef.current = null;
      document.documentElement.classList.remove('uplift-workspace--resizing');
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      setDragWidth(width);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishPointerResize);
    window.addEventListener('pointercancel', finishPointerResize);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishPointerResize);
      window.removeEventListener('pointercancel', finishPointerResize);
      document.documentElement.classList.remove('uplift-workspace--resizing');
    };
  }, [maxSurfaceWidth, setDragWidth]);

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragStateRef.current = {
      pointerId: event.pointerId,
      width: surfaceWidth,
      handle: event.currentTarget,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    document.documentElement.classList.add('uplift-workspace--resizing');
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Home') {
      event.preventDefault();
      setDragWidth(PRODUCT_RAIL_WIDTH);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setDragWidth(maxSurfaceWidth);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const step = event.shiftKey ? KEYBOARD_RESIZE_LARGE_STEP : KEYBOARD_RESIZE_STEP;
    setDragWidth(surfaceWidth + direction * step);
  };

  const workspaceStyle = {
    '--uplift-product-width': `${surfaceWidth}px`,
    '--uplift-assistant-width': `${assistantWorkspaceWidth}px`,
  } as CSSProperties;

  return (
    <AgentOverviewProvider>
      <div
        className={`uplift-workspace uplift-workspace--${state.productSurface.snap}${agentContext ? ' uplift-workspace--agent' : ''}${agentPanelVisible ? ' uplift-workspace--agent-panel-open' : ''}`}
        data-product-snap={state.productSurface.snap}
        data-assistant-workspace-width={Math.round(assistantWorkspaceWidth)}
        style={workspaceStyle}
      >
      <div className="app--ai__bg" aria-hidden />

      <header className="uplift-assistant-header" aria-label="AI Assistant account controls">
        <span className="uplift-assistant-header__avatar">
          <img
            src="https://i.pravatar.cc/64?img=12"
            alt="Austen Jones"
          />
          <span className="uplift-assistant-header__presence" aria-label="Available" />
        </span>
        <button
          type="button"
          className="uplift-assistant-header__search"
          aria-label="Search"
          title="Search"
        >
          <Icon name="search-bold" size={20} />
        </button>
      </header>

      <section className="uplift-assistant-base app--ai" aria-label="AI Assistant workspace">
        <header className="uplift-assistant-top-menu" aria-label="AI Assistant chat controls">
          <button
            type="button"
            className="uplift-assistant-top-menu__button"
            aria-label={state.productSurface.threadHistoryOpen ? 'Close chat history' : 'Open chat history'}
            title={state.productSurface.threadHistoryOpen ? 'Close chat history' : 'Open chat history'}
            onClick={state.productSurface.threadHistoryOpen ? closeThreadHistory : openThreadHistory}
          >
            <Icon name="list-menu" weight="bold" size={20} />
          </button>
          <strong className="uplift-assistant-top-menu__label">Chats</strong>
          <span className="uplift-assistant-top-menu__divider" aria-hidden />
          <button
            type="button"
            className="uplift-assistant-top-menu__button"
            aria-label="Start a new chat"
            title="Start a new chat"
            onClick={() => {
              createThread();
              closeThreadHistory();
            }}
          >
            <Icon name="edit" weight="bold" size={20} />
          </button>
          <span className="uplift-assistant-top-menu__spacer" aria-hidden />
          <button
            type="button"
            className="uplift-assistant-top-menu__button"
            aria-label={assistantWorkspaceSizeActionLabel}
            title={assistantWorkspaceSizeActionLabel}
            onClick={() => setSnap(getNextAssistantWorkspaceSnap(state.productSurface.snap))}
          >
            <Icon name="side-panel" weight="bold" size={20} />
          </button>
        </header>
        <EvaChatExperience
          key={activeThread.id}
          shellMode
          voiceTranscribePath="/elevenlabs/transcribe"
          initialSession={activeThread.creationWorkflowSnapshot}
          onSessionChange={updateActiveThreadSnapshot}
          threadPanelOpen={state.productSurface.threadHistoryOpen}
          threads={visibleThreads}
          activeThreadId={state.assistant.activeThreadId}
          onSelectThread={selectThread}
          onNewThread={createThread}
          onRenameThread={renameThread}
          onDeleteThread={deleteThread}
          onThreadPanelClose={closeThreadHistory}
          onProductNavigate={options => {
            if (options?.keepAssistantVisible && viewportWidth >= MOBILE_SHELL_BREAKPOINT) {
              preserveAssistantOnNextRouteRef.current = true;
              setSnap('split');
              return;
            }
            setSnap('expanded');
          }}
          sideEmptyState={showAssistantSideEmptyState}
        />
        <EvaCanvasOverlay />
      </section>

      <section
        className="uplift-product-surface"
        aria-label="AI Agent Studio product surface"
      >
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
          aria-valuetext={`${Math.round(surfaceWidth)} pixels wide`}
          tabIndex={0}
          onPointerDown={handleResizePointerDown}
          onKeyDown={handleResizeKeyDown}
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
    </AgentOverviewProvider>
  );
}
