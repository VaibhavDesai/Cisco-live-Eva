import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadIA } from '../ia/load-ia';
import type { IAProject } from '../ia/types';
import { getInitialCurrentProjectId } from './getInitialCurrentProjectId';
import {
  loadProjectOverrides,
  PROJECT_DISPLAY_OVERRIDES_KEY,
  saveLastProjectId,
  saveProjectOverrides,
  type ProjectDisplayOverride,
} from './project-overrides-storage';

export interface ProjectContextValue {
  projects: IAProject[];
  currentProjectId: string;
  currentProject: IAProject;
  setCurrentProjectId: (projectId: string) => void;
  /** Persists name/description per project in local storage (IA id is unchanged). */
  updateProjectMeta: (projectId: string, update: { name: string; description: string }) => void;
  createProject: (name: string) => IAProject;
  deleteProject: (projectId: string) => void;
  projectExists: (projectId: string) => boolean;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

function ensureSeedProjects(seedProjects: IAProject[], sectionIds: string[]): IAProject[] {
  if (seedProjects.length) {
    return seedProjects;
  }

  return [
    {
      id: 'default',
      name: 'Default project',
      description: 'Fallback when no projects are defined in IA.',
      default: true,
      navSectionIds: sectionIds,
    },
  ];
}

function mergeProjectWithOverrides(
  base: IAProject,
  overrides: Record<string, ProjectDisplayOverride>
): IAProject {
  const o = overrides[base.id];
  const name = o?.name !== undefined && o.name.trim() !== '' ? o.name.trim() : base.name;
  const description =
    o?.description !== undefined ? o.description : (base.description ?? '');
  return { ...base, name, description };
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const ia = loadIA();
  const sectionIds = ia.sections.map((section) => section.id);
  const baseProjects = useMemo(() => ensureSeedProjects(ia.projects ?? [], sectionIds), [ia.projects, sectionIds]);
  const [overrides, setOverrides] = useState<Record<string, ProjectDisplayOverride>>(loadProjectOverrides);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROJECT_DISPLAY_OVERRIDES_KEY && e.newValue != null) {
        try {
          const parsed = JSON.parse(e.newValue) as unknown;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setOverrides(parsed as Record<string, ProjectDisplayOverride>);
          }
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const projects = useMemo(
    () => baseProjects.map((p) => mergeProjectWithOverrides(p, overrides)),
    [baseProjects, overrides]
  );

  const defaultProjectId =
    baseProjects.find((project) => project.default)?.id ?? baseProjects[0]?.id ?? 'default';
  const [currentProjectId, setCurrentProjectIdState] = useState<string>(() => {
    const ids = new Set(baseProjects.map((p) => p.id));
    return getInitialCurrentProjectId(ids, defaultProjectId);
  });

  const currentProject = useMemo(
    () =>
      projects.find((project) => project.id === currentProjectId) ??
      projects[0] ?? {
        id: 'default',
        name: 'Default project',
        description: '',
        navSectionIds: sectionIds,
      },
    [projects, currentProjectId, sectionIds]
  );

  const setCurrentProjectId = useCallback(
    (projectId: string) => {
      if (!projects.some((project) => project.id === projectId)) {
        return;
      }
      setCurrentProjectIdState(projectId);
    },
    [projects]
  );

  useEffect(() => {
    saveLastProjectId(currentProjectId);
  }, [currentProjectId]);

  const updateProjectMeta = useCallback(
    (projectId: string, update: { name: string; description: string }) => {
      if (!baseProjects.some((p) => p.id === projectId)) {
        return;
      }
      const trimmedName = update.name.trim();
      if (!trimmedName) {
        return;
      }
      setOverrides((prev) => {
        const next: Record<string, ProjectDisplayOverride> = {
          ...prev,
          [projectId]: {
            ...prev[projectId],
            name: trimmedName,
            description: update.description,
          },
        };
        saveProjectOverrides(next);
        return next;
      });
    },
    [baseProjects]
  );

  const createProject = useCallback(
    () => {
      throw new Error('Projects are managed in src/ia/information-architecture.yaml');
    },
    []
  );

  const deleteProject = useCallback(
    () => {
      throw new Error('Projects are managed in src/ia/information-architecture.yaml');
    },
    []
  );

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      currentProjectId,
      currentProject,
      setCurrentProjectId,
      updateProjectMeta,
      createProject,
      deleteProject,
      projectExists: (projectId: string) => projects.some((project) => project.id === projectId),
    }),
    [
      projects,
      currentProjectId,
      currentProject,
      setCurrentProjectId,
      updateProjectMeta,
      createProject,
      deleteProject,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
