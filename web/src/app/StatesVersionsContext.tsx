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
import { useSearchParams } from 'react-router-dom';

const ENABLED_KEY = 'builder-states-versions-enabled';

export type UiVariant = { id: string; label: string };

interface StatesVersionsContextValue {
  toolbarEnabled: boolean;
  setToolbarEnabled: (value: boolean) => void;
  versions: UiVariant[];
  activeVersionId: string;
  setActiveVersionId: (id: string) => void;
  addVersion: (label?: string) => string;
  renameVersion: (id: string, label: string) => void;
  states: UiVariant[];
  activeStateId: string;
  setActiveStateId: (id: string) => void;
  addState: (label: string) => string;
  renameState: (id: string, label: string) => void;
  /** Replaces the full state list (e.g. when entering a screen that defines multiple UI states). */
  replaceStates: (next: UiVariant[], activeStateId?: string) => void;
  /** Replaces the full version list (e.g. KPI dashboard: Default vs no Command Centre). */
  replaceVersions: (next: UiVariant[], activeVersionId?: string) => void;
  reset: () => void;
}

const StatesVersionsContext = createContext<StatesVersionsContextValue | null>(null);

const DEFAULT_VERSIONS: UiVariant[] = [{ id: 'v1', label: 'v1' }];
/** Single default; screens that need multiple states call `replaceStates` on mount (e.g. Knowledge). */
const DEFAULT_STATES: UiVariant[] = [{ id: 'default', label: 'Default' }];

/** Knowledge: Default vs Empty — registered from `KnowledgeScreen` via `replaceStates`. */
export const KNOWLEDGE_STATES: UiVariant[] = [
  { id: 'default', label: 'Default' },
  { id: 'empty', label: 'Empty' },
];

/** CLUS KPI dashboard — registered from `ClusKpiDashboardScreen` via `replaceVersions`. */
export const CLUS_KPI_DASHBOARD_VERSIONS: UiVariant[] = [
  { id: 'clus-kpi-default', label: 'Default' },
  { id: 'clus-kpi-command-centre', label: 'Command centre' },
];

/** AI transparency settings — registered from `AgentAiTransparencySettingsScreen` via `replaceVersions`. */
export const AI_TRANSPARENCY_SETTINGS_VERSIONS: UiVariant[] = [
  { id: 'ai-transparency-default', label: 'Default' },
  { id: 'ai-transparency-inline', label: 'Inline' },
];

function readStoredToolbarEnabled(): boolean {
  try {
    const stored = localStorage.getItem(ENABLED_KEY);
    // Default hidden; opt in via header toggle (persists as 'true')
    return stored === 'true';
  } catch {
    return false;
  }
}

function slugFromLabel(label: string): string {
  const s = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return s || `variant-${Date.now()}`;
}

function nextVersionLabel(versions: UiVariant[]): string {
  const nums = versions
    .map((v) => {
      const m = /^v(\d+)$/i.exec(v.label.trim());
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 1;
  return `v${max + 1}`;
}

export function StatesVersionsProvider({ children }: { children: ReactNode }) {
  const [toolbarEnabled, setToolbarEnabledState] = useState(readStoredToolbarEnabled);
  const [versions, setVersions] = useState<UiVariant[]>(DEFAULT_VERSIONS);
  const [activeVersionId, setActiveVersionId] = useState(DEFAULT_VERSIONS[0].id);
  const [states, setStates] = useState<UiVariant[]>(DEFAULT_STATES);
  const [activeStateId, setActiveStateId] = useState(DEFAULT_STATES[0].id);

  const versionsRef = useRef(versions);
  const statesRef = useRef(states);
  versionsRef.current = versions;
  statesRef.current = states;

  useEffect(() => {
    if (!versions.some((v) => v.id === activeVersionId)) {
      setActiveVersionId(versions[0]?.id ?? DEFAULT_VERSIONS[0].id);
    }
  }, [versions, activeVersionId]);

  useEffect(() => {
    if (!states.some((s) => s.id === activeStateId)) {
      setActiveStateId(states[0]?.id ?? DEFAULT_STATES[0].id);
    }
  }, [states, activeStateId]);

  useEffect(() => {
    document.body.dataset.activeVersion = activeVersionId;
    document.body.dataset.activeState = activeStateId;
  }, [activeVersionId, activeStateId]);

  const setToolbarEnabled = useCallback((value: boolean) => {
    setToolbarEnabledState(value);
    try {
      localStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
    } catch {
      /* ignore */
    }
  }, []);

  const addVersion = useCallback((label?: string): string => {
    let newId = '';
    setVersions((prev) => {
      const nextLabel = label?.trim() || nextVersionLabel(prev);
      const baseId = slugFromLabel(nextLabel);
      const existing = new Set(prev.map((v) => v.id));
      newId = baseId;
      let n = 0;
      while (existing.has(newId)) {
        n += 1;
        newId = `${baseId}-${n}`;
      }
      return [...prev, { id: newId, label: nextLabel }];
    });
    setActiveVersionId(newId);
    return newId;
  }, []);

  const renameVersion = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setVersions((prev) => prev.map((v) => (v.id === id ? { ...v, label: trimmed } : v)));
  }, []);

  const selectVersion = useCallback((id: string) => {
    if (versionsRef.current.some((v) => v.id === id)) {
      setActiveVersionId(id);
    }
  }, []);

  const addState = useCallback((label: string): string => {
    const trimmed = label.trim();
    if (!trimmed) return '';
    let newId = '';
    setStates((prev) => {
      const baseId = slugFromLabel(trimmed);
      const existing = new Set(prev.map((s) => s.id));
      newId = baseId;
      let n = 0;
      while (existing.has(newId)) {
        n += 1;
        newId = `${baseId}-${n}`;
      }
      return [...prev, { id: newId, label: trimmed }];
    });
    setActiveStateId(newId);
    return newId;
  }, []);

  const renameState = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setStates((prev) => prev.map((s) => (s.id === id ? { ...s, label: trimmed } : s)));
  }, []);

  const replaceStates = useCallback((next: UiVariant[], activeId?: string) => {
    if (!next.length) return;
    setStates(next);
    const resolved =
      activeId && next.some((s) => s.id === activeId)
        ? activeId
        : next[0].id;
    setActiveStateId(resolved);
  }, []);

  const replaceVersions = useCallback((next: UiVariant[], activeId?: string) => {
    if (!next.length) return;
    setVersions(next);
    const resolved =
      activeId && next.some((v) => v.id === activeId)
        ? activeId
        : next[0].id;
    setActiveVersionId(resolved);
  }, []);

  const selectState = useCallback((id: string) => {
    if (statesRef.current.some((s) => s.id === id)) {
      setActiveStateId(id);
    }
  }, []);

  const reset = useCallback(() => {
    setVersions(DEFAULT_VERSIONS);
    setActiveVersionId(DEFAULT_VERSIONS[0].id);
    setStates(DEFAULT_STATES);
    setActiveStateId(DEFAULT_STATES[0].id);
  }, []);

  const value = useMemo(
    (): StatesVersionsContextValue => ({
      toolbarEnabled,
      setToolbarEnabled,
      versions,
      activeVersionId,
      setActiveVersionId: selectVersion,
      addVersion,
      renameVersion,
      states,
      activeStateId,
      setActiveStateId: selectState,
      addState,
      renameState,
      replaceStates,
      replaceVersions,
      reset,
    }),
    [
      toolbarEnabled,
      setToolbarEnabled,
      versions,
      activeVersionId,
      selectVersion,
      addVersion,
      renameVersion,
      states,
      activeStateId,
      selectState,
      addState,
      renameState,
      replaceStates,
      replaceVersions,
      reset,
    ],
  );

  return (
    <StatesVersionsContext.Provider value={value}>{children}</StatesVersionsContext.Provider>
  );
}

