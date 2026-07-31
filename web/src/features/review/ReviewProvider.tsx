import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, isReviewConfigured } from './supabaseClient';
import type { Anchor, Comment, Thread, ThreadWithComments } from './types';

const DISPLAY_NAME_STORAGE_KEY = 'review.displayName';
const REVIEW_QUERY_FLAG = 'review';
const REVIEW_SESSION_FLAG = 'review.enabled';

const isSessionEnabled = (): boolean => {
  try {
    return window.sessionStorage.getItem(REVIEW_SESSION_FLAG) === '1';
  } catch {
    return false;
  }
};

const setSessionEnabled = (): void => {
  try {
    window.sessionStorage.setItem(REVIEW_SESSION_FLAG, '1');
  } catch {
    // ignore
  }
};

const isTextEntryTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest('input, textarea, select, [contenteditable="true"]');
};

type PickerMode = 'idle' | 'picking';

interface ReviewContextValue {
  configured: boolean;
  enabled: boolean;
  active: boolean;
  pickerMode: PickerMode;
  displayName: string | null;
  threads: ThreadWithComments[];
  selectedThreadId: string | null;
  pendingAnchor: (Anchor & { clientX: number; clientY: number }) | null;
  route: string;
  toggleActive: () => void;
  startPicking: () => void;
  cancelPicking: () => void;
  setPendingAnchor: (
    anchor: (Anchor & { clientX: number; clientY: number }) | null,
  ) => void;
  selectThread: (id: string | null) => void;
  createThread: (anchor: Anchor, body: string) => Promise<Thread | null>;
  addReply: (threadId: string, body: string) => Promise<Comment | null>;
  setThreadStatus: (
    threadId: string,
    status: 'open' | 'resolved',
  ) => Promise<void>;
  ensureDisplayName: () => Promise<string | null>;
  setDisplayName: (name: string) => void;
  editDisplayName: () => void;
  nameModalOpen: boolean;
  submitNameModal: (name: string) => void;
  cancelNameModal: () => void;
  commentsModalOpen: boolean;
  commentsModalLoading: boolean;
  allThreads: ThreadWithComments[];
  openCommentsModal: () => void;
  closeCommentsModal: () => void;
  openThread: (thread: {
    id: string;
    route: string;
  }) => void;
}

const ReviewContext = createContext<ReviewContextValue | null>(null);

export const useReview = (): ReviewContextValue => {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used inside <ReviewProvider>');
  return ctx;
};

const readStoredName = (): string | null => {
  try {
    const v = window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
};

const writeStoredName = (name: string): void => {
  try {
    window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, name);
  } catch {
    // ignore
  }
};

const mergeComment = (
  list: ThreadWithComments[],
  comment: Comment,
): ThreadWithComments[] =>
  list.map((t) => {
    if (t.id !== comment.thread_id) return t;
    if (t.comments.some((c) => c.id === comment.id)) return t;
    const comments = [...t.comments, comment].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    );
    return { ...t, comments };
  });

