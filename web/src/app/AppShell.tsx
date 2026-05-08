import { useEffect } from 'react';
import { Outlet, matchPath, useLocation, useParams } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { SideNav } from './SideNav';
import { AppFloatingTools } from './AppFloatingTools';
import { SideNavProvider, useSideNav } from './SideNavContext';
import { loadIA } from '../ia/load-ia';
import type { IASection } from '../ia/types';
import { useProjects } from '../projects/useProjects';

const APP_TITLE = 'AI Customer Studio';
const ia = loadIA();

interface RouteTitleMeta {
  fullPath: string;
  labels: string[];
}

function flattenRouteTitleMeta(
  sections: IASection[],
  parentPath = '',
  parentLabels: string[] = []
): RouteTitleMeta[] {
  const items: RouteTitleMeta[] = [];

  for (const section of sections) {
    let fullPath = parentPath
      ? `${parentPath}/${section.path}`.replace(/\/+/g, '/')
      : section.path;
    fullPath = fullPath.replace(/\/$/, '') || '/';
    const sectionLabel = section.label ?? section.id;
    const labels = [...parentLabels, sectionLabel];

    if (section.screen) {
      items.push({ fullPath, labels });
    }

    if (section.children?.length) {
      items.push(...flattenRouteTitleMeta(section.children, fullPath, labels));
    }
  }

  return items;
}

const routeTitleMeta = flattenRouteTitleMeta(ia.sections);

function buildTitleParts(parts: Array<string | undefined>): string[] {
  const built: string[] = [];
  for (const part of parts) {
    const value = part?.trim();
    if (!value) {
      continue;
    }
    if (built[built.length - 1] === value) {
      continue;
    }
    built.push(value);
  }
  return built;
}

function resolveRouteLabels(appPath: string): string[] {
  const matches = routeTitleMeta
    .filter((item) => matchPath({ path: item.fullPath, end: true }, appPath))
    .sort((a, b) => b.fullPath.length - a.fullPath.length);
  return matches[0]?.labels ?? [];
}

/** Full-viewport journey canvas: no app chrome (see .app-shell--journey-canvas). */
function isJourneyCanvasPath(pathname: string): boolean {
  return pathname.includes('/flows-and-journeys/journey/canvas');
}

/** CLUS KPI dashboard brings its own padded card + background; avoid nesting inside .app-main glass. */
function isKpiDashboardPath(pathname: string): boolean {
  return /\/kpi-dashboard\/?$/.test(pathname);
}

/** CLUS Simulated testing uses the same full-bleed main column as KPI. */
function isSimulatedTestingPath(pathname: string): boolean {
  return /\/simulated-testing\/?$/.test(pathname);
}

/** AI Studio Concept create-customer flow (same full-bleed layout as CLUS simulated testing). */
function isConceptTestCustomerPath(pathname: string): boolean {
  return /\/concept\/test-customer\/?$/.test(pathname);
}

/** Command Centre supplies its own dark chrome. */
function isCommandCentrePath(pathname: string): boolean {
  return /\/command-centre\/?$/.test(pathname);
}

export function AppShell() {
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProjects();
  const journeyCanvas = isJourneyCanvasPath(location.pathname);
  const commandCentre = isCommandCentrePath(location.pathname);
  const kpiDashboard = isKpiDashboardPath(location.pathname);
  const clusFullBleedMain =
    kpiDashboard ||
    isSimulatedTestingPath(location.pathname) ||
    isConceptTestCustomerPath(location.pathname) ||
    commandCentre;

  useEffect(() => {
    if (!projectId) {
      document.title = APP_TITLE;
      return;
    }

    const projectPrefix = `/${projectId}`;
    const appPath = location.pathname.startsWith(`${projectPrefix}/`)
      ? location.pathname.slice(projectPrefix.length)
      : '/';
    const labels = resolveRouteLabels(appPath || '/');
    const page = labels.at(-1);
    const tab = labels.length > 1 ? labels.at(-2) : undefined;
    const subTab = labels.length > 2 ? labels.at(-3) : undefined;
    const parts = buildTitleParts([subTab, tab, page, currentProject.name, APP_TITLE]);
    document.title = parts.join(' | ');
  }, [location.pathname, projectId, currentProject.name]);

  if (journeyCanvas) {
    return (
      <div className="app-shell app-shell--journey-canvas">
        <div className="app-shell-body app-shell-body--journey-canvas">
          <main className="app-main app-main--journey-canvas">
            <Outlet />
          </main>
        </div>
        <AppFloatingTools />
      </div>
    );
  }

  return (
    <SideNavProvider>
      <div className="app-shell">
        <AppHeader />
        <div className="app-shell-body">
          <SideNav />
          <SideNavScrim />
          <main
            className={
              clusFullBleedMain
                ? `app-main app-main--kpi-dashboard${kpiDashboard ? ' app-main--kpi-observability' : ''}`
                : 'app-main'
            }
          >
            <Outlet />
          </main>
        </div>
        <AppFloatingTools />
      </div>
    </SideNavProvider>
  );
}

function SideNavScrim() {
  const { isOpen, close } = useSideNav();
  return (
    <div
      className={`app-side-nav-scrim${isOpen ? ' is-open' : ''}`}
      onClick={close}
      aria-hidden
    />
  );
}
