import { useState, useCallback } from 'react'
import Icon from '../Icon'
import AiSymbol from './AiSymbol'
import { AccordionItem as Accordion } from '../Accordion'

const POSITIVE_OPTIONS = ['Great response', 'Clear', 'Helpful', 'Accurate']
const NEGATIVE_OPTIONS = ['Incorrect', 'Unhelpful', 'Confusing', 'Incomplete']

function getEvaAssistantLabel(name, state) {
  if (state === 'static') return name
  return String(name || 'AI Assistant')
    .replace(/^AI Assistant\s+is\s+/i, '')
    .replace(/^AI Assistant\s+/i, '')
}

/**
 * Renders an AI assistant reply with optional warning badge, sources accordion, action bar
 * (feedback, copy, regenerate), structured thumbs feedback, and follow-up suggestion chips.
 *
 * @param {Object} props
 * @param {string|import('react').ReactNode} props.content Main response body; strings split on newlines into paragraphs.
 * @param {import('react').ReactNode} [props.children] Optional content rendered after the main body (e.g. rich blocks).
 * @param {Array<{ title?: string, url?: string }>} [props.sources=[]] Citations listed under a collapsible “Sources” region.
 * @param {boolean} [props.warning=false] When true, shows a warning badge beside the assistant label.
 * @param {string} [props.timestamp] Optional timestamp label in the header.
 * @param {function(): void} [props.onCopy] Handler for the copy action button.
 * @param {function({ chips: string[], text: string }): void} [props.onThumbsUp] Called when positive feedback is submitted with selected chips and optional text.
 * @param {function({ chips: string[], text: string }): void} [props.onThumbsDown] Called when negative feedback is submitted with selected chips and optional text.
 * @param {function(): void} [props.onRegenerate] Handler for the regenerate action button.
 * @param {string[]} [props.followups=[]] Suggestion labels rendered as follow-up buttons.
 * @param {function(string): void} [props.onFollowup] Invoked with a suggestion string when a follow-up chip is chosen.
 * @param {string} [props.assistantName='AI Assistant'] Label shown beside the AI symbol.
 * @param {'static'|'processing'|'responding'} [props.assistantState='static'] Motion state for the AI symbol.
 * @param {string} [props.className=''] Additional CSS class names merged onto the root container.
 * @param {boolean} [props.showActions=true] When false, hides the feedback/copy/regenerate action bar (and its dependent feedback panel).
 * @example
 * <AiResponseMessage content="Here is the summary." sources={[{ title: 'Doc', url: 'https://example.com' }]} onCopy={() => {}} />
 */
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
  assistantName = 'AI Assistant',
  assistantState = 'static',
  className = '',
  showActions = true,
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

  const isEvaResponse = className.split(/\s+/).includes('eva-ai-response')
  const displayedAssistantName = isEvaResponse
    ? getEvaAssistantLabel(assistantName, assistantState)
    : assistantName

  return (
    <div className={`ai-response ai-response--${assistantState} ${className}`}>
      <div className="ai-response__accent" />

      <div className="ai-response__header">
        <div className="ai-response__identity">
          <AiSymbol state={assistantState} size={24} />
          <span className="ai-response__label">{displayedAssistantName}</span>
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
            <Accordion title="Sources" size="small" styleVariant="default">
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

        {showActions && (
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
        )}

        {showActions && feedback && !feedbackSent && (
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

        {showActions && feedbackSent && (
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
