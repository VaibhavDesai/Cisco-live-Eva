import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  V2ModeContext,
  V2_MODE_STORAGE_KEY,
  readV2ModeStored,
  writeV2ModeStored,
  type V2ModeContextValue,
} from './v2ModeStore';

export const V2ModeProvider = ({ children }: { children: ReactNode }) => {
  const [active, setActiveState] = useState<boolean>(() => readV2ModeStored());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === V2_MODE_STORAGE_KEY) setActiveState(readV2ModeStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setActive = useCallback((next: boolean) => {
    writeV2ModeStored(next);
    setActiveState(next);
  }, []);

  const toggle = useCallback(() => {
    setActive(!readV2ModeStored());
  }, [setActive]);

  const value = useMemo<V2ModeContextValue>(
    () => ({ active, toggle, setActive }),
    [active, toggle, setActive],
  );

  return <V2ModeContext.Provider value={value}>{children}</V2ModeContext.Provider>;
};

export const useV2Mode = (): V2ModeContextValue => {
  const ctx = useContext(V2ModeContext);
  if (!ctx) throw new Error('useV2Mode must be used inside <V2ModeProvider>');
  return ctx;
};
