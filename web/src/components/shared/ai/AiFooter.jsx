import { useState, useRef, useCallback, useEffect } from 'react'
import Icon from '../Icon'
import AiSymbol from './AiSymbol'

/**
 * Chat composer strip with optional quick suggestions, send control, sources affordance, and privacy disclaimer.
 * @param {Object} props - Composer configuration and callbacks for the AI footer region.
 * @param {function(string): void} [props.onSend] - Called with trimmed message text when sending from textarea, Enter, or a suggestion chip.
 * @param {boolean} [props.disabled=false] - Disables the textarea and send affordance when true.
 * @param {boolean} [props.processing=false] - When true, replaces the input row with a processing state and hides suggestions.
 * @param {string[]} [props.suggestions=[]] - Quick-reply strings rendered as chips above the composer when not processing.
 * @param {string} [props.placeholder='Ask AI Assistant'] - Placeholder for the auto-growing message textarea.
 * @param {string} [props.className=''] - Extra classes merged onto the root `ai-footer` container.
 * @example
 * <AiFooter onSend={(msg) => console.log(msg)} suggestions={['Summarize', 'Next steps']} />
 */
function AiFooter({
  onSend,
  disabled = false,
  processing = false,
  suggestions = [],
  placeholder = 'Ask AI Assistant',
  className = '',
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const autoResize = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [])

  useEffect(autoResize, [text, autoResize])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled || processing) return
    onSend?.(trimmed)
    setText('')
  }, [text, disabled, processing, onSend])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div className={`ai-footer ${className}`}>
      {suggestions.length > 0 && !processing && (
        <div className="ai-footer__suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="ai-footer__suggestion"
              onClick={() => onSend?.(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="ai-footer__group">
        {processing ? (
          <div className="ai-footer__input-row" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <AiSymbol size={24} state="processing" />
            <span style={{ color: 'var(--text-secondary)', fontSize: 14, marginLeft: 8 }}>Processing...</span>
          </div>
        ) : (
          <div className="ai-footer__input-row">
            <div className="ai-footer__type-area">
              <textarea
                ref={textareaRef}
                className="ai-footer__textarea"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={disabled}
              />
            </div>
            <div className="ai-footer__action-bar">
              <button type="button" className="ai-footer__sources-btn">
                All sources
                <Icon name="arrow-down-bold" size={16} />
              </button>
              <button
                type="button"
                className="ai-footer__send-btn"
                aria-label="Send"
                disabled={!text.trim() || disabled}
                onClick={handleSend}
              >
                <Icon name="send-bold" size={16} />
              </button>
            </div>
          </div>
        )}
        <div className="ai-footer__disclaimer">
          Assistant can make mistakes. Verify responses. Learn how the AI Assistant handles personal data at{' '}
          <a href="#">AI Assistant Data Privacy</a>.
        </div>
      </div>
    </div>
  )
}

export default AiFooter
