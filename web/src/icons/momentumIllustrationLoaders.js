/**
 * Momentum illustration lazy loaders — Vite import.meta.glob
 *
 * Registers every SVG from @momentum-design/illustrations as a lazy URL import.
 * Each loader is a () => Promise<string> returning the resolved asset URL.
 * SVGs are only fetched when first used.
 */

const illustrationLoaders = import.meta.glob(
  '../../node_modules/@momentum-design/illustrations/dist/svg/*.svg',
  { query: '?url', import: 'default' }
)

const loaderMap = new Map()

for (const [path, loader] of Object.entries(illustrationLoaders)) {
  const filename = path.split('/').pop().replace('.svg', '')
  loaderMap.set(filename, loader)
}

/**
 * Resolve a Momentum illustration loader by id.
 * @param {string} id — filename without .svg (e.g. "box-open-onetwozero-empty-primary")
 * @returns {(() => Promise<string>) | undefined}
 */
export function resolveMomentumIllustrationLoader(id) {
  return loaderMap.get(id)
}

/**
 * Build the full illustration id from parts.
 * @param {string} name   — base name (e.g. "box-open", "warning", "flashlight-search")
 * @param {string} size   — "onetwozero" | "oneninetwo" | "threetwozero"
 * @param {string} variant — "default" | "empty-primary" | "empty-secondary" | "error" | "success" | etc.
 * @returns {string}
 */
export function buildIllustrationId(name, size, variant) {
  return `${name}-${size}-${variant}`
}

export default loaderMap
