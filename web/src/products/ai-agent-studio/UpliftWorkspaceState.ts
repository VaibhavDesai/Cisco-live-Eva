import type {
  EvaSessionState,
  EvaThread,
} from '../../features/eva/evaFormConfig';

export type ProductSurfaceSnap = 'compact' | 'split' | 'expanded';

export interface ProductSurfaceState {
  snap: ProductSurfaceSnap;
  width: number | null;
  temporaryAssistantOverride: boolean;
  previousSnap: ProductSurfaceSnap | null;
  agentPanelOpen: boolean;
  threadHistoryOpen: boolean;
}

export interface AssistantThread extends EvaThread {
  createdAt: string;
  updatedAt: string;
  messages: EvaSessionState['messages'];
  creationWorkflowSnapshot: EvaSessionState | null;
}

export interface AssistantWorkspaceState {
  threads: AssistantThread[];
  activeThreadId: string;
  contextPath: string;
}

export interface UpliftWorkspaceState {
  version: 1;
  productSurface: ProductSurfaceState;
  assistant: AssistantWorkspaceState;
}

export type WorkspaceAction =
  | { type: 'set-snap'; snap: ProductSurfaceSnap }
  | { type: 'set-width'; width: number | null }
  | { type: 'open-thread-history' }
  | { type: 'close-thread-history' }
  | { type: 'set-agent-panel'; open: boolean }
  | { type: 'set-context-path'; path: string }
  | { type: 'new-thread'; id: string; now: string }
  | { type: 'select-thread'; id: string }
  | { type: 'rename-thread'; id: string; title: string; now: string }
  | { type: 'delete-thread'; id: string; replacementId: string; now: string }
  | { type: 'update-active-thread'; snapshot: EvaSessionState; now: string };

export const WORKSPACE_STORAGE_KEY = 'uplift-ai-agent-studio-workspace-v1';
export const PRODUCT_RAIL_WIDTH = 60;
export const ASSISTANT_RAIL_WIDTH = 44;
export const ASSISTANT_RAIL_GUTTER = 16;
export const MOBILE_SHELL_BREAKPOINT = 1024;

const createThread = (
  id: string,
  now: string,
  snapshot: EvaSessionState | null,
  title = 'New chat',
): AssistantThread => ({
  id,
  title,
  group: 'Today',
  createdAt: now,
  updatedAt: now,
  messages: snapshot?.messages ?? [],
  creationWorkflowSnapshot: snapshot,
});

export function createInitialUpliftWorkspaceState(
  migratedSession: EvaSessionState | null = null,
  now = new Date().toISOString(),
): UpliftWorkspaceState {
  const initialThread = createThread(
    'assistant-thread-initial',
    now,
    migratedSession,
    migratedSession?.messages?.length ? 'AI Agent Studio setup' : 'New chat',
  );

  return {
    version: 1,
    productSurface: {
      snap: 'split',
      width: null,
      temporaryAssistantOverride: false,
      previousSnap: null,
      agentPanelOpen: true,
      threadHistoryOpen: false,
    },
    assistant: {
      threads: [initialThread],
      activeThreadId: initialThread.id,
      contextPath: '/agents',
    },
  };
}

export function parseStoredUpliftWorkspaceState(
  raw: string | null,
  migratedSession: EvaSessionState | null = null,
  now = new Date().toISOString(),
): UpliftWorkspaceState {
  if (!raw) return createInitialUpliftWorkspaceState(migratedSession, now);
  try {
    const parsed = JSON.parse(raw) as Partial<UpliftWorkspaceState>;
    if (
      parsed.version !== 1
      || !parsed.productSurface
      || !parsed.assistant
      || !Array.isArray(parsed.assistant.threads)
      || parsed.assistant.threads.length === 0
    ) {
      return createInitialUpliftWorkspaceState(migratedSession, now);
    }
    return parsed as UpliftWorkspaceState;
  } catch {
    return createInitialUpliftWorkspaceState(migratedSession, now);
  }
}

