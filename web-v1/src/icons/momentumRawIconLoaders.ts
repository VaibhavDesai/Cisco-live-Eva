/**
 * Pre-register every Momentum SVG for Vite static analysis.
 * Dynamic `import(\`@momentum-design/icons/...\`)` often fails in dev / prebundling.
 */
const iconLoaders = import.meta.glob<string>(
  '../../node_modules/@momentum-design/icons/dist/svg/*.svg',
  { query: '?raw', import: 'default' }
) as Record<string, () => Promise<string>>;

/** file base e.g. list-menu-bold → loader */
const loaderById = new Map<string, () => Promise<string>>();

for (const [path, loader] of Object.entries(iconLoaders)) {
  const normalized = path.replace(/\\/g, '/');
  const m = normalized.match(/\/([^/]+)\.svg$/);
  if (m) loaderById.set(m[1], loader as () => Promise<string>);
}

export function resolveMomentumIconLoader(id: string): (() => Promise<string>) | undefined {
  let fn = loaderById.get(id);
  if (fn) return fn;
  if (id.endsWith('-bold')) {
    const alt = `${id.slice(0, -'-bold'.length)}-regular`;
    fn = loaderById.get(alt);
    if (fn) return fn;
  }
  return undefined;
}
