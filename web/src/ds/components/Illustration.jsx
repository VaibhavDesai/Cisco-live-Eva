import { useState, useEffect, memo } from 'react'
import {
  resolveMomentumIllustrationLoader,
  buildIllustrationId,
} from '../../icons/momentumIllustrationLoaders'

const urlCache = new Map()

/**
 * Momentum Design Illustration — lazy-loads SVGs from @momentum-design/illustrations
 * and renders them as <img> elements (illustrations carry their own fill colors).
 *
 * @param {object}  props
 * @param {string}  props.name    — base name (e.g. "box-open", "warning")
 * @param {string}  [props.size]  — token: "onetwozero" (120), "oneninetwo" (192), "threetwozero" (320)
 * @param {string}  [props.variant] — "default" | "empty-primary" | "empty-secondary" | "error" | "success" | etc.
 * @param {string}  [props.fullId]  — override: provide the full filename without .svg directly
 * @param {number}  [props.width]  — rendered width in px
 * @param {number}  [props.height] — rendered height in px
 * @param {string}  [props.className]
 * @param {string}  [props.alt]
 * @param {object}  [props.style]
 */
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
