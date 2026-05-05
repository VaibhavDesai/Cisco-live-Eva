import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DesignVariationContext,
  DESIGN_VARIATION_STORAGE_KEY,
  readDesignVariationStored,
  writeDesignVariationStored,
  type DesignVariation,
  type DesignVariationContextValue,
} from './designVariationStore';

export const DesignVariationProvider = ({ children }: { children: ReactNode }) => {
  const [variation, setVariationState] = useState<DesignVariation>(() => readDesignVariationStored());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DESIGN_VARIATION_STORAGE_KEY) setVariationState(readDesignVariationStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setVariation = useCallback((next: DesignVariation) => {
    writeDesignVariationStored(next);
    setVariationState(next);
  }, []);

  const value = useMemo<DesignVariationContextValue>(
    () => ({ variation, setVariation }),
    [variation, setVariation],
  );

  return <DesignVariationContext.Provider value={value}>{children}</DesignVariationContext.Provider>;
};

export const useDesignVariation = (): DesignVariationContextValue => {
  const ctx = useContext(DesignVariationContext);
  if (!ctx) throw new Error('useDesignVariation must be used inside <DesignVariationProvider>');
  return ctx;
};
