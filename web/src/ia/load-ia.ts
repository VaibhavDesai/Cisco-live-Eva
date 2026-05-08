/**
 * Load IA config at build time
 * Vite bundles this - the YAML is inlined at build
 */

import yaml from 'js-yaml';
import type { IAConfig, IAProject } from './types';

import iaYaml from './information-architecture.yaml?raw';

let cached: IAConfig | null = null;

function buildDefaultProjects(config: IAConfig): IAProject[] {
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

export function loadIA(): IAConfig {
  if (!cached) {
    const parsed = yaml.load(iaYaml) as IAConfig;
    if (!parsed?.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Invalid IA config: expected sections array');
    }
    if (!parsed.projects?.length) {
      parsed.projects = buildDefaultProjects(parsed);
    }
    cached = parsed;
  }
  return cached;
}
