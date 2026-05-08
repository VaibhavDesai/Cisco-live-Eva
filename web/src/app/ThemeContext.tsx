import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

const LIGHT_THEME = 'mds-theme-stable-lightWebex';
const DARK_THEME = 'mds-theme-stable-darkWebex';

const THEME_STORAGE_KEY = 'builder-theme-mode';

/** Read persisted theme, or default to dark. Safe for use before React mounts. */
export function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark') {
      return v;
    }
  } catch {
    /* ignore */
  }
  return 'dark';
}

/** Apply theme class on `document.documentElement` before first paint (avoids light flash). */
export function applyStoredThemeClassToDocument(): void {
  const mode = readStoredTheme();
  const html = document.documentElement;
  html.classList.remove(LIGHT_THEME, DARK_THEME);
  html.classList.add(mode === 'dark' ? DARK_THEME : LIGHT_THEME);
}

function persistTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

interface ThemeContextValue {
  theme: ThemeMode;
  themeClass: string;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    persistTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      persistTheme(next);
      return next;
    });
  }, []);

  const themeClass = theme === 'dark' ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeClass,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return ctx;
}
