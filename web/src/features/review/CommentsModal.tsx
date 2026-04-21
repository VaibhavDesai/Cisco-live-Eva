import { useMemo } from 'react';
import { Modal, ModalHeader, ModalBody } from '../../components/shared/Modal';
import { Icon } from '../../icons/Icon';
import { useReview } from './ReviewProvider';
import { relativeTime } from './formatTime';
import type { ThreadWithComments } from './types';

// Latest activity = newest comment; fall back to thread creation.
const lastActivity = (t: ThreadWithComments): number => {
  const latestComment = t.comments.reduce<number>((acc, c) => {
    const ts = new Date(c.created_at).getTime();
    return ts > acc ? ts : acc;
  }, 0);
  const created = new Date(t.created_at).getTime();
  return Math.max(latestComment, created);
};

const truncate = (value: string, max = 140): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

export const CommentsModal = () => {
  const {
    commentsModalOpen,
    commentsModalLoading,
    allThreads,
    closeCommentsModal,
    openThread,
  } = useReview();

  const ordered = useMemo(
    () => [...allThreads].sort((a, b) => lastActivity(b) - lastActivity(a)),
    [allThreads],
  );

  if (!commentsModalOpen) return null;

  return (
    <Modal
      onClose={closeCommentsModal}
      size="lg"
      overlayClassName="review-modal-overlay"
    >
      <div data-review-ui>
        <ModalHeader
          title="All comments"
          description={
            ordered.length
              ? `${ordered.length} thread${ordered.length === 1 ? '' : 's'} · sorted by latest activity`
              : undefined
          }
          onClose={closeCommentsModal}
        />
        <ModalBody>
          {commentsModalLoading && ordered.length === 0 ? (
            <div className="review-comments-modal__empty">Loading comments…</div>
          ) : ordered.length === 0 ? (
            <div className="review-comments-modal__empty">
              No comments yet. Turn on comment mode and click any element on the
              page to leave the first one.
            </div>
          ) : (
            <ul className="review-comments-modal__list">
              {ordered.map((t) => {
                const first = t.comments[0];
                const last = t.comments[t.comments.length - 1] || first;
                const preview = last ? last.body : t.element_label || '(no message)';
                const resolved = t.status === 'resolved';
                const activityMs = lastActivity(t);
                const activity = new Date(activityMs).toISOString();
                return (
                  <li key={t.id} className="review-comments-modal__item">
                    <button
                      type="button"
                      className="review-comments-modal__row"
                      onClick={() => openThread({ id: t.id, route: t.route })}
                      data-review-ui
                    >
                      <div className="review-comments-modal__row-top">
                        <span
                          className={`review-status-chip review-status-chip--${
                            resolved ? 'resolved' : 'open'
                          }`}
                        >
                          <Icon
                            name={resolved ? 'check-circle' : 'chat'}
                            size={12}
                          />
                          {resolved ? 'Resolved' : 'Open'}
                        </span>
                        <span className="review-comments-modal__route">
                          {t.route}
                        </span>
                        <span className="review-comments-modal__time">
                          {relativeTime(activity)}
                        </span>
                      </div>
                      <div className="review-comments-modal__preview">
                        {truncate(preview)}
                      </div>
                      <div className="review-comments-modal__meta">
                        <span className="review-comments-modal__author">
                          {first?.author_name || 'Unknown'}
                        </span>
                        {t.element_label && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="review-comments-modal__target">
                              {truncate(t.element_label, 60)}
                            </span>
                          </>
                        )}
                        <span aria-hidden>·</span>
                        <span className="review-comments-modal__count">
                          {t.comments.length}{' '}
                          {t.comments.length === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ModalBody>
      </div>
    </Modal>
  );
};
