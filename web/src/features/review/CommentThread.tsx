import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../icons/Icon';
import Button from '../../components/shared/Button';
import { Textarea } from '../../components/shared/FormInput';
import { useReview } from './ReviewProvider';
import { relativeTime } from './formatTime';
import type { ThreadWithComments } from './types';

interface Props {
  thread: ThreadWithComments;
  x: number;
  y: number;
}

const POPOVER_WIDTH = 340;
const POPOVER_MARGIN = 12;

const clampToViewport = (x: number, y: number, height = 360) => {
  const maxX = window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN;
  const maxY = window.innerHeight - height - POPOVER_MARGIN;
  return {
    left: Math.min(Math.max(POPOVER_MARGIN, x), Math.max(POPOVER_MARGIN, maxX)),
    top: Math.min(Math.max(POPOVER_MARGIN, y), Math.max(POPOVER_MARGIN, maxY)),
  };
};

export const CommentThread = ({ thread, x, y }: Props) => {
  const {
    addReply,
    setThreadStatus,
    selectThread,
    displayName,
    editDisplayName,
  } = useReview();
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.comments.length]);

  const { left, top } = clampToViewport(x + 16, y + 16);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!reply.trim() || submitting) return;
    setSubmitting(true);
    const result = await addReply(thread.id, reply);
    setSubmitting(false);
    if (result) setReply('');
  };

  const isResolved = thread.status === 'resolved';

  return (
    <div
      className="review-popover review-thread"
      data-review-ui
      style={{ left, top, width: POPOVER_WIDTH }}
      role="dialog"
      aria-label="Comment thread"
    >
      <header className="review-popover__header">
        {isResolved && <span className="review-popover__author">Resolved</span>}
        {thread.element_label && (
          <span className="review-popover__target">{thread.element_label}</span>
        )}
        <button
          type="button"
          className="review-popover__close"
          data-review-ui
          onClick={() => selectThread(null)}
          aria-label="Close"
        >
          <Icon name="cancel" size={12} />
        </button>
      </header>

      <div ref={scrollRef} className="review-thread__list">
        {thread.comments.length === 0 && (
          <div className="review-thread__empty">No comments yet.</div>
        )}
        {thread.comments.map((c) => (
          <div key={c.id} className="review-thread__item">
            <div className="review-thread__meta">
              <span className="review-thread__author">{c.author_name}</span>
              <span className="review-thread__time">{relativeTime(c.created_at)}</span>
            </div>
            <div className="review-thread__body">{c.body}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="review-popover__form">
        <div className="review-popover__identity">
          <span className="review-popover__identity-label">
            Replying as{' '}
            <span className="review-popover__identity-name">
              {displayName || 'Guest'}
            </span>
          </span>
          <button
            type="button"
            className="review-popover__identity-edit"
            data-review-ui
            onClick={editDisplayName}
          >
            Edit
          </button>
        </div>

        <Textarea
          placeholder={isResolved ? 'Reopen to reply…' : 'Write a reply…'}
          value={reply}
          maxLength={4000}
          onChange={(e) => setReply(e.target.value)}
          disabled={isResolved}
          rows={3}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              void handleSubmit();
            }
          }}
          data-review-ui
        />

        <div className="review-popover__footer">
          <Button
            variant="secondary"
            type="button"
            onClick={() =>
              setThreadStatus(thread.id, isResolved ? 'open' : 'resolved')
            }
          >
            {isResolved ? 'Reopen' : 'Resolve'}
          </Button>
          <div className="review-popover__actions">
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !reply.trim() || isResolved}
            >
              {submitting ? 'Posting…' : 'Reply'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
