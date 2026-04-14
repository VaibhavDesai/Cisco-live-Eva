import AiSymbol from './AiSymbol'

/**
 * Empty-state hero for the AI assistant: symbol, contextual headline, body copy, and optional suggestion chips.
 * @param {Object} props - Welcome panel content and suggestion interaction hooks.
 * @param {boolean} [props.firstTime=true] - Toggles onboarding vs returning-user headline and description copy.
 * @param {string[]} [props.suggestions=[]] - Suggestion labels rendered as tappable chips when non-empty.
 * @param {function(string): void} [props.onSelectSuggestion] - Invoked with a suggestion string when a chip is clicked.
 * @param {string} [props.className=''] - Extra classes merged onto the root `ai-welcome` container.
 * @example
 * <AiWelcome firstTime suggestions={['What can you do?']} onSelectSuggestion={(s) => {}} />
 */
function AiWelcome({
  firstTime = true,
  suggestions = [],
  onSelectSuggestion,
  className = '',
}) {
  return (
    <div className={`ai-welcome ${className}`}>
      <AiSymbol size={64} state="static" />
      <h2 className="ai-welcome__heading">
        {firstTime ? 'Meet your AI Assistant' : 'How can I help today?'}
      </h2>
      <p className="ai-welcome__desc">
        {firstTime
          ? 'I\'m here to help you with questions, tasks, and more. Try asking me something or pick a suggestion below to get started.'
          : 'Pick up where you left off, or start something new. Here are some ideas to get you going.'}
      </p>
      {suggestions.length > 0 && (
        <div className="ai-welcome__suggestions">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="ai-footer__suggestion"
              onClick={() => onSelectSuggestion?.(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AiWelcome
