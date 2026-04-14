import { useState, useCallback } from 'react'
import Icon from './Icon'
import AiSymbol from './AiSymbol'
import Accordion from './Accordion'

const POSITIVE_OPTIONS = ['Great response', 'Clear', 'Helpful', 'Accurate']
const NEGATIVE_OPTIONS = ['Incorrect', 'Unhelpful', 'Confusing', 'Incomplete']

function AiResponseMessage({
  content,
  children,
  sources = [],
  warning = false,
  timestamp,
  onCopy,
  onThumbsUp,
  onThumbsDown,
  onRegenerate,
  followups = [],
  onFollowup,
  className = '',
}) {
  const [feedback, setFeedback] = useState(null)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [selectedChips, setSelectedChips] = useState([])
  const [feedbackText, setFeedbackText] = useState('')

  const toggleChip = useCallback((chip) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    )
  }, [])

  const submitFeedback = useCallback(() => {
    if (feedback === 'up') onThumbsUp?.({ chips: selectedChips, text: feedbackText })
    else onThumbsDown?.({ chips: selectedChips, text: feedbackText })
    setFeedbackSent(true)
  }, [feedback, selectedChips, feedbackText, onThumbsUp, onThumbsDown])

  return (
    <div className={`ai-response ${className}`}>
      <div className="ai-response__accent" />

      <div className="ai-response__header">
        <div className="ai-response__identity">
          <AiSymbol size={24} />
          <span className="ai-response__label">AI Assistant</span>
          {warning && (
            <span className="ai-response__badge">
              <Icon name="warning-badge-filled" size={16} />
              Warning
            </span>
          )}
        </div>
        {timestamp && <span className="ai-response__timestamp">{timestamp}</span>}
      </div>

      <div className="ai-response__body">
        <div className="ai-response__content">
          {typeof content === 'string'
            ? content.split('\n').map((p, i) => <p key={i}>{p}</p>)
            : content}
        </div>

        {children}

        {sources.length > 0 && (
          <div className="ai-response__sources">
            <Accordion heading="Sources" size="small" variant="default">
              <div className="ai-response__sources-list">
                {sources.map((s, i) => (
                  <a key={i} href={s.url || '#'} className="ai-response__source-link" target="_blank" rel="noopener noreferrer">
                    <Icon name="link-bold" size={12} />
                    {s.title || s.url}
                  </a>
                ))}
              </div>
            </Accordion>
          </div>
        )}

        <div className="ai-response__actions">
          <button
            type="button"
            className={`ai-response__action-btn${feedback === 'up' ? ' ai-response__action-btn--active' : ''}`}
            aria-label="Thumbs up"
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          >
            <Icon name="like-bold" size={16} />
          </button>
          <button
            type="button"
            className={`ai-response__action-btn${feedback === 'down' ? ' ai-response__action-btn--active' : ''}`}
            aria-label="Thumbs down"
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          >
            <Icon name="dislike-bold" size={16} />
          </button>
          <button type="button" className="ai-response__action-btn" aria-label="Copy" onClick={onCopy}>
            <Icon name="copy-bold" size={16} />
          </button>
          <button type="button" className="ai-response__action-btn" aria-label="Regenerate" onClick={onRegenerate}>
            <Icon name="refresh-bold" size={16} />
          </button>
        </div>

        {feedback && !feedbackSent && (
          <div className="ai-response__feedback">
            <div className="ai-response__feedback-title">
              {feedback === 'up' ? 'What did you like?' : 'What went wrong?'}
            </div>
            <div className="ai-response__feedback-options">
              {(feedback === 'up' ? POSITIVE_OPTIONS : NEGATIVE_OPTIONS).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`ai-response__feedback-chip${selectedChips.includes(opt) ? ' ai-response__feedback-chip--selected' : ''}`}
                  onClick={() => toggleChip(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <textarea
              className="ai-response__feedback-textarea"
              placeholder="Tell us more (optional)"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary ai-response__feedback-submit"
              onClick={submitFeedback}
            >
              Submit
            </button>
          </div>
        )}

        {feedbackSent && (
          <div className="ai-response__feedback" style={{ alignItems: 'center', padding: '12px 16px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Thank you for your feedback!</span>
          </div>
        )}

        {followups.length > 0 && (
          <div className="ai-response__followups">
            {followups.map((f, i) => (
              <button
                key={i}
                type="button"
                className="ai-footer__suggestion"
                onClick={() => onFollowup?.(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AiResponseMessage
