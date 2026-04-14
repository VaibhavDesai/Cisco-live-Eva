import Icon from './Icon'
import AiSymbol from './AiSymbol'

/**
 * AI Prompt Button — small pill-shaped button used for AI suggestions/prompts.
 *
 * Variants:
 *  - Default (no icon): text-only pill
 *  - With Icon: pass `icon` string (e.g. "sparkle-bold") to show a leading Momentum icon
 *  - AI Brand: pass `icon="ai"` to show the AiSymbol as the leading icon
 */
function AiPromptButton({
  children,
  icon,
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  const renderIcon = () => {
    if (!icon) return null
    if (icon === 'ai') return <AiSymbol size={16} />
    return <Icon name={icon} size={16} />
  }

  return (
    <button
      type="button"
      className={`ai-prompt-btn ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {renderIcon()}
      {children}
    </button>
  )
}

/**
 * AI Prompt Card Button — wider card-style button for prompt suggestions.
 * Displays text in a rounded card with secondary background.
 */
function AiPromptCardButton({
  children,
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  return (
    <button
      type="button"
      className={`ai-prompt-card-btn ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      <span className="ai-prompt-card-btn__inner">{children}</span>
    </button>
  )
}

export { AiPromptButton, AiPromptCardButton }
export default { Prompt: AiPromptButton, Card: AiPromptCardButton }
