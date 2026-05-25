import { createContext } from 'react';

/*
 * Keeping the context object + storage helpers in a non-JSX module prevents
 * Vite/React Fast Refresh from recreating the context singleton when the
 * provider component file is edited. Without this split, HMR can leave the
 * running <DesignVariationProvider> bound to a stale context while hook
 * consumers see a freshly created one, causing
 * "useDesignVariation must be used inside <DesignVariationProvider>" errors
 * until a hard reload.
 */

export type DesignVariation = 'landing' | 'dashboard' | 'form-bases';

export const DESIGN_VARIATIONS: DesignVariation[] = ['landing', 'dashboard', 'form-bases'];

export const DEFAULT_DESIGN_VARIATION: DesignVariation = 'dashboard';

export interface DesignVariationContextValue {
  variation: DesignVariation;
  setVariation: (next: DesignVariation) => void;
}

export const DesignVariationContext = createContext<DesignVariationContextValue | null>(null);

export const DESIGN_VARIATION_STORAGE_KEY = 'designVariation.value.v4';

const isDesignVariation = (value: string | null): value is DesignVariation =>
  value === 'landing' || value === 'dashboard' || value === 'form-bases';

export const readDesignVariationStored = (): DesignVariation => {
  try {
    const stored = window.localStorage.getItem(DESIGN_VARIATION_STORAGE_KEY);
    if (isDesignVariation(stored)) return stored;
    return DEFAULT_DESIGN_VARIATION;
  } catch {
    return DEFAULT_DESIGN_VARIATION;
  }
};

export const writeDesignVariationStored = (next: DesignVariation): void => {
  try {
    if (next === DEFAULT_DESIGN_VARIATION) {
      window.localStorage.removeItem(DESIGN_VARIATION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(DESIGN_VARIATION_STORAGE_KEY, next);
    }
  } catch {
    // ignore
  }
};
