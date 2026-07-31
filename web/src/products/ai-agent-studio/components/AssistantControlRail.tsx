import { useEffect, useRef } from 'react';
import AiSymbol from '../../../components/shared/ai/AiSymbol';
import Icon from '../../../components/shared/Icon';
import {
  MOBILE_SHELL_BREAKPOINT,
  useUpliftWorkspace,
} from '../UpliftWorkspaceContext';

export default function AssistantControlRail() {
  const {
    state,
    viewportWidth,
    setSnap,
    openThreadHistory,
    closeThreadHistory,
    createThread,
  } = useUpliftWorkspace();
  const threadButtonRef = useRef<HTMLButtonElement>(null);
  const historyOpen = state.productSurface.threadHistoryOpen;
  const assistantOpen = state.productSurface.snap !== 'expanded';

  useEffect(() => {
    if (!historyOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeThreadHistory();
        window.requestAnimationFrame(() => threadButtonRef.current?.focus());
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeThreadHistory, historyOpen]);

  const toggleHistory = () => {
    if (historyOpen) {
      closeThreadHistory();
      window.requestAnimationFrame(() => threadButtonRef.current?.focus());
    } else {
      openThreadHistory();
    }
  };

  const toggleAssistantWorkspace = () => {
    if (historyOpen) closeThreadHistory();
    const openSnap = viewportWidth < MOBILE_SHELL_BREAKPOINT ? 'compact' : 'split';
    setSnap(assistantOpen ? 'expanded' : openSnap);
  };

  return (
    <nav className="uplift-assistant-rail" aria-label="AI Assistant controls">
      <button
        type="button"
        className={`uplift-assistant-rail__button${assistantOpen ? ' uplift-assistant-rail__button--active' : ''}`}
        aria-label={assistantOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        aria-pressed={assistantOpen}
        title={assistantOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        onClick={toggleAssistantWorkspace}
      >
        <AiSymbol size={24} />
      </button>

      <div className="uplift-assistant-rail__divider" aria-hidden />

      <button
        ref={threadButtonRef}
        type="button"
        className={`uplift-assistant-rail__button${historyOpen ? ' is-active' : ''}`}
        aria-label={historyOpen ? 'Close chat history' : 'Open chat history'}
        aria-pressed={historyOpen}
        title="Chat history"
        onClick={toggleHistory}
      >
        <Icon name="recents-bold" size={20} />
      </button>
      <button
        type="button"
        className="uplift-assistant-rail__button"
        aria-label="Start a new chat"
        title="New chat"
        onClick={() => {
          createThread();
          if (!historyOpen) openThreadHistory();
        }}
      >
        <Icon name="start-chat-bold" size={20} />
      </button>
      <button
        type="button"
        className="uplift-assistant-rail__button"
        aria-label="Assistant tasks"
        title="Assistant tasks"
      >
        <Icon name="custom-task-bold" size={20} />
      </button>
    </nav>
  );
}
