import { forwardRef } from 'react'
import Icon from './Icon'

const Card = forwardRef(function Card(
  {
    variant = 'static',
    layout,
    type = 'border',
    selected = false,
    disabled = false,
    onClick,
    children,
    className = '',
    ...rest
  },
  ref,
) {
  const isClickable = variant === 'clickable'
  const isSelectable = variant === 'selectable'
  const isInteractive = isClickable || isSelectable

  const classes = [
    'card',
    layout === 'vertical' && 'card-vertical',
    layout === 'horizontal' && 'card-horizontal',
    type === 'ghost' && 'card-ghost',
    isClickable && 'card-clickable',
    isSelectable && 'card-selectable',
    selected && 'card-selected',
    disabled && 'card-disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (disabled) return
    onClick?.()
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <div
      ref={ref}
      className={classes}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      onClick={isInteractive ? handleClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      aria-pressed={isSelectable ? selected : undefined}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {children}
    </div>
  )
})

function CardImage({ src, alt = '', className = '', children, ...rest }) {
  return (
    <div className={`card-image ${className}`} {...rest}>
      {src ? <img src={src} alt={alt} /> : children}
    </div>
  )
}

function CardBody({ children, className = '', ...rest }) {
  return (
    <div className={`card-body-wrapper ${className}`} {...rest}>
      {children}
    </div>
  )
}

function CardHeader({ icon, title, subtitle, actions, selectable, selected, children, className = '' }) {
  if (children) {
    return <div className={`card-header ${className}`}>{children}</div>
  }

  return (
    <div className={`card-header ${className}`}>
      {icon && (
        <div className="card-header-icon">
          {typeof icon === 'string' ? <Icon name={icon} size={24} /> : icon}
        </div>
      )}
      <div className="card-header-text">
        {title && <div className="card-title">{title}</div>}
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {selectable && (
        <div className="card-select-icon">
          <Icon
            name={selected ? 'check-circle-filled' : 'check-circle-bold'}
            size={24}
          />
        </div>
      )}
      {actions && <div className="card-header-actions">{actions}</div>}
    </div>
  )
}

function CardContent({ children, className = '' }) {
  return (
    <div className={`card-body ${className}`}>
      {children}
    </div>
  )
}

function CardFooter({ children, className = '' }) {
  return (
    <div className={`card-footer ${className}`}>
      {children}
    </div>
  )
}

Card.Image = CardImage
Card.Body = CardBody
Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
