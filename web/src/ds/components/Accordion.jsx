import { useState, useCallback, createContext, useContext } from 'react'
import Icon from './Icon'

const GroupContext = createContext(null)

export function AccordionGroup({
  children,
  variant = 'default',
  multiple = false,
  defaultExpanded = [],
  className = '',
  ...rest
}) {
  const [expanded, setExpanded] = useState(
    () => new Set(defaultExpanded),
  )

  const toggle = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        if (!multiple) next.clear()
        next.add(key)
      }
      return next
    })
  }, [multiple])

  const isExpanded = useCallback((key) => expanded.has(key), [expanded])

  const classes = [
    'accordion-group',
    variant === 'stack' && 'accordion-group--stack',
    variant === 'borderless' && 'accordion-group--borderless',
    className,
  ].filter(Boolean).join(' ')

  return (
    <GroupContext.Provider value={{ toggle, isExpanded, variant }}>
      <div className={classes} {...rest}>
        {children}
      </div>
    </GroupContext.Provider>
  )
}

export default function Accordion({
  id,
  heading,
  size = 'small',
  variant = 'default',
  expanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  disabled = false,
  leadingIcon,
  children,
  className = '',
  ...rest
}) {
  const group = useContext(GroupContext)
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)

  const isGrouped = group !== null
  const isControlled = controlledExpanded !== undefined

  let isOpen
  if (isGrouped && id) {
    isOpen = group.isExpanded(id)
  } else if (isControlled) {
    isOpen = controlledExpanded
  } else {
    isOpen = internalExpanded
  }

  const handleToggle = useCallback(() => {
    if (disabled) return
    if (isGrouped && id) {
      group.toggle(id)
    } else if (isControlled) {
      onToggle?.(!controlledExpanded)
    } else {
      setInternalExpanded((prev) => {
        const next = !prev
        onToggle?.(next)
        return next
      })
    }
  }, [disabled, isGrouped, id, group, isControlled, onToggle, controlledExpanded])

  const effectiveVariant = isGrouped && group.variant === 'borderless' ? 'borderless' : variant

  const classes = [
    'accordion',
    `accordion--${size}`,
    effectiveVariant === 'borderless' && 'accordion--borderless',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} {...rest}>
      <button
        type="button"
        className="accordion__header"
        onClick={handleToggle}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <div className="accordion__leading">
          {leadingIcon && (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {typeof leadingIcon === 'string'
                ? <Icon name={leadingIcon} size={16} />
                : leadingIcon}
            </span>
          )}
          <span className="accordion__header-text">{heading}</span>
        </div>
        <span className={`accordion__chevron${isOpen ? ' accordion__chevron--open' : ''}`}>
          <Icon name="arrow-down-bold" size={16} />
        </span>
      </button>
      {isOpen && (
        <div className="accordion__panel" data-state="open">
          <div className="accordion__panel-content">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
