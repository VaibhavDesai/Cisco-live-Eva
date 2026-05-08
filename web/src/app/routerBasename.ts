/**
 * Basename for React Router — matches `Router.tsx` / Vite `base` and GitHub Pages CI.
 */
export function routerBasename(): string | undefined {
  const explicit = import.meta.env.VITE_ROUTER_BASENAME?.trim();
  if (explicit && explicit !== '/' && explicit !== './') {
    const normalized = explicit.endsWith('/') ? explicit.slice(0, -1) : explicit;
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p !== normalized && !p.startsWith(`${normalized}/`)) {
        return undefined;
      }
    }
    return normalized;
  }
  const base = import.meta.env.BASE_URL;
  if (base === '/' || base === './') {
    return undefined;
  }
  return base.endsWith('/') ? base.slice(0, -1) : base;
}
