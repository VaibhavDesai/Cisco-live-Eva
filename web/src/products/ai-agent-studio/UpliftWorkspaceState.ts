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
  contextAgentId?: string;
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
  | { type: 'set-width'; width: number | null; snap?: ProductSurfaceSnap }
  | { type: 'open-thread-history' }
  | { type: 'close-thread-history' }
  | { type: 'set-agent-panel'; open: boolean }
  | { type: 'set-context-path'; path: string; id: string; now: string }
  | { type: 'new-thread'; id: string; now: string; contextAgentId?: string }
  | { type: 'select-thread'; id: string }
  | { type: 'rename-thread'; id: string; title: string; now: string }
  | { type: 'delete-thread'; id: string; replacementId: string; now: string }
  | { type: 'update-active-thread'; snapshot: EvaSessionState; now: string };

export const WORKSPACE_STORAGE_KEY = 'uplift-ai-agent-studio-workspace-v1';
export const PRODUCT_RAIL_WIDTH = 60;
export const ASSISTANT_RAIL_WIDTH = 44;
export const ASSISTANT_RAIL_GUTTER = 16;
export const MOBILE_SHELL_BREAKPOINT = 1024;
const SPLIT_PRODUCT_WIDTH_RATIO = 0.8;
const SPLIT_ASSISTANT_RESERVED_WIDTH = 300;

const createThread = (
  id: string,
  now: string,
  snapshot: EvaSessionState | null,
  title = 'New chat',
  contextAgentId?: string,
): AssistantThread => ({
  id,
  title,
  group: 'Today',
  createdAt: now,
  updatedAt: now,
  messages: snapshot?.messages ?? [],
  creationWorkflowSnapshot: snapshot,
  ...(contextAgentId ? { contextAgentId } : {}),
});

export function getAssistantContextAgentId(path: string): string | undefined {
  const pathname = path.split(/[?#]/, 1)[0];
  const match = pathname.match(/^\/agents\/([^/]+)/);
  if (!match || match[1] === 'eva-canvas') return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

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
        productSurface: {
          ...state.productSurface,
          width: action.width,
          snap: action.snap ?? state.productSurface.snap,
        },
      };
    case 'open-thread-history':
      if (state.productSurface.threadHistoryOpen) return state;
      return {
        ...state,
        productSurface: {
          ...state.productSurface,
          temporaryAssistantOverride: false,
          previousSnap: null,
          threadHistoryOpen: true,
        },
      };
    case 'close-thread-history':
      return {
        ...state,
        productSurface: {
          ...state.productSurface,
          snap: state.productSurface.temporaryAssistantOverride
            ? state.productSurface.previousSnap ?? 'split'
            : state.productSurface.snap,
          width: state.productSurface.temporaryAssistantOverride
            ? null
            : state.productSurface.width,
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
    case 'set-context-path': {
      const contextAgentId = getAssistantContextAgentId(action.path);
      const activeThread = state.assistant.threads.find(
        thread => thread.id === state.assistant.activeThreadId,
      );
      if (activeThread?.contextAgentId === contextAgentId) {
        return {
          ...state,
          assistant: { ...state.assistant, contextPath: action.path },
        };
      }
      const matchingThread = state.assistant.threads
        .filter(thread => thread.contextAgentId === contextAgentId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
      const thread = matchingThread
        ?? createThread(action.id, action.now, null, 'New chat', contextAgentId);
      return {
        ...state,
        assistant: {
          ...state.assistant,
          contextPath: action.path,
          threads: matchingThread
            ? state.assistant.threads
            : [thread, ...state.assistant.threads],
          activeThreadId: thread.id,
        },
      };
    }
    case 'new-thread': {
      const thread = createThread(
        action.id,
        action.now,
        null,
        'New chat',
        action.contextAgentId,
      );
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
      const deletedThread = state.assistant.threads.find(thread => thread.id === action.id);
      const remaining = state.assistant.threads.filter(thread => thread.id !== action.id);
      if (state.assistant.activeThreadId !== action.id) {
        return {
          ...state,
          assistant: { ...state.assistant, threads: remaining },
        };
      }
      const replacementContextAgentId = deletedThread?.contextAgentId
        ?? getAssistantContextAgentId(state.assistant.contextPath);
      const matchingRemaining = remaining
        .filter(thread => thread.contextAgentId === replacementContextAgentId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      const replacement = matchingRemaining[0]
        ?? createThread(
          action.replacementId,
          action.now,
          null,
          'New chat',
          replacementContextAgentId,
        );
      const threads = matchingRemaining.length
        ? remaining
        : [replacement, ...remaining];
      return {
        ...state,
        assistant: {
          ...state.assistant,
          threads,
          activeThreadId: replacement.id,
        },
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
  return Math.min(
    expandedWidth,
    viewportWidth - SPLIT_ASSISTANT_RESERVED_WIDTH,
    Math.max(720, Math.round(viewportWidth * SPLIT_PRODUCT_WIDTH_RATIO)),
  );
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
