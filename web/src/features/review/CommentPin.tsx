import type { ThreadWithComments } from './types';

interface Props {
  index: number;
  thread: ThreadWithComments;
  x: number;
  y: number;
  active: boolean;
  orphan: boolean;
  onClick: () => void;
}

export const CommentPin = ({ index, thread, x, y, active, orphan, onClick }: Props) => {
  const count = thread.comments.length || 1;
  return (
    <button
      type="button"
      data-review-ui
      className={`review-pin ${
        thread.status === 'resolved' ? 'review-pin--resolved' : ''
      } ${active ? 'review-pin--active' : ''} ${orphan ? 'review-pin--orphan' : ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={
        (thread.element_label ? `${thread.element_label} — ` : '') +
        `${count} comment${count === 1 ? '' : 's'}`
      }
      aria-label={`Open comment ${index}`}
    >
      <span className="review-pin__number">{index}</span>
    </button>
  );
};
