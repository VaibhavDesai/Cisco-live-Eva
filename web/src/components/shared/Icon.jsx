import { useState, useEffect, memo } from 'react'
import { resolveMomentumIconLoader } from '../../icons/momentumRawIconLoaders'

/**
 * Momentum Design icon: lazy-loads SVG markup from `@momentum-design/icons`, caches it in memory,
 * and renders inline with `dangerouslySetInnerHTML` so strokes/fills follow `currentColor`.
 *
 * @param {Object} props
 * @param {string} props.name — icon id without `.svg` (for example `search-bold`, `arrow-right-regular`)
 * @param {number} [props.size=20] — width and height in pixels for the icon box
 * @param {string} [props.className=''] — additional CSS classes on the wrapper span
 * @param {string} [props.ariaLabel] — accessible name; when omitted the icon is decorative (`aria-hidden`)
 * @param {Object} [props.style] — inline styles merged onto the wrapper span
 * @param {Object} [props.rest] — additional props spread onto the wrapper span
 * @example
 * <Icon name="search-bold" size={24} />
 * <Icon name="check-bold" ariaLabel="Success" />
 */
const svgCache = new Map()

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
