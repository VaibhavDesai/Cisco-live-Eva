import { useEffect } from 'react';
import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useParams,
} from 'react-router-dom';
import { AppShell } from './AppShell';
import { AppHeader } from './AppHeader';
import { SideNavProvider } from './SideNavContext';
import { AppFloatingTools } from './AppFloatingTools';
import { DashboardScreen } from '../screens/DashboardScreen';
import { loadIA } from '../ia/load-ia';
import { buildRoutesFromIA } from '../ia/route-generator';
import { getScreenComponent } from '../screens/registry';
import { useProjects } from '../projects/useProjects';
import { getProjectDefaultPath } from '../projects/project-routing';
import { routerBasename } from './routerBasename';

const ia = loadIA();
const routes = buildRoutesFromIA(ia);
const APP_TITLE = 'AI Customer Studio';

function ProjectShell() {
  const { projectId } = useParams();
  const location = useLocation();
  const { projects, currentProjectId, projectExists, setCurrentProjectId } = useProjects();

  useEffect(() => {
    if (projectId && projectExists(projectId) && projectId !== currentProjectId) {
      setCurrentProjectId(projectId);
    }
  }, [projectId, projectExists, currentProjectId, setCurrentProjectId]);

  if (!projectId || !projectExists(projectId)) {
    return <Navigate to={`/${currentProjectId}`} replace />;
  }

  const selectedProject = projects.find((project) => project.id === projectId);
  if (selectedProject) {
    const normalizedPath =
      location.pathname.length > 1 && location.pathname.endsWith('/')
        ? location.pathname.slice(0, -1)
        : location.pathname;
    const projectRootPath = `/${projectId}`;
    if (normalizedPath === projectRootPath) {
      const defaultPath = getProjectDefaultPath(projectId, selectedProject.navSectionIds);
      if (defaultPath !== projectRootPath) {
        return <Navigate to={defaultPath} replace />;
      }
    }
  }

  return <AppShell />;
}

function DefaultProjectRedirect() {
  const { currentProjectId } = useProjects();
  return <Navigate to={`/${currentProjectId}`} replace />;
}

/** Root `/` — project picker; no project-scoped shell yet. */
function DashboardShell() {
  useEffect(() => {
    document.title = `Dashboard | ${APP_TITLE}`;
  }, []);

  return (
    <SideNavProvider>
      <div className="app-shell app-shell--dashboard">
        <AppHeader />
        <div className="app-shell-body app-shell-body--dashboard">
          <main className="app-main app-main--dashboard">
            <DashboardScreen />
          </main>
        </div>
        <AppFloatingTools />
      </div>
    </SideNavProvider>
  );
}

const routeElements = routes.map((r) => {
  const element = getScreenComponent(r.screen);
  if (r.fullPath === '/') {
    return { index: true as const, element };
  }
  return {
    path: r.fullPath.replace(/^\//, ''),
    element,
  };
});

const router = createBrowserRouter(
  [
    {
      path: '/',
      children: [
        {
          index: true as const,
          element: <DashboardShell />,
        },
        {
          path: ':projectId',
          element: <ProjectShell />,
          children: routeElements,
        },
        {
          path: '*',
          element: <DefaultProjectRedirect />,
        },
      ],
    },
  ],
  { basename: routerBasename() },
);

export function Router() {
  return <RouterProvider router={router} />;
}
