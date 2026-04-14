import { useRef, useEffect } from 'react'
import AiUserMessage from './AiUserMessage'
import AiResponseMessage from './AiResponseMessage'
import AiFooter from './AiFooter'
import AiThreadPanel from './AiThreadPanel'

function AiConversation({
  messages = [],
  onSend,
  processing = false,
  suggestions = [],
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onRenameThread,
  onDeleteThread,
  showThreads = false,
  onToggleThreads,
  welcomeScreen = null,
  className = '',
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, processing])

  return (
    <div className={`ai-conversation ${className}`}>
      {showThreads && threads && (
        <div className="ai-conversation__threads">
          <AiThreadPanel
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={onSelectThread}
            onNewThread={onNewThread}
            onRenameThread={onRenameThread}
            onDeleteThread={onDeleteThread}
            onCollapse={onToggleThreads}
          />
        </div>
      )}
      <div className="ai-conversation__main">
        {welcomeScreen ? (
          welcomeScreen
        ) : (
          <div className="ai-conversation__messages">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <AiUserMessage key={i} text={msg.text} />
              ) : (
                <AiResponseMessage
                  key={i}
                  content={msg.text}
                  sources={msg.sources}
                  warning={msg.warning}
                  timestamp={msg.timestamp || '11:05 AM'}
                  followups={msg.followups}
                  onFollowup={onSend}
                />
              )
            )}
            <div ref={bottomRef} />
          </div>
        )}
        <AiFooter
          onSend={onSend}
          processing={processing}
          suggestions={messages.length === 0 ? suggestions : []}
        />
      </div>
    </div>
  )
}

export default AiConversation
