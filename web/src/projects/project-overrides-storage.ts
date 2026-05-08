/** Project display overrides (name/description) — survives refresh in this browser. */
export const PROJECT_DISPLAY_OVERRIDES_KEY = 'builder-project-display-overrides';

const LAST_PROJECT_KEY = 'builder-last-project-id';

export type ProjectDisplayOverride = {
  name?: string;
  description?: string;
};

export function loadProjectOverrides(): Record<string, ProjectDisplayOverride> {
  try {
    const raw = localStorage.getItem(PROJECT_DISPLAY_OVERRIDES_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, ProjectDisplayOverride>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveProjectOverrides(data: Record<string, ProjectDisplayOverride>): void {
  try {
    localStorage.setItem(PROJECT_DISPLAY_OVERRIDES_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Last selected project id — restored when opening the app (with URL taking precedence). */
export function loadLastProjectId(): string | undefined {
  try {
    const v = localStorage.getItem(LAST_PROJECT_KEY)?.trim();
    return v || undefined;
  } catch {
    return undefined;
  }
}

export function saveLastProjectId(projectId: string): void {
  try {
    localStorage.setItem(LAST_PROJECT_KEY, projectId);
  } catch {
    /* ignore */
  }
}
