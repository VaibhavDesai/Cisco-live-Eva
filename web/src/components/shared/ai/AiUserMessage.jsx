import Avatar from '../Avatar'

/**
 * Displays the end-user’s chat bubble header (“You” with avatar) and message body text.
 *
 * @param {Object} props
 * @param {string} props.text Message content shown in the bubble body.
 * @param {string} [props.avatarSrc] Optional image URL for the avatar; when omitted, initials are used.
 * @param {string} [props.className=''] Additional CSS class names merged onto the root wrapper.
 * @example
 * <AiUserMessage text="Summarize this policy." avatarSrc="/me.png" />
 */
function AiUserMessage({ text, avatarSrc, className = '' }) {
  return (
    <div className={`ai-user-msg ${className}`}>
      <div className="ai-user-msg__header">
        <Avatar
          variant={avatarSrc ? 'photo' : 'initials'}
          size="2x-small"
          src={avatarSrc}
          initials="M"
        />
        <span className="ai-user-msg__name">You</span>
      </div>
      <div className="ai-user-msg__text">{text}</div>
    </div>
  )
}

export default AiUserMessage
