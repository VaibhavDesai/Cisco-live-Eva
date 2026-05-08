/**
 * Route generator - builds React Router config from information-architecture.yaml
 * Run: npm run generate:routes (or import and use programmatically)
 */

import yaml from 'js-yaml';
import type { IAConfig, IAProject, IASection, FlattenedRoute } from './types';

// In Vite, import YAML as raw text. For Node scripts, use fs.readFileSync.
// This module is used both at build time and by the 90-int-modify-ia skill.
export const IA_CONFIG_PATH = 'src/ia/information-architecture.yaml';

function flattenSectionIds(sections: IASection[]): string[] {
  const ids: string[] = [];

  function walk(nodes: IASection[]) {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(sections);
  return ids;
}

function ensureProjects(config: IAConfig): IAProject[] {
  if (config.projects?.length) {
    return config.projects;
  }

  return [
    {
      id: 'default',
      name: 'Default project',
      description: 'Fallback when no projects are defined in IA.',
      default: true,
      navSectionIds: config.sections.map((section) => section.id),
    },
  ];
}

export function getProjectsFromIA(config: IAConfig): IAProject[] {
  return ensureProjects(config);
}

/**
 * Parse IA config from YAML string
 */
export function parseIA(yamlContent: string): IAConfig {
  const parsed = yaml.load(yamlContent) as IAConfig;
  if (!parsed?.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid IA config: expected sections array');
  }
  const projects = ensureProjects(parsed);
  const validSectionIds = new Set(flattenSectionIds(parsed.sections));
  for (const project of projects) {
    for (const sectionId of project.navSectionIds) {
      if (!validSectionIds.has(sectionId)) {
        throw new Error(
          `Invalid IA config: project "${project.id}" references unknown section id "${sectionId}"`
        );
      }
    }
  }
  parsed.projects = projects;
  return parsed;
}

/**
 * Flatten IA sections into route entries (path, screen, id)
 */
function flattenSections(
  sections: IASection[],
  parentPath = ''
): FlattenedRoute[] {
  const routes: FlattenedRoute[] = [];

  for (const section of sections) {
    let fullPath = parentPath
      ? `${parentPath}/${section.path}`.replace(/\/+/g, '/')
      : section.path;
    fullPath = fullPath.replace(/\/$/, '') || '/';

    if (section.screen) {
      routes.push({
        id: section.id,
        path: section.path,
        fullPath,
        screen: section.screen,
        parentId: parentPath || undefined,
      });
    }

    if (section.children?.length) {
      routes.push(...flattenSections(section.children, fullPath));
    }
  }

  return routes;
}

/**
 * Build React Router v7 route config from IA
 */
export function buildRoutesFromIA(config: IAConfig) {
  const flattened = flattenSections(config.sections);
  return flattened;
}

export interface SectionPathInfo {
  id: string;
  fullPath: string;
  label: string;
  parentId?: string;
  section: IASection;
}

export function buildSectionPathMap(config: IAConfig): Record<string, SectionPathInfo> {
  const map: Record<string, SectionPathInfo> = {};

  function walk(sections: IASection[], parentPath = '', parentId?: string) {
    for (const section of sections) {
      let fullPath = parentPath
        ? `${parentPath}/${section.path}`.replace(/\/+/g, '/')
        : section.path;
      fullPath = fullPath.replace(/\/$/, '') || '/';
      map[section.id] = {
        id: section.id,
        fullPath,
        label: section.label ?? section.id,
        parentId,
        section,
      };

      if (section.children?.length) {
        walk(section.children, fullPath, section.id);
      }
    }
  }

  walk(config.sections);
  return map;
}

/**
 * Get navigation items for AppShell (top-level + first-level children)
 */
export function getNavItems(config: IAConfig): { path: string; label: string }[] {
  const items: { path: string; label: string }[] = [];

  function collect(sections: IASection[], basePath = '') {
    for (const s of sections) {
      const fullPath = basePath ? `${basePath}/${s.path}`.replace(/\/+/g, '/') : s.path;
      if (s.screen) {
        items.push({ path: fullPath, label: s.label ?? s.id });
      }
      if (s.children?.length) {
        collect(s.children, fullPath);
      }
    }
  }
  collect(config.sections);
  return items;
}
