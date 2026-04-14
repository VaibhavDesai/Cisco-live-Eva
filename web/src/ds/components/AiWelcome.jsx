import AiSymbol from './AiSymbol'

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
