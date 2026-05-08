import type { ComponentProps } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@momentum-design/components/react';
import { loadIA } from '../ia/load-ia';
import { buildSectionPathMap } from '../ia/route-generator';
import { useProjects } from '../projects/useProjects';
import { buildProjectPath } from '../projects/project-routing';
import { useSideNav } from './SideNavContext';

const ia = loadIA();
const sectionPathMap = buildSectionPathMap(ia);

function normalizePathname(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

interface NavCandidate {
  /** Section/child id that owns this candidate (its own path or an activation alias). */
  ownerId: string;
  /** Fully-qualified path to match against the current location. */
  path: string;
}

/**
 * Among all sidebar destinations, only the longest path that matches the current
 * location should mark a nav link as active. Otherwise the project home
 * (`/:projectId`) stays active for every nested route because those URLs start with
 * `/:projectId/`.
 *
 * Returns the owning `sectionId` of the longest matching candidate, or `null` if
 * nothing matches. Candidates may include activation aliases contributed by
 * `activeForPathPrefixes`, which point the active state at a section without
 * adding a sidebar link.
 */
function resolveActiveOwnerId(pathname: string, candidates: NavCandidate[]): string | null {
  const normalized = normalizePathname(pathname);
  const matches = candidates.filter(({ path }) => {
    const t = normalizePathname(path);
    return normalized === t || normalized.startsWith(`${t}/`);
  });
  if (matches.length === 0) {
    return null;
  }
  return matches.reduce((longest, next) =>
    normalizePathname(next.path).length >= normalizePathname(longest.path).length ? next : longest,
  ).ownerId;
}

function resolveNavIcon(sectionId: string, isActive: boolean): string {
  const section = sectionPathMap[sectionId]?.section;
  if (!section) {
    return 'widget-bold';
  }
  if (isActive && section.iconActive) {
    return section.iconActive;
  }
  return section.icon ?? 'widget-bold';
}

export function SideNav() {
  const location = useLocation();
  const { currentProject, currentProjectId } = useProjects();
  const { isOpen } = useSideNav();
  const topLevelById = new Map(ia.sections.map((section) => [section.id, section]));
  const scopedSections = currentProject.navSectionIds
    .map((sectionId) => topLevelById.get(sectionId))
    .filter((section): section is NonNullable<typeof section> => Boolean(section));

  const navCandidates: NavCandidate[] = [];
  const addActivationAliases = (ownerId: string, prefixes: string[] | undefined) => {
    if (!prefixes?.length) {
      return;
    }
    for (const prefix of prefixes) {
      navCandidates.push({
        ownerId,
        path: buildProjectPath(currentProjectId, prefix),
      });
    }
  };

  for (const section of scopedSections) {
    if (section.screen) {
      const info = sectionPathMap[section.id];
      if (info) {
        navCandidates.push({
          ownerId: section.id,
          path: buildProjectPath(currentProjectId, info.fullPath),
        });
      }
    }
    addActivationAliases(section.id, section.activeForPathPrefixes);

    if (section.children?.length) {
      for (const child of section.children) {
        if (child.screen && child.showInNav !== false) {
          const info = sectionPathMap[child.id];
          if (info) {
            navCandidates.push({
              ownerId: child.id,
              path: buildProjectPath(currentProjectId, info.fullPath),
            });
          }
        }
        addActivationAliases(child.id, child.activeForPathPrefixes);
      }
    }
  }
  const activeOwnerId = resolveActiveOwnerId(location.pathname, navCandidates);

  const renderLink = (sectionId: string, label: string) => {
    const pathInfo = sectionPathMap[sectionId];
    if (!pathInfo) {
      return null;
    }
    const to = buildProjectPath(currentProjectId, pathInfo.fullPath);
    const isActive = activeOwnerId === sectionId;
    return (
      <Link
        key={`${sectionId}-${to}`}
        to={to}
        className={`app-side-nav-row${isActive ? ' app-side-nav-row-active' : ''}`}
      >
        <span className="app-side-nav-marker-wrap" aria-hidden>
          {isActive ? <span className="app-side-nav-marker" /> : null}
        </span>
        <span
          className={`app-side-nav-pill${isActive ? ' app-side-nav-pill-active' : ''}`}
        >
          <span className="app-side-nav-icon">
            <Icon
              name={resolveNavIcon(sectionId, isActive) as ComponentProps<typeof Icon>['name']}
              size={24}
            />
          </span>
          <span className="app-side-nav-label">{label}</span>
        </span>
      </Link>
    );
  };

  const renderSectionLabel = (sectionId: string, label: string) => (
    <div className="app-side-nav-section-label">
      <span className="app-side-nav-icon app-side-nav-icon-button" aria-hidden>
        <Icon
          name={resolveNavIcon(sectionId, false) as ComponentProps<typeof Icon>['name']}
          size={24}
        />
      </span>
      <span className="app-side-nav-section-label-text">{label}</span>
    </div>
  );

  return (
    <aside
      id="app-side-nav"
      className={`app-side-nav${isOpen ? ' is-open' : ''}`}
    >
      <nav className="app-side-nav-nav">
        {scopedSections.map((section) => {
          const hasDirectScreen = Boolean(section.screen);
          return (
            <div key={section.id}>
              {hasDirectScreen && renderLink(section.id, section.label ?? section.id)}

              {section.children?.length ? (
                <>
                  {!hasDirectScreen && (
                    renderSectionLabel(section.id, section.label ?? section.id)
                  )}
                  {section.children
                    .filter((child) => Boolean(child.screen) && child.showInNav !== false)
                    .map((child) => renderLink(child.id, child.label ?? child.id))}
                </>
              ) : null}
            </div>
          );
        })}
      </nav>
      <div className="app-side-nav-footer">
        <div className="app-side-nav-org">
          <span className="app-side-nav-icon">
            <Icon name="company-bold" size={24} />
          </span>
          {currentProject.name}
        </div>
      </div>
    </aside>
  );
}
