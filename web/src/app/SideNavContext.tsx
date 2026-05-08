import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

interface SideNavContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const SideNavContext = createContext<SideNavContextValue | undefined>(undefined);

/**
 * Tracks whether the off-canvas sidenav drawer is open on narrow viewports.
 * The CSS only applies the drawer behavior below ~900px; on wider screens the
 * sidenav stays persistent and the open flag is effectively ignored.
 */
export function SideNavProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('has-drawer-open');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('has-drawer-open');
    };
  }, [isOpen]);

  const value = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);

  return <SideNavContext.Provider value={value}>{children}</SideNavContext.Provider>;
}

export function useSideNav(): SideNavContextValue {
  const ctx = useContext(SideNavContext);
  if (!ctx) {
    throw new Error('useSideNav must be used inside SideNavProvider');
  }
  return ctx;
}