export function upliftWorkspaceReducer(
  state: UpliftWorkspaceState,
  action: WorkspaceAction,
): UpliftWorkspaceState {
  switch (action.type) {
    case 'set-snap':
      return {
        ...state,
        productSurface: {
          ...state.productSurface,
          snap: action.snap,
          width: null,
          temporaryAssistantOverride: false,
          previousSnap: null,
        },
      };
    case 'set-width':
      return {
        ...state,
        productSurface: { ...state.productSurface, width: action.width },
      };
    case 'open-thread-history':
      if (state.productSurface.threadHistoryOpen) return state;
      return {
        ...state,
        productSurface: {
          ...state.productSurface,
          snap: 'compact',
          width: null,
          temporaryAssistantOverride: true,
          previousSnap: state.productSurface.snap,
          threadHistoryOpen: true,
        },
      };
    case 'close-thread-history':
      return {
        ...state,
        productSurface: {
          ...state.productSurface,
          snap: state.productSurface.previousSnap ?? 'split',
          width: null,
          temporaryAssistantOverride: false,
          previousSnap: null,
          threadHistoryOpen: false,
        },
      };
    case 'set-agent-panel':
      return {
        ...state,
        productSurface: { ...state.productSurface, agentPanelOpen: action.open },
      };
    case 'set-context-path':
      return {
        ...state,
        assistant: { ...state.assistant, contextPath: action.path },
      };
    case 'new-thread': {
      const thread = createThread(action.id, action.now, null);
      return {
        ...state,
        assistant: {
          ...state.assistant,
          threads: [thread, ...state.assistant.threads],
          activeThreadId: thread.id,
        },
      };
    }
    case 'select-thread':
      if (!state.assistant.threads.some(thread => thread.id === action.id)) return state;
      return {
        ...state,
        assistant: { ...state.assistant, activeThreadId: action.id },
      };
    case 'rename-thread':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          threads: state.assistant.threads.map(thread => (
            thread.id === action.id
              ? { ...thread, title: action.title, updatedAt: action.now }
              : thread
          )),
        },
      };
    case 'delete-thread': {
      const remaining = state.assistant.threads.filter(thread => thread.id !== action.id);
      const threads = remaining.length
        ? remaining
        : [createThread(action.replacementId, action.now, null)];
      const activeThreadId = state.assistant.activeThreadId === action.id
        ? threads[0].id
        : state.assistant.activeThreadId;
      return {
        ...state,
        assistant: { ...state.assistant, threads, activeThreadId },
      };
    }
    case 'update-active-thread':
      return {
        ...state,
        assistant: {
          ...state.assistant,
          threads: state.assistant.threads.map(thread => (
            thread.id === state.assistant.activeThreadId
              ? {
                ...thread,
                updatedAt: action.now,
                messages: action.snapshot.messages,
                creationWorkflowSnapshot: action.snapshot,
              }
              : thread
          )),
        },
      };
    default:
      return state;
  }
}

export function getProductSurfaceSnapWidth(
  snap: ProductSurfaceSnap,
  viewportWidth: number,
): number {
  const expandedWidth = Math.max(
    PRODUCT_RAIL_WIDTH,
    viewportWidth - ASSISTANT_RAIL_WIDTH - ASSISTANT_RAIL_GUTTER,
  );
  if (snap === 'compact') return PRODUCT_RAIL_WIDTH;
  if (viewportWidth < MOBILE_SHELL_BREAKPOINT || snap === 'expanded') return expandedWidth;
  return Math.min(expandedWidth, Math.max(720, Math.round(viewportWidth * 0.7)));
}

export function getNearestProductSurfaceSnap(
  width: number,
  viewportWidth: number,
): ProductSurfaceSnap {
  const snaps: ProductSurfaceSnap[] = viewportWidth < MOBILE_SHELL_BREAKPOINT
    ? ['compact', 'expanded']
    : ['compact', 'split', 'expanded'];
  return snaps.reduce((nearest, candidate) => (
    Math.abs(getProductSurfaceSnapWidth(candidate, viewportWidth) - width)
      < Math.abs(getProductSurfaceSnapWidth(nearest, viewportWidth) - width)
      ? candidate
      : nearest
  ), snaps[0]);
}
