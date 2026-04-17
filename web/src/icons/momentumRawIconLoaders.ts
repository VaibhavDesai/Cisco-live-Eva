/**
 * Pre-register every Momentum SVG for Vite static analysis.
 * Using eager: true bundles all SVGs into the main chunk, avoiding
 * thousands of tiny dynamic-import chunks that break on static hosts.
 */
const iconData = import.meta.glob<string>(
  '../../node_modules/@momentum-design/icons/dist/svg/*.svg',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

const svgById = new Map<string, string>();

for (const [path, svg] of Object.entries(iconData)) {
  const normalized = path.replace(/\\/g, '/');
  const m = normalized.match(/\/([^/]+)\.svg$/);
  if (m) svgById.set(m[1], svg);
}

export function resolveMomentumIconLoader(id: string): (() => Promise<string>) | undefined {
  let svg = svgById.get(id);
  if (svg) return () => Promise.resolve(svg);
  if (id.endsWith('-bold')) {
    const alt = `${id.slice(0, -'-bold'.length)}-regular`;
    svg = svgById.get(alt);
    if (svg) return () => Promise.resolve(svg);
  }
  return undefined;
}
