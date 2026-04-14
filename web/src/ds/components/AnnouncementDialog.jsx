import { useEffect, useRef, useCallback } from 'react'
import Icon from './Icon'
import Button from './Button'

export default function AnnouncementDialog({
  open = true,
  title,
  description,
  imageSrc,
  imageAlt = '',
  imageBg,
  imageContent,
  linkText,
  linkHref,
  linkIcon = 'pop-out-bold',
  onLinkClick,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
  overlay = false,
  className = '',
  ...rest
}) {
  const dialogRef = useRef(null)

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  useEffect(() => {
    if (open && dialogRef.current) {
      const firstBtn = dialogRef.current.querySelector('button')
      firstBtn?.focus()
    }
  }, [open])

  if (!open) return null

  const dialog = (
    <div
      ref={dialogRef}
      className={`announce-dialog ${className}`}
      role="dialog"
      aria-modal={overlay ? 'true' : undefined}
      aria-label={title || 'Announcement'}
      {...rest}
    >
      {/* Left image panel */}
      <div className="announce-dialog__image">
        <div
          className="announce-dialog__image-inner"
          style={imageBg ? { background: imageBg } : undefined}
        >
          {imageContent || (imageSrc && <img src={imageSrc} alt={imageAlt} />)}
        </div>
      </div>

      {/* Right content panel */}
      <div className="announce-dialog__content">
        {title && <h2 className="announce-dialog__title">{title}</h2>}
        {description && <p className="announce-dialog__description">{description}</p>}

        {linkText && (
          <a
            className="announce-dialog__link"
            href={linkHref || '#'}
            onClick={(e) => {
              if (!linkHref) e.preventDefault()
              onLinkClick?.()
            }}
            target={linkHref ? '_blank' : undefined}
            rel={linkHref ? 'noopener noreferrer' : undefined}
          >
            {linkText}
            <Icon name={linkIcon} size={16} />
          </a>
        )}

        {(primaryLabel || secondaryLabel) && (
          <div className="announce-dialog__footer">
            <div className="announce-dialog__footer-buttons">
              {secondaryLabel && (
                <Button variant="secondary" size={32} onClick={onSecondary}>
                  {secondaryLabel}
                </Button>
              )}
              {primaryLabel && (
                <Button variant="primary" size={32} onClick={onPrimary}>
                  {primaryLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          className="announce-dialog__close"
          aria-label="Close announcement"
          onClick={onClose}
        >
          <Icon name="cancel-bold" size={16} />
        </button>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
        {dialog}
      </div>
    )
  }

  return dialog
}
