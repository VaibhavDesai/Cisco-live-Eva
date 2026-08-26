/**
 * Displays the end-user's chat response bubble.
 *
 * @param {Object} props
 * @param {string} props.text Message content shown in the bubble body.
 * @param {string} [props.className=''] Additional CSS class names merged onto the root wrapper.
 * @param {React.ReactNode} [props.trailingAction] Optional trailing action rendered inside the bubble.
 * @example
 * <AiUserMessage text="Summarize this policy." />
 */
function AiUserMessage({ text, className = '', trailingAction }) {
  const mergedClassName = `ai-user-msg${trailingAction ? ' ai-user-msg--with-action' : ''}${className ? ` ${className}` : ''}`

  return (
    <div className={mergedClassName}>
      <div className="ai-user-msg__text">{text}</div>
      {trailingAction && (
        <div className="ai-user-msg__trailing-action">{trailingAction}</div>
      )}
    </div>
  )
}

export default AiUserMessage
