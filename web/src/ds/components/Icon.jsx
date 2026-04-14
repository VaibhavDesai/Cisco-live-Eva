import { useState, useEffect, memo } from 'react'
import { resolveMomentumIconLoader } from '../../icons/momentumRawIconLoaders'

const svgCache = new Map()

/**
 * Momentum Design Icon — lazy-loads SVGs from @momentum-design/icons,
 * caches them in memory, and renders inline via dangerouslySetInnerHTML
 * so the SVG inherits currentColor.
 *
 * @param {object} props
 * @param {string} props.name — icon id without .svg (e.g. "search-bold", "arrow-right-regular")
 * @param {number} [props.size=20] — width and height in px
 * @param {string} [props.className] — additional CSS class (e.g. "icon-accent", "icon-sm")
 * @param {string} [props.ariaLabel] — accessible label; if omitted, icon is decorative (aria-hidden)
 * @param {object} [props.style] — inline styles
 */
function Icon({ name, size = 20, className = '', ariaLabel, style, ...rest }) {
  const [svg, setSvg] = useState(svgCache.get(name) || null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (svgCache.has(name)) {
      setSvg(svgCache.get(name))
      setError(false)
      return
    }

    const loader = resolveMomentumIconLoader(name)
    if (!loader) {
      setError(true)
      return
    }

    let cancelled = false
    loader().then((raw) => {
      if (cancelled) return
      svgCache.set(name, raw)
      setSvg(raw)
      setError(false)
    }).catch(() => {
      if (!cancelled) setError(true)
    })

    return () => { cancelled = true }
  }, [name])

  if (error) {
    return (
      <span
        className={`mds-icon-inline-svg ${className}`.trim()}
        style={{ display: 'inline-flex', width: size, height: size, ...style }}
        title={`Icon not found: ${name}`}
        {...rest}
      />
    )
  }

  if (!svg) {
    return (
      <span
        className={`mds-icon-inline-svg ${className}`.trim()}
        style={{ display: 'inline-flex', width: size, height: size, ...style }}
        {...rest}
      />
    )
  }

  return (
    <span
      className={`mds-icon-inline-svg ${className}`.trim()}
      style={{ display: 'inline-flex', width: size, height: size, ...style }}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...rest}
    />
  )
}

export default memo(Icon)