export function useStatesVersions(): StatesVersionsContextValue {
  const ctx = useContext(StatesVersionsContext);
  if (!ctx) {
    throw new Error('useStatesVersions must be used within StatesVersionsProvider');
  }
  return ctx;
}

/**
 * Syncs active version and state to/from URL search params (?v= and ?s=).
 * Must be rendered inside a react-router-dom Router so useSearchParams works.
 * Default values (v1 / default) are omitted from the URL to keep links clean.
 *
 * Read-from-URL only fires once per mount (ref-guarded) to prevent a feedback
 * loop where writing the URL causes the apply effect to re-fire and override
 * a user click (e.g. clicking v1 while ?v=v2 is in the URL).
 */
export function VersionStateUrlSync() {
  const {
    versions,
    activeVersionId,
    setActiveVersionId,
    states,
    activeStateId,
    setActiveStateId,
  } = useStatesVersions();
  const [searchParams, setSearchParams] = useSearchParams();

  const targetVersion = searchParams.get('v');
  const targetState = searchParams.get('s');

  // Guards so URL→state sync only fires once per mount, not on every re-render.
  const versionApplied = useRef(false);
  const stateApplied = useRef(false);

  // Apply ?v= from URL — waits until that version is registered, then applies once.
  useEffect(() => {
    if (versionApplied.current) return;
    if (!targetVersion) { versionApplied.current = true; return; }
    if (versions.some((v) => v.id === targetVersion)) {
      versionApplied.current = true;
      if (activeVersionId !== targetVersion) setActiveVersionId(targetVersion);
    }
  }, [targetVersion, versions, activeVersionId, setActiveVersionId]);

  // Apply ?s= from URL — same once-only pattern.
  useEffect(() => {
    if (stateApplied.current) return;
    if (!targetState) { stateApplied.current = true; return; }
    if (states.some((s) => s.id === targetState)) {
      stateApplied.current = true;
      if (activeStateId !== targetState) setActiveStateId(targetState);
    }
  }, [targetState, states, activeStateId, setActiveStateId]);

  // Write active version to URL — omit when it's the first registered version (v1 globally, or screen-specific).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const defaultVersionId = versions[0]?.id ?? DEFAULT_VERSIONS[0].id;
        if (activeVersionId === defaultVersionId) {
          next.delete('v');
        } else {
          next.set('v', activeVersionId);
        }
        return next;
      },
      { replace: true },
    );
  }, [activeVersionId, versions, setSearchParams]);

  // Write active state to URL — omit when it's the first registered state.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const defaultStateId = states[0]?.id ?? DEFAULT_STATES[0].id;
        if (activeStateId === defaultStateId) {
          next.delete('s');
        } else {
          next.set('s', activeStateId);
        }
        return next;
      },
      { replace: true },
    );
  }, [activeStateId, states, setSearchParams]);

  return null;
}
