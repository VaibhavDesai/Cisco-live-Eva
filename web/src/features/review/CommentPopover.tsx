import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../icons/Icon';
import Button from '../../components/shared/Button';
import { Textarea } from '../../components/shared/FormInput';
import { useReview } from './ReviewProvider';

interface Props {
  x: number;
  y: number;
  label: string | null;
}

const POPOVER_WIDTH = 320;
const POPOVER_MARGIN = 12;

const clampToViewport = (x: number, y: number, height = 240) => {
  const maxX = window.innerWidth - POPOVER_WIDTH - POPOVER_MARGIN;
  const maxY = window.innerHeight - height - POPOVER_MARGIN;
  return {
    left: Math.min(Math.max(POPOVER_MARGIN, x), Math.max(POPOVER_MARGIN, maxX)),
    top: Math.min(Math.max(POPOVER_MARGIN, y), Math.max(POPOVER_MARGIN, maxY)),
  };
};

export const CommentPopover = ({ x, y, label }: Props) => {
  const {
    pendingAnchor,
    createThread,
    cancelPicking,
    displayName,
    editDisplayName,
  } = useReview();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  if (!pendingAnchor) return null;

  const { left, top } = clampToViewport(x + 16, y + 16);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    const thread = await createThread(pendingAnchor, body);
    setSubmitting(false);
    if (thread) {
      setBody('');
      cancelPicking();
    }
  };

  return (
    <div
      className="review-popover"
      data-review-ui
      style={{ left, top, width: POPOVER_WIDTH }}
      role="dialog"
      aria-label="New comment"
    >
      <header className="review-popover__header">
        {label && <span className="review-popover__target">{label}</span>}
        <button
          type="button"
          className="review-popover__close"
          data-review-ui
          onClick={cancelPicking}
          aria-label="Cancel"
        >
          <Icon name="cancel" size={12} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="review-popover__form">
        <div className="review-popover__identity">
          <span className="review-popover__identity-label">
            Commenting as{' '}
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
          ref={textareaRef}
          placeholder="Share feedback on this element…"
          value={body}
          maxLength={4000}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              void handleSubmit();
            } else if (e.key === 'Escape') {
              cancelPicking();
            }
          }}
          rows={4}
          data-review-ui
        />

        <div className="review-popover__footer">
          <span className="review-popover__hint">⌘/Ctrl + Enter to submit</span>
          <div className="review-popover__actions">
            <Button variant="secondary" type="button" onClick={cancelPicking}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting || !body.trim()}
            >
              {submitting ? 'Posting…' : 'Comment'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
