import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'builder-co-builder-enabled';

interface CoBuilderContextValue {
  coBuilderEnabled: boolean;
  setCoBuilderEnabled: (value: boolean) => void;
}

const CoBuilderContext = createContext<CoBuilderContextValue | null>(null);

function readStoredEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function CoBuilderProvider({ children }: { children: ReactNode }) {
  const [coBuilderEnabled, setCoBuilderEnabledState] = useState(readStoredEnabled);

  const setCoBuilderEnabled = useCallback((value: boolean) => {
    setCoBuilderEnabledState(value);
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo(
    () => ({ coBuilderEnabled, setCoBuilderEnabled }),
    [coBuilderEnabled, setCoBuilderEnabled],
  );

  return <CoBuilderContext.Provider value={value}>{children}</CoBuilderContext.Provider>;
}

export function useCoBuilder() {
  const ctx = useContext(CoBuilderContext);
  if (!ctx) {
    throw new Error('useCoBuilder must be used within CoBuilderProvider');
  }
  return ctx;
}
