import { useState, useRef, useCallback, useEffect, cloneElement } from 'react'
import { createPortal } from 'react-dom'

const ARROW_OFFSET = 8
const VIEWPORT_PAD = 8

function getPosition(triggerRect, bubbleRect, placement) {
  let top = 0
  let left = 0

  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      top = triggerRect.top - bubbleRect.height - ARROW_OFFSET
      break
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      top = triggerRect.bottom + ARROW_OFFSET
      break
    case 'left':
    case 'left-start':
    case 'left-end':
      left = triggerRect.left - bubbleRect.width - ARROW_OFFSET
      break
    case 'right':
    case 'right-start':
    case 'right-end':
      left = triggerRect.right + ARROW_OFFSET
      break
    default:
      top = triggerRect.bottom + ARROW_OFFSET
  }

  if (placement.startsWith('top') || placement.startsWith('bottom')) {
    if (placement.endsWith('-start')) {
      left = triggerRect.left
    } else if (placement.endsWith('-end')) {
      left = triggerRect.right - bubbleRect.width
    } else {
      left = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2
    }
  }

  if (placement.startsWith('left') || placement.startsWith('right')) {
    if (placement.endsWith('-start')) {
      top = triggerRect.top
    } else if (placement.endsWith('-end')) {
      top = triggerRect.bottom - bubbleRect.height
    } else {
      top = triggerRect.top + triggerRect.height / 2 - bubbleRect.height / 2
    }
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - bubbleRect.width - VIEWPORT_PAD))
  top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - bubbleRect.height - VIEWPORT_PAD))

  return { top, left }
}

export default function Tooltip({
  children,
  content,
  placement = 'bottom',
  delay = 200,
  interactive = false,
  maxWidth,
  className = '',
  ...rest
}) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const bubbleRef = useRef(null)
  const timerRef = useRef(null)

  const show = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }, [delay])

  const hide = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), interactive ? 150 : 0)
  }, [interactive])

  useEffect(() => {
    if (!visible || !triggerRef.current || !bubbleRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const bubbleRect = bubbleRef.current.getBoundingClientRect()
    setPos(getPosition(triggerRect, bubbleRect, placement))
  }, [visible, placement])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  if (!content) return children

  const trigger = cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e) => {
      show()
      children.props.onMouseEnter?.(e)
    },
    onMouseLeave: (e) => {
      hide()
      children.props.onMouseLeave?.(e)
    },
    onFocus: (e) => {
      show()
      children.props.onFocus?.(e)
    },
    onBlur: (e) => {
      hide()
      children.props.onBlur?.(e)
    },
    'aria-describedby': visible ? 'tooltip-content' : undefined,
  })

  const bubbleClass = [
    'tooltip-bubble',
    interactive && 'tooltip-interactive',
    className,
  ].filter(Boolean).join(' ')

  return (
    <>
      {trigger}
      {visible &&
        createPortal(
          <div
            ref={bubbleRef}
            id="tooltip-content"
            role="tooltip"
            className={bubbleClass}
            data-placement={placement}
            style={{ top: pos.top, left: pos.left, ...(maxWidth ? { maxWidth } : {}) }}
            onMouseEnter={interactive ? show : undefined}
            onMouseLeave={interactive ? hide : undefined}
            {...rest}
          >
            <div className="tooltip-body">
              <div className="tooltip-text">{content}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export function StaticTooltip({
  content,
  placement = 'bottom',
  maxWidth,
  className = '',
  ...rest
}) {
  const bubbleClass = ['tooltip-bubble tooltip-bubble--static', className].filter(Boolean).join(' ')

  return (
    <div
      role="tooltip"
      className={bubbleClass}
      data-placement={placement}
      style={maxWidth ? { maxWidth } : undefined}
      {...rest}
    >
      <div className="tooltip-body">
        <div className="tooltip-text">{content}</div>
      </div>
    </div>
  )
}
