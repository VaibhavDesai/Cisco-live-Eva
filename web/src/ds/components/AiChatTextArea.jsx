import { useState, useRef, useCallback, useEffect } from 'react'
import Icon from './Icon'

function AiChatTextArea({
  value,
  onChange,
  onSend,
  placeholder = 'Ask AI Assistant',
  showSources = true,
  sourcesLabel = 'All sources',
  onSourcesClick,
  disabled = false,
  maxRows = 12,
  className = '',
}) {
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef(null)

  const filled = Boolean(value && value.trim().length > 0)

  const autoResize = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    const lineHeight = 20
    const maxHeight = lineHeight * maxRows
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px'
  }, [maxRows])

  useEffect(autoResize, [value, autoResize])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (filled && !disabled) onSend?.(value)
      }
    },
    [filled, disabled, onSend, value]
  )

  const handleSend = useCallback(() => {
    if (filled && !disabled) onSend?.(value)
  }, [filled, disabled, onSend, value])

  const stateClasses = [
    'ai-chat-textarea',
    focused && 'ai-chat-textarea--focused',
    filled && !focused && 'ai-chat-textarea--filled',
    disabled && 'ai-chat-textarea--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={stateClasses}>
      <div className="ai-chat-textarea__type-area">
        <textarea
          ref={textareaRef}
          className="ai-chat-textarea__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
      </div>

      <div className="ai-chat-textarea__action-bar">
        <div>
          {showSources && (
            <button
              type="button"
              className="ai-chat-textarea__sources-btn"
              onClick={onSourcesClick}
              disabled={disabled}
            >
              {sourcesLabel}
              <Icon name="arrow-down-bold" size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          className={`ai-chat-textarea__send-btn${filled ? ' ai-chat-textarea__send-btn--active' : ''}`}
          aria-label="Send"
          disabled={disabled || !filled}
          onClick={handleSend}
        >
          <Icon name="send-bold" size={16} />
        </button>
      </div>
    </div>
  )
}

export default AiChatTextArea
