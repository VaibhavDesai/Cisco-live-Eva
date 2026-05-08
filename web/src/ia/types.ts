/**
 * Information architecture types
 * Defines the structure of information-architecture.yaml
 */

export interface IASection {
  id: string;
  path: string;
  screen?: string;
  label?: string;
  icon?: string;
  /** Optional icon when this nav link is active (e.g. `-filled` variant). */
  iconActive?: string;
  /** When false, omit from sidebar (route still works). Default: true */
  showInNav?: boolean;
  /**
   * Additional app-path prefixes (relative to the project root, e.g. `/simulated-testing`)
   * that should mark this section as active in the sidebar, even though they are not this
   * section's own `path`. Useful when a feature lives on another route but conceptually
   * belongs to this nav item (e.g. Billing Support configuration under "AI Agents").
   */
  activeForPathPrefixes?: string[];
  children?: IASection[];
}

export interface IAProject {
  id: string;
  name: string;
  /** Required in `information-architecture.yaml` (non-empty); optional on this type when merging dashboard overrides (local storage). */
  description?: string;
  default?: boolean;
  navSectionIds: string[];
}

export interface IAConfig {
  projects?: IAProject[];
  sections: IASection[];
}

export interface FlattenedRoute {
  path: string;
  fullPath: string;
  screen: string;
  id: string;
  parentId?: string;
}
