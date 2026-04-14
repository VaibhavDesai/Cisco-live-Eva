import { useState, useRef, useCallback, useEffect } from 'react'
import Icon from '../Icon'

/**
 * Composes an auto-growing message field with optional sources control and a send button for the AI chat composer.
 * Enter submits when the field has text (Shift+Enter keeps a newline); height is capped by `maxRows`.
 *
 * @param {Object} props
 * @param {string} props.value Current textarea value (controlled).
 * @param {Function} [props.onChange] Called with the next string when the textarea value changes.
 * @param {Function} [props.onSend] Called with the current value when the user sends via button or Enter.
 * @param {string} [props.placeholder='Ask AI Assistant'] Input placeholder text.
 * @param {boolean} [props.showSources=true] Whether to render the sources dropdown trigger in the action bar.
 * @param {string} [props.sourcesLabel='All sources'] Label shown on the sources button when visible.
 * @param {Function} [props.onSourcesClick] Called when the sources button is activated.
 * @param {boolean} [props.disabled=false] Disables input, sources, and send when true.
 * @param {number} [props.maxRows=12] Maximum visible rows used to cap auto-resize height.
 * @param {string} [props.className=''] Additional class names merged onto the root wrapper.
 * @example
 * <AiChatTextArea value={text} onChange={setText} onSend={(v) => console.log(v)} />
 */
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
