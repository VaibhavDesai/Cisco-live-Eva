import { useState, useEffect, memo } from 'react'
import {
  resolveMomentumIllustrationLoader,
  buildIllustrationId,
} from '../../icons/momentumIllustrationLoaders'

/**
 * Momentum Design illustration: lazy-loads artwork from `@momentum-design/illustrations` and renders
 * it as an `<img>` so built-in fills in the SVG are preserved (unlike inline icon color inheritance).
 *
 * @param {Object} props
 * @param {string} props.name — base illustration name (for example `box-open`, `warning`)
 * @param {string} [props.size='onetwozero'] — size token (`onetwozero` ≈ 120px, `oneninetwo` ≈ 192px, `threetwozero` ≈ 320px)
 * @param {string} [props.variant='empty-primary'] — style variant key (for example `default`, `empty-primary`, `error`, `success`)
 * @param {string} [props.fullId] — full asset id without `.svg`; when set, bypasses `buildIllustrationId(name, size, variant)`
 * @param {number} [props.width] — optional explicit width in pixels for the rendered image
 * @param {number} [props.height] — optional explicit height in pixels for the rendered image
 * @param {string} [props.className=''] — additional CSS classes on the wrapper or `<img>`
 * @param {string} [props.alt=''] — alternative text; when empty, `aria-hidden` is applied on the image
 * @param {Object} [props.style] — inline styles merged into layout styles
 * @param {Object} [props.rest] — additional props spread onto the placeholder span or `<img>`
 * @example
 * <Illustration name="warning" variant="error" alt="Warning" />
 * <Illustration name="box-open" size="oneninetwo" width={192} height={192} />
 */
const urlCache = new Map()

function Illustration({
  name,
  size = 'onetwozero',
  variant = 'empty-primary',
  fullId,
  width,
  height,
  className = '',
  alt = '',
  style,
  ...rest
}) {
  const id = fullId || buildIllustrationId(name, size, variant)
  const [src, setSrc] = useState(urlCache.get(id) || null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (urlCache.has(id)) {
      setSrc(urlCache.get(id))
      setError(false)
      return
    }

    const loader = resolveMomentumIllustrationLoader(id)
    if (!loader) {
      setError(true)
      return
    }

    let cancelled = false
    loader()
      .then((url) => {
        if (cancelled) return
        urlCache.set(id, url)
        setSrc(url)
        setError(false)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  const sizeStyle = {
    width: width ?? '100%',
    height: height ?? '100%',
    objectFit: 'contain',
    ...style,
  }

  if (error || !src) {
    return (
      <span
        className={`mds-illustration ${className}`.trim()}
        style={{ display: 'inline-flex', width: width ?? 120, height: height ?? 96, ...style }}
        aria-hidden="true"
        {...rest}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={!alt}
      className={`mds-illustration ${className}`.trim()}
      style={sizeStyle}
      draggable={false}
      {...rest}
    />
  )
}

export default memo(Illustration)
