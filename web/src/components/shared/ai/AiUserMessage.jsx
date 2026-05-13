/**
 * Displays the end-user's chat response bubble.
 *
 * @param {Object} props
 * @param {string} props.text Message content shown in the bubble body.
 * @param {string} [props.className=''] Additional CSS class names merged onto the root wrapper.
 * @example
 * <AiUserMessage text="Summarize this policy." />
 */
function AiUserMessage({ text, className = '' }) {
  return (
    <div className={`ai-user-msg ${className}`}>
      <div className="ai-user-msg__text">{text}</div>
    </div>
  )
}

export default AiUserMessage
