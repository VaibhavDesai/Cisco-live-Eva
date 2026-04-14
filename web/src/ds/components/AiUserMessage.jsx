import Avatar from './Avatar'

function AiUserMessage({ text, avatarSrc, className = '' }) {
  return (
    <div className={`ai-user-msg ${className}`}>
      <div className="ai-user-msg__header">
        <Avatar
          type={avatarSrc ? 'photo' : 'initials'}
          size="xx-small"
          src={avatarSrc}
          name="You"
        />
        <span className="ai-user-msg__name">You</span>
      </div>
      <div className="ai-user-msg__text">{text}</div>
    </div>
  )
}

export default AiUserMessage
