import { loadIA } from '../ia/load-ia';
import { buildSectionPathMap } from '../ia/route-generator';

const ia = loadIA();
const sectionPathMap = buildSectionPathMap(ia);
const topLevelById = new Map(ia.sections.map((section) => [section.id, section]));

export function buildProjectPath(projectId: string, appPath: string): string {
  const normalizedPath = appPath.startsWith('/') ? appPath : `/${appPath}`;
  if (normalizedPath === '/') {
    return `/${projectId}`;
  }
  return `/${projectId}${normalizedPath}`;
}

function getFirstNavAppPath(navSectionIds: string[]): string {
  for (const sectionId of navSectionIds) {
    const section = topLevelById.get(sectionId);
    if (!section) {
      continue;
    }

    if (section.screen) {
      const info = sectionPathMap[section.id];
      if (info?.fullPath) {
        return info.fullPath;
      }
    }

    if (section.children?.length) {
      for (const child of section.children) {
        if (!child.screen || child.showInNav === false) {
          continue;
        }
        const info = sectionPathMap[child.id];
        if (info?.fullPath) {
          return info.fullPath;
        }
      }
    }
  }

  return '/';
}

export function getProjectDefaultPath(projectId: string, navSectionIds: string[]): string {
  return buildProjectPath(projectId, getFirstNavAppPath(navSectionIds));
}

export function swapProjectInPath(
  pathname: string,
  currentProjectId: string | undefined,
  nextProjectId: string
): string {
  if (currentProjectId) {
    const projectPrefix = `/${currentProjectId}`;
    if (pathname === projectPrefix) {
      return `/${nextProjectId}`;
    }
    if (pathname.startsWith(`${projectPrefix}/`)) {
      return `/${nextProjectId}${pathname.slice(projectPrefix.length)}`;
    }
  }

  if (pathname === '/') {
    return `/${nextProjectId}`;
  }

  return `/${nextProjectId}${pathname}`;
}
