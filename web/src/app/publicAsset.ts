/**
 * Root path for files copied from `public/` into the deploy root (`/`, `/repo/`, …).
 * When Vite `base` is `./` (GitHub Pages), `import.meta.env.BASE_URL` is `./`; using
 * `./images/...` in `url()` breaks on nested SPA routes because the browser resolves `.`
 * against the **current pathname**, not the site root.
 */
export function publicDeployRoot(): string {
  const base = import.meta.env.BASE_URL
  if (base !== './') {
    return base.endsWith('/') ? base : `${base}/`
  }
  const explicit = import.meta.env.VITE_ROUTER_BASENAME?.trim()
  const normalized = explicit?.replace(/\/$/, '') ?? ''
  if (typeof window === 'undefined') {
    return normalized ? `${normalized}/` : '/'
  }
  const p = window.location.pathname
  if (normalized && (p === normalized || p.startsWith(`${normalized}/`))) {
    return `${normalized}/`
  }
  return '/'
}

/** @deprecated use `publicDeployRoot()` — kept for any import sites */
export const PUBLIC_BASE_URL = import.meta.env.BASE_URL

/** Path to a file under `public/` (root-absolute, e.g. `/images/page-bg.png`). */
export function publicAssetUrl(path: string): string {
  const trimmed = path.startsWith('/') ? path.slice(1) : path
  return `${publicDeployRoot()}${trimmed}`
}
