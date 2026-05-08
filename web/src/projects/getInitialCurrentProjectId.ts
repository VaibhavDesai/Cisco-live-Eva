import { routerBasename } from '../app/routerBasename';
import { loadLastProjectId } from './project-overrides-storage';

/**
 * Resolve first matching `:projectId` segment from the current URL (after router basename).
 */
function readProjectIdFromLocation(projectIds: Set<string>): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const pathname = window.location.pathname;
  const base = routerBasename();
  let rest = pathname;
  if (base) {
    if (pathname !== base && !pathname.startsWith(`${base}/`)) {
      return undefined;
    }
    rest = pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  }
  if (!rest.startsWith('/')) {
    rest = `/${rest}`;
  }
  const segment = rest.split('/').filter(Boolean)[0];
  if (segment && projectIds.has(segment)) {
    return segment;
  }
  return undefined;
}

/**
 * URL project id first, then last session selection, then default.
 */
export function getInitialCurrentProjectId(
  projectIds: Set<string>,
  defaultProjectId: string
): string {
  const fromUrl = readProjectIdFromLocation(projectIds);
  if (fromUrl) {
    return fromUrl;
  }
  const stored = loadLastProjectId();
  if (stored && projectIds.has(stored)) {
    return stored;
  }
  return defaultProjectId;
}