const mergeThread = (
  list: ThreadWithComments[],
  thread: Thread,
): ThreadWithComments[] => {
  const existing = list.find((t) => t.id === thread.id);
  if (existing) {
    return list.map((t) => (t.id === thread.id ? { ...t, ...thread } : t));
  }
  return [...list, { ...thread, comments: [] }];
};

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const configured = isReviewConfigured();

  const [sessionEnabled, setSessionEnabledState] = useState<boolean>(() =>
    isSessionEnabled(),
  );

  const enabled = useMemo(() => {
    if (!configured) return false;
    const params = new URLSearchParams(location.search);
    if (params.get(REVIEW_QUERY_FLAG) === '1') return true;
    return sessionEnabled;
  }, [configured, location.search, sessionEnabled]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get(REVIEW_QUERY_FLAG) === '1' && !sessionEnabled) {
      setSessionEnabled();
      setSessionEnabledState(true);
    }
  }, [location.search, sessionEnabled]);

  const route = location.pathname;

  const [active, setActive] = useState(false);
  const [displayName, setDisplayNameState] = useState<string | null>(() =>
    readStoredName(),
  );
  const [threads, setThreads] = useState<ThreadWithComments[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [pendingAnchor, setPendingAnchor] = useState<
    (Anchor & { clientX: number; clientY: number }) | null
  >(null);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const nameResolverRef = useRef<((name: string | null) => void) | null>(null);

  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsModalLoading, setCommentsModalLoading] = useState(false);
  const [allThreads, setAllThreads] = useState<ThreadWithComments[]>([]);
  const pendingSelectRef = useRef<string | null>(null);

  const loadIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) setActive(false);
  }, [enabled]);

  useEffect(() => {
    setSelectedThreadId(null);
    setPendingAnchor(null);
  }, [route]);

  // Picker is engaged automatically whenever comment mode is active and
  // nothing is blocking the cursor (no draft comment, no open thread, no
  // name-editor modal showing).
  const pickerMode: PickerMode =
    active &&
    !pendingAnchor &&
    !selectedThreadId &&
    !nameModalOpen &&
    !commentsModalOpen
      ? 'picking'
      : 'idle';

  useEffect(() => {
    if (!enabled || !supabase) {
      setThreads([]);
      return;
    }
    const myLoadId = ++loadIdRef.current;
    let cancelled = false;

    (async () => {
      const { data: threadRows, error: tErr } = await supabase
        .from('threads')
        .select('*')
        .eq('route', route)
        .order('created_at', { ascending: true });
      if (cancelled || myLoadId !== loadIdRef.current) return;
      if (tErr) {
        console.error('[review] failed to load threads', tErr);
        setThreads([]);
        return;
      }
      const ids = (threadRows || []).map((t) => t.id);
      if (ids.length === 0) {
        setThreads([]);
        return;
      }
      const { data: commentRows, error: cErr } = await supabase
        .from('comments')
        .select('*')
        .in('thread_id', ids)
        .order('created_at', { ascending: true });
      if (cancelled || myLoadId !== loadIdRef.current) return;
      if (cErr) {
        console.error('[review] failed to load comments', cErr);
      }
      const byThread = new Map<string, Comment[]>();
      (commentRows || []).forEach((c: Comment) => {
        const arr = byThread.get(c.thread_id) || [];
        arr.push(c);
        byThread.set(c.thread_id, arr);
      });
      setThreads(
        (threadRows as Thread[]).map((t) => ({
          ...t,
          comments: byThread.get(t.id) || [],
        })),
      );

      // If the user opened a thread from the "All comments" modal and we had
      // to navigate to land on its route, select it now that data has loaded.
      const pending = pendingSelectRef.current;
      if (pending && (threadRows || []).some((t) => t.id === pending)) {
        pendingSelectRef.current = null;
        setSelectedThreadId(pending);
      }
    })();

    const channel = supabase
      .channel(`review-${route}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads', filter: `route=eq.${route}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setThreads((prev) => mergeThread(prev, payload.new as Thread));
            setAllThreads((prev) => mergeThread(prev, payload.new as Thread));
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as Thread).id;
            setThreads((prev) => prev.filter((t) => t.id !== id));
            setAllThreads((prev) => prev.filter((t) => t.id !== id));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const c = payload.new as Comment;
          setThreads((prev) =>
            prev.some((t) => t.id === c.thread_id) ? mergeComment(prev, c) : prev,
          );
          setAllThreads((prev) =>
            prev.some((t) => t.id === c.thread_id) ? mergeComment(prev, c) : prev,
          );
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [enabled, route]);

  const setDisplayName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 64);
    if (!trimmed) return;
    writeStoredName(trimmed);
    setDisplayNameState(trimmed);
  }, []);

  const ensureDisplayName = useCallback((): Promise<string | null> => {
    if (displayName) return Promise.resolve(displayName);
    // Resolve any in-flight prompt as null so we don't leak promises.
    if (nameResolverRef.current) {
      nameResolverRef.current(null);
      nameResolverRef.current = null;
    }
    return new Promise<string | null>((resolve) => {
      nameResolverRef.current = resolve;
      setNameModalOpen(true);
    });
  }, [displayName]);

  const submitNameModal = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 64);
    if (!trimmed) return;
    writeStoredName(trimmed);
    setDisplayNameState(trimmed);
    setNameModalOpen(false);
    const resolver = nameResolverRef.current;
    nameResolverRef.current = null;
    resolver?.(trimmed);
  }, []);

  const cancelNameModal = useCallback(() => {
    setNameModalOpen(false);
    const resolver = nameResolverRef.current;
    nameResolverRef.current = null;
    resolver?.(null);
  }, []);

  const editDisplayName = useCallback(() => {
    // Forces the name modal open even when a name already exists. No awaiter
    // is attached, so the calling flow does not block.
    setNameModalOpen(true);
  }, []);

  const loadAllThreads = useCallback(async () => {
    if (!supabase) return;
    setCommentsModalLoading(true);
    try {
      const { data: threadRows, error: tErr } = await supabase
        .from('threads')
        .select('*')
        .order('created_at', { ascending: false });
      if (tErr) {
        console.error('[review] failed to load all threads', tErr);
        setAllThreads([]);
        return;
      }
      const ids = (threadRows || []).map((t) => t.id);
      let commentsByThread = new Map<string, Comment[]>();
      if (ids.length > 0) {
        const { data: commentRows, error: cErr } = await supabase
          .from('comments')
          .select('*')
          .in('thread_id', ids)
          .order('created_at', { ascending: true });
        if (cErr) console.error('[review] failed to load all comments', cErr);
        (commentRows || []).forEach((c: Comment) => {
          const arr = commentsByThread.get(c.thread_id) || [];
          arr.push(c);
          commentsByThread.set(c.thread_id, arr);
        });
      }
      setAllThreads(
        (threadRows as Thread[]).map((t) => ({
          ...t,
          comments: commentsByThread.get(t.id) || [],
        })),
      );
    } finally {
      setCommentsModalLoading(false);
    }
  }, []);

  const openCommentsModal = useCallback(() => {
    setCommentsModalOpen(true);
    void loadAllThreads();
  }, [loadAllThreads]);

  const closeCommentsModal = useCallback(() => {
    setCommentsModalOpen(false);
  }, []);

  const openThread = useCallback(
    (target: { id: string; route: string }) => {
      setCommentsModalOpen(false);
      if (location.pathname === target.route) {
        setSelectedThreadId(target.id);
      } else {
        pendingSelectRef.current = target.id;
        navigate(target.route);
      }
    },
    [location.pathname, navigate],
  );

  const toggleActive = useCallback(async () => {
    if (!configured) return;
    if (!active) {
      const name = await ensureDisplayName();
      if (!name) return;
      // Turning the toggle on also flips the session-level "review enabled"
      // flag so overlays/pins render for the rest of this tab session, even
      // if the user never visited with ?review=1.
      if (!sessionEnabled) {
        setSessionEnabled();
        setSessionEnabledState(true);
      }
      setActive(true);
    } else {
      setActive(false);
      setPendingAnchor(null);
      setSelectedThreadId(null);
    }
  }, [active, configured, ensureDisplayName, sessionEnabled]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'c') return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.repeat || isTextEntryTarget(event.target)) return;
      event.preventDefault();
      void toggleActive();
    };

    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, [toggleActive]);

  const startPicking = useCallback(() => {
    if (!active) return;
    setSelectedThreadId(null);
    setPendingAnchor(null);
  }, [active]);

  const cancelPicking = useCallback(() => {
    setPendingAnchor(null);
  }, []);

  const selectThread = useCallback((id: string | null) => {
    setSelectedThreadId(id);
    if (id) setPendingAnchor(null);
  }, []);

  const createThread = useCallback(
    async (anchor: Anchor, body: string): Promise<Thread | null> => {
      if (!supabase) return null;
      const name = await ensureDisplayName();
      if (!name) return null;
      const trimmed = body.trim().slice(0, 4000);
      if (!trimmed) return null;
      const { data: inserted, error } = await supabase
        .from('threads')
        .insert({
          route,
          selector: anchor.selector,
          x_ratio: anchor.xRatio,
          y_ratio: anchor.yRatio,
          element_label: anchor.label,
        })
        .select('*')
        .single();
      if (error || !inserted) {
        console.error('[review] createThread failed', error);
        return null;
      }
      const { data: commentRow, error: cErr } = await supabase
        .from('comments')
        .insert({ thread_id: inserted.id, author_name: name, body: trimmed })
        .select('*')
        .single();
      if (cErr) {
        console.error('[review] create first comment failed', cErr);
      }
      setThreads((prev) => {
        const next = mergeThread(prev, inserted as Thread);
        if (commentRow) return mergeComment(next, commentRow as Comment);
        return next;
      });
      return inserted as Thread;
    },
    [ensureDisplayName, route],
  );

  const addReply = useCallback(
    async (threadId: string, body: string): Promise<Comment | null> => {
      if (!supabase) return null;
      const name = await ensureDisplayName();
      if (!name) return null;
      const trimmed = body.trim().slice(0, 4000);
      if (!trimmed) return null;
      const { data, error } = await supabase
        .from('comments')
        .insert({ thread_id: threadId, author_name: name, body: trimmed })
        .select('*')
        .single();
      if (error || !data) {
        console.error('[review] addReply failed', error);
        return null;
      }
      setThreads((prev) => mergeComment(prev, data as Comment));
      return data as Comment;
    },
    [ensureDisplayName],
  );

  const setThreadStatus = useCallback(
    async (threadId: string, status: 'open' | 'resolved') => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('threads')
        .update({ status })
        .eq('id', threadId)
        .select('*')
        .single();
      if (error) {
        console.error('[review] setThreadStatus failed', error);
        return;
      }
      if (data) setThreads((prev) => mergeThread(prev, data as Thread));
    },
    [],
  );

  const value: ReviewContextValue = {
    configured,
    enabled,
    active,
    pickerMode,
    displayName,
    threads,
    selectedThreadId,
    pendingAnchor,
    route,
    toggleActive,
    startPicking,
    cancelPicking,
    setPendingAnchor,
    selectThread,
    createThread,
    addReply,
    setThreadStatus,
    ensureDisplayName,
    setDisplayName,
    editDisplayName,
    nameModalOpen,
    submitNameModal,
    cancelNameModal,
    commentsModalOpen,
    commentsModalLoading,
    allThreads,
    openCommentsModal,
    closeCommentsModal,
    openThread,
  };

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
};
