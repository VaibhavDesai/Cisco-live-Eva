import { useState, useCallback } from 'react'
import AiShell from './AiShell'
import AiNavRail from './AiNavRail'
import AiWelcome from './AiWelcome'
import AiConversation from './AiConversation'
import AiNotifications from './AiNotifications'
import RenameThreadDialog from '../RenameThreadDialog'
import DeleteThreadDialog from '../DeleteThreadDialog'

/**
 * Demo-style AI assistant experience: shell, nav rail, conversation with mock threads/messages, and rename/delete dialogs.
 * Manages local state for view mode, active rail view, threads, and simulated send/reply for prototyping the full UI.
 *
 * @param {Object} props
 * @param {boolean} props.open Whether the assistant shell is shown; forwarded to `AiShell`.
 * @param {Function} props.onClose Handler when the user closes the assistant; forwarded to `AiShell`.
 * @example
 * <AiAssistant open={isOpen} onClose={() => setOpen(false)} />
 */
const SUGGESTIONS = [
  'Summarize my recent activity',
  'Draft a follow-up email',
  'Help me prepare for my next meeting',
  'What tasks are due this week?',
]

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New summary available', description: 'Your weekly activity summary is ready to review.', icon: 'info-circle-bold', time: '2m ago' },
  { id: '2', title: 'Task completed', description: 'The document analysis you requested has finished processing.', icon: 'check-bold', time: '1h ago' },
  { id: '3', title: 'Meeting prep ready', description: 'Your briefing for the 3pm standup is prepared.', icon: 'calendar-month-bold', time: '3h ago' },
]

const AI_REPLY = {
  role: 'ai',
  text: 'AI response goes here. The response can contain text and additional Momentum components.',
  timestamp: '11:05 AM',
  warning: true,
  sources: [
    { title: 'Project Documentation', url: '#' },
    { title: 'Team Activity Log', url: '#' },
  ],
  followups: [
    'Tell me more details',
    'Export as a document',
  ],
}

let threadIdCounter = 10

function AiAssistant({ open, onClose }) {
  const [viewMode, setViewMode] = useState('floating-lg')
  const [activeView, setActiveView] = useState('conversation')
  const [showThreads, setShowThreads] = useState(true)

  const [threads, setThreads] = useState([
    { id: '1', title: 'Thread name lorem ipsum', group: 'Today' },
    { id: '2', title: 'Thread name lorem ipsum', group: 'Today' },
    { id: '3', title: 'Thread name lorem ipsum', group: 'Today' },
    { id: '4', title: 'Thread name lorem ipsum', group: 'Today' },
    { id: '5', title: 'Thread name lorem ipsum', group: 'Yesterday' },
    { id: '6', title: 'Thread name lorem ipsum', group: 'Yesterday' },
    { id: '7', title: 'Thread name lorem ipsum', group: 'Previous 7 days' },
    { id: '8', title: 'Thread name lorem ipsum', group: 'Previous 7 days' },
    { id: '9', title: 'Thread name lorem ipsum', group: 'Last month' },
  ])
  const [activeThreadId, setActiveThreadId] = useState('1')

  const [conversations, setConversations] = useState({
    '1': [
      { role: 'user', text: 'This is a sample of a submitted user message.' },
      { ...AI_REPLY },
      { role: 'user', text: 'This is a sample of a submitted user message.' },
      { ...AI_REPLY },
      { role: 'user', text: 'This is a sample of a submitted user message.' },
    ],
  })
  const [processing, setProcessing] = useState(false)

  const [renameDialog, setRenameDialog] = useState({ open: false, threadId: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, threadId: null })

  const currentMessages = conversations[activeThreadId] || []

  const handleSend = useCallback((text) => {
    setConversations((prev) => {
      const msgs = [...(prev[activeThreadId] || []), { role: 'user', text }]
      return { ...prev, [activeThreadId]: msgs }
    })
    setProcessing(true)
    setTimeout(() => {
      setConversations((prev) => ({
        ...prev,
        [activeThreadId]: [...(prev[activeThreadId] || []), AI_REPLY],
      }))
      setProcessing(false)
    }, 1500)
  }, [activeThreadId])

  const handleNewThread = useCallback(() => {
    const id = String(threadIdCounter++)
    setThreads((prev) => [{ id, title: 'New Thread', group: 'Today' }, ...prev])
    setActiveThreadId(id)
  }, [])

  const handleRename = useCallback((name) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === renameDialog.threadId ? { ...t, title: name } : t))
    )
    setRenameDialog({ open: false, threadId: null })
  }, [renameDialog.threadId])

  const handleDelete = useCallback(() => {
    const id = deleteDialog.threadId
    setThreads((prev) => prev.filter((t) => t.id !== id))
    if (activeThreadId === id) {
      setActiveThreadId(threads[0]?.id !== id ? threads[0]?.id : threads[1]?.id || '')
    }
    setConversations((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setDeleteDialog({ open: false, threadId: null })
  }, [deleteDialog.threadId, activeThreadId, threads])

  const handleViewChange = useCallback((view) => {
    setActiveView(view)
  }, [])

  const isLarge = viewMode === 'floating-lg' || viewMode === 'fullscreen'

  const renderContent = () => {
    switch (activeView) {
      case 'notifications':
        return <AiNotifications notifications={MOCK_NOTIFICATIONS} />
      case 'conversation':
      default:
        return (
          <AiConversation
            messages={currentMessages}
            onSend={handleSend}
            processing={processing}
            suggestions={SUGGESTIONS}
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={(id) => setActiveThreadId(id)}
            onNewThread={handleNewThread}
            onRenameThread={(id) => setRenameDialog({ open: true, threadId: id })}
            onDeleteThread={(id) => setDeleteDialog({ open: true, threadId: id })}
            showThreads={isLarge && showThreads}
            onToggleThreads={() => setShowThreads((p) => !p)}
            welcomeScreen={currentMessages.length === 0 ? (
              <AiWelcome
                firstTime={Object.keys(conversations).length === 0}
                suggestions={SUGGESTIONS}
                onSelectSuggestion={handleSend}
              />
            ) : null}
          />
        )
    }
  }

  return (
    <>
      <AiShell
        open={open}
        viewMode={viewMode}
        onClose={onClose}
        onViewModeChange={setViewMode}
      >
        <div className="ai-shell__nav">
          <AiNavRail
            activeView={activeView}
            onViewChange={handleViewChange}
            notificationCount={MOCK_NOTIFICATIONS.length}
          />
        </div>
        <div className="ai-shell__content">
          {renderContent()}
        </div>
      </AiShell>

      <RenameThreadDialog
        open={renameDialog.open}
        currentName={threads.find((t) => t.id === renameDialog.threadId)?.title || ''}
        onSave={handleRename}
        onCancel={() => setRenameDialog({ open: false, threadId: null })}
      />
      <DeleteThreadDialog
        open={deleteDialog.open}
        threadName={threads.find((t) => t.id === deleteDialog.threadId)?.title || ''}
        onDelete={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, threadId: null })}
      />
    </>
  )
}

export default AiAssistant
