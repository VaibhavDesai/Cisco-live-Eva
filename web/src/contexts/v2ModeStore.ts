import { createContext } from 'react';

/*
 * Keeping the context object + storage helpers in a non-JSX module prevents
 * Vite/React Fast Refresh from recreating the context singleton when the
 * provider component file is edited. Without this split, HMR can leave the
 * running <V2ModeProvider> bound to a stale context while hook consumers see a
 * freshly created one, causing "useV2Mode must be used inside
 * <V2ModeProvider>" errors until a hard reload.
 */

export interface V2ModeContextValue {
  active: boolean;
  toggle: () => void;
  setActive: (next: boolean) => void;
}

export const V2ModeContext = createContext<V2ModeContextValue | null>(null);

export const V2_MODE_STORAGE_KEY = 'v2Mode.enabled';

export const readV2ModeStored = (): boolean => {
  try {
    return window.localStorage.getItem(V2_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const writeV2ModeStored = (next: boolean): void => {
  try {
    if (next) window.localStorage.setItem(V2_MODE_STORAGE_KEY, '1');
    else window.localStorage.removeItem(V2_MODE_STORAGE_KEY);
  } catch {
    // ignore
  }
};
