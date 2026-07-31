import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  readEvaSessionState,
  type EvaSessionState,
} from '../../features/eva/evaFormConfig';
import {
  ASSISTANT_RAIL_GUTTER,
  ASSISTANT_RAIL_WIDTH,
  MOBILE_SHELL_BREAKPOINT,
  PRODUCT_RAIL_WIDTH,
  WORKSPACE_STORAGE_KEY,
  getProductSurfaceSnapWidth,
  getAssistantContextAgentId,
  parseStoredUpliftWorkspaceState,
  upliftWorkspaceReducer,
  type AssistantThread,
  type ProductSurfaceSnap,
  type UpliftWorkspaceState,
} from './UpliftWorkspaceState';

export * from './UpliftWorkspaceState';

const readStoredState = (): UpliftWorkspaceState => {
  try {
    return parseStoredUpliftWorkspaceState(
      window.sessionStorage.getItem(WORKSPACE_STORAGE_KEY),
      readEvaSessionState(),
    );
  } catch {
    return parseStoredUpliftWorkspaceState(null, readEvaSessionState());
  }
};

interface UpliftWorkspaceContextValue {
  state: UpliftWorkspaceState;
  viewportWidth: number;
  surfaceWidth: number;
  activeThread: AssistantThread;
  visibleThreads: AssistantThread[];
  setSnap: (snap: ProductSurfaceSnap) => void;
  setDragWidth: (width: number | null) => void;
  openThreadHistory: () => void;
  closeThreadHistory: () => void;
  setAgentPanelOpen: (open: boolean) => void;
  setAssistantContextPath: (path: string) => void;
  createThread: () => void;
  selectThread: (id: string | number) => void;
  renameThread: (id: string | number, title: string) => void;
  deleteThread: (id: string | number) => void;
  updateActiveThreadSnapshot: (snapshot: EvaSessionState) => void;
}

const UpliftWorkspaceContext = createContext<UpliftWorkspaceContextValue | null>(null);

export function UpliftWorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(upliftWorkspaceReducer, undefined, readStoredState);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* The workspace stays usable in memory when sessionStorage is unavailable. */
    }
  }, [state]);

  const activeThread = state.assistant.threads.find(
    thread => thread.id === state.assistant.activeThreadId,
  ) ?? state.assistant.threads[0];
  const visibleThreads = state.assistant.threads.filter(
    thread => thread.contextAgentId === activeThread.contextAgentId,
  );
  const maxSurfaceWidth = getProductSurfaceSnapWidth('expanded', viewportWidth);
  const surfaceWidth = state.productSurface.width === null
    ? getProductSurfaceSnapWidth(state.productSurface.snap, viewportWidth)
    : Math.max(
      PRODUCT_RAIL_WIDTH,
      Math.min(maxSurfaceWidth, state.productSurface.width),
    );

  const setSnap = useCallback((snap: ProductSurfaceSnap) => {
    dispatch({
      type: 'set-snap',
      snap: viewportWidth < MOBILE_SHELL_BREAKPOINT && snap === 'split' ? 'expanded' : snap,
    });
  }, [viewportWidth]);
  const setDragWidth = useCallback((width: number | null) => {
    if (width === null) {
      dispatch({ type: 'set-width', width });
      return;
    }
    const maxWidth = getProductSurfaceSnapWidth('expanded', viewportWidth);
    const constrainedWidth = Math.max(
      PRODUCT_RAIL_WIDTH,
      Math.min(maxWidth, width),
    );
    const snap: ProductSurfaceSnap = constrainedWidth <= PRODUCT_RAIL_WIDTH
      ? 'compact'
      : constrainedWidth >= maxWidth
        ? 'expanded'
        : 'split';
    dispatch({ type: 'set-width', width: constrainedWidth, snap });
  }, [viewportWidth]);
  const openThreadHistory = useCallback(() => dispatch({ type: 'open-thread-history' }), []);
  const closeThreadHistory = useCallback(() => dispatch({ type: 'close-thread-history' }), []);
  const setAgentPanelOpen = useCallback((open: boolean) => {
    dispatch({ type: 'set-agent-panel', open });
  }, []);
  const setAssistantContextPath = useCallback((path: string) => {
    dispatch({
      type: 'set-context-path',
      path,
      id: `assistant-thread-${Date.now()}`,
      now: new Date().toISOString(),
    });
  }, []);
  const createNewThread = useCallback(() => {
    const now = new Date().toISOString();
    dispatch({
      type: 'new-thread',
      id: `assistant-thread-${Date.now()}`,
      now,
      contextAgentId: getAssistantContextAgentId(state.assistant.contextPath),
    });
  }, [state.assistant.contextPath]);
  const selectThread = useCallback((id: string | number) => {
    dispatch({ type: 'select-thread', id: String(id) });
  }, []);
  const renameThread = useCallback((id: string | number, title: string) => {
    dispatch({
      type: 'rename-thread',
      id: String(id),
      title,
      now: new Date().toISOString(),
    });
  }, []);
  const deleteThread = useCallback((id: string | number) => {
    dispatch({
      type: 'delete-thread',
      id: String(id),
      replacementId: `assistant-thread-${Date.now()}`,
      now: new Date().toISOString(),
    });
  }, []);
  const updateActiveThreadSnapshot = useCallback((snapshot: EvaSessionState) => {
    dispatch({ type: 'update-active-thread', snapshot, now: new Date().toISOString() });
  }, []);

  const value = useMemo<UpliftWorkspaceContextValue>(() => ({
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
    createThread: createNewThread,
    selectThread,
    renameThread,
    deleteThread,
    updateActiveThreadSnapshot,
  }), [
    activeThread,
    closeThreadHistory,
    createNewThread,
    deleteThread,
    openThreadHistory,
    renameThread,
    selectThread,
    setAgentPanelOpen,
    setAssistantContextPath,
    setDragWidth,
    setSnap,
    state,
    surfaceWidth,
    updateActiveThreadSnapshot,
    visibleThreads,
    viewportWidth,
  ]);

  return (
    <UpliftWorkspaceContext.Provider value={value}>
      {children}
    </UpliftWorkspaceContext.Provider>
  );
}

export function useUpliftWorkspace() {
  const context = useContext(UpliftWorkspaceContext);
  if (!context) {
    throw new Error('useUpliftWorkspace must be used within UpliftWorkspaceProvider');
  }
  return context;
}
