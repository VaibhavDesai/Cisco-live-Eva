import { useRef, useEffect } from 'react'
import AiUserMessage from './AiUserMessage'
import AiResponseMessage from './AiResponseMessage'
import AiFooter from './AiFooter'
import AiThreadPanel from './AiThreadPanel'

/**
 * Full conversation layout: optional thread rail, scrollable message list or custom welcome slot, and footer composer.
 * Scrolls to the latest message when the message list length or processing state changes.
 *
 * @param {Object} props
 * @param {Array<Object>} [props.messages=[]] Chat messages with `role`, `text`, and optional AI fields (`sources`, `warning`, `timestamp`, `followups`).
 * @param {Function} [props.onSend] Passed to the footer and AI follow-ups to submit new user text.
 * @param {boolean} [props.processing=false] Whether a response is in progress (shown in the footer area).
 * @param {Array<string>} [props.suggestions=[]] Starter prompts shown in the footer when there are no messages.
 * @param {Array<Object>} [props.threads] Thread list for the side panel when threads are shown.
 * @param {string} [props.activeThreadId] Id of the thread highlighted in the panel.
 * @param {Function} [props.onSelectThread] Called with a thread id when the user selects a thread.
 * @param {Function} [props.onNewThread] Called when the user creates a new thread from the panel.
 * @param {Function} [props.onRenameThread] Called with a thread id when rename is requested.
 * @param {Function} [props.onDeleteThread] Called with a thread id when delete is requested.
 * @param {boolean} [props.showThreads=false] Whether to render the thread panel column.
 * @param {Function} [props.onToggleThreads] Passed to the thread panel as `onCollapse` to hide the rail.
 * @param {import('react').ReactNode} [props.welcomeScreen=null] Custom content replacing the message list (e.g. empty state).
 * @param {string} [props.className=''] Additional class names merged onto the root conversation wrapper.
 * @example
 * <AiConversation messages={msgs} onSend={send} processing={busy} showThreads threads={t} activeThreadId={id} />
 */
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
