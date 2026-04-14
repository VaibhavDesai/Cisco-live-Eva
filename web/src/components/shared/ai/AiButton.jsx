import Icon from '../Icon'
import AiSymbol from './AiSymbol'

/**
 * AI prompt button primitives for suggestion surfaces: a compact pill (`AiPromptButton`) and a wider card (`AiPromptCardButton`).
 * @param {Object} props - See `AiPromptButton` and `AiPromptCardButton` below; each export documents its own accepted fields.
 * @example
 * import { AiPromptButton, AiPromptCardButton } from './AiButton'
 * <AiPromptButton icon="sparkle-bold">Summarize thread</AiPromptButton>
 * <AiPromptCardButton>Draft a reply</AiPromptCardButton>
 */

/**
 * Small pill-shaped button for AI suggestions; text-only, optional leading Momentum icon, or AI brand glyph when `icon="ai"`.
 * @param {Object} props - Component props; known fields are listed below and any additional keys are spread onto the native `button`.
 * @param {import('react').ReactNode} props.children - Visible label/content inside the button.
 * @param {string} [props.icon] - Momentum `Icon` name (e.g. `"sparkle-bold"`), or `"ai"` to render `AiSymbol` at 16px.
 * @param {boolean} [props.disabled=false] - Disables the native button and click handling.
 * @param {function} [props.onClick] - Click handler invoked when the button is enabled.
 * @param {string} [props.className=''] - Extra classes appended to `ai-prompt-btn`.
 * @example
 * <AiPromptButton icon="ai" onClick={() => {}}>Ask AI</AiPromptButton>
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
 * Wider card-style button for prompt suggestions; wraps children in an inner span on a secondary card background.
 * @param {Object} props - Component props; known fields are listed below and any additional keys are spread onto the native `button`.
 * @param {import('react').ReactNode} props.children - Text or nodes shown inside the card inner span.
 * @param {boolean} [props.disabled=false] - Disables the native button and click handling.
 * @param {function} [props.onClick] - Click handler invoked when the button is enabled.
 * @param {string} [props.className=''] - Extra classes appended to `ai-prompt-card-btn`.
 * @example
 * <AiPromptCardButton onClick={() => {}}>Suggest next steps</AiPromptCardButton>
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
