import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveAnchor, type ResolvedPosition } from './anchor';
import { ElementPicker } from './ElementPicker';
import { CommentPin } from './CommentPin';
import { CommentPopover } from './CommentPopover';
import { CommentThread } from './CommentThread';
import { NameModal } from './NameModal';
import { CommentsModal } from './CommentsModal';
import { useReview } from './ReviewProvider';

interface Positions {
  [threadId: string]: ResolvedPosition;
}

export const ReviewOverlay = () => {
  const {
    enabled,
    active,
    threads,
    selectedThreadId,
    selectThread,
    pendingAnchor,
    route,
    commentsModalOpen,
  } = useReview();

  // Pins/popovers use a very high z-index so they float above app chrome, but
  // the Momentum Modal overlay sits at z-index 1100. When the "All comments"
  // modal is open we hide the on-page markers so they don't bleed through.
  const showMarkers = active && !commentsModalOpen;

  const [positions, setPositions] = useState<Positions>({});
  const [tick, setTick] = useState(0);

  const routeThreads = useMemo(
    () => threads.filter((t) => t.route === route),
    [threads, route],
  );

  useLayoutEffect(() => {
    if (!active) {
      setPositions({});
      return;
    }
    const next: Positions = {};
    for (const t of routeThreads) {
      const pos = resolveAnchor({
        selector: t.selector,
        x_ratio: t.x_ratio,
        y_ratio: t.y_ratio,
      });
      if (pos) next[t.id] = pos;
    }
    setPositions(next);
  }, [active, routeThreads, tick, route]);

  useEffect(() => {
    if (!active) return;
    const bump = () => setTick((n) => n + 1);
    window.addEventListener('scroll', bump, true);
    window.addEventListener('resize', bump);
    const interval = window.setInterval(bump, 500);
    return () => {
      window.removeEventListener('scroll', bump, true);
      window.removeEventListener('resize', bump);
      window.clearInterval(interval);
    };
  }, [active]);

  if (!enabled) return null;
  if (typeof document === 'undefined') return null;

  const selected = selectedThreadId
    ? routeThreads.find((t) => t.id === selectedThreadId) || null
    : null;
  const selectedPos = selected ? positions[selected.id] : null;

  return createPortal(
    <div
      className={`review-layer ${active ? 'review-layer--active' : ''}`}
      data-review-ui
    >
      {showMarkers && <ElementPicker />}

      {/* Resolved threads are reachable via the "All comments" modal, but
          their pins disappear from the page so open items stand out. */}
      {showMarkers &&
        routeThreads
          .filter((t) => t.status === 'open')
          .map((t, i) => {
            const pos = positions[t.id];
            if (!pos) return null;
            return (
              <CommentPin
                key={t.id}
                index={i + 1}
                thread={t}
                x={pos.x}
                y={pos.y}
                active={selectedThreadId === t.id}
                orphan={pos.orphan}
                onClick={() => selectThread(t.id)}
              />
            );
          })}

      {showMarkers && pendingAnchor && (
        <CommentPopover
          x={pendingAnchor.clientX}
          y={pendingAnchor.clientY}
          label={pendingAnchor.label}
        />
      )}

      {showMarkers && selected && selectedPos && (
        <CommentThread thread={selected} x={selectedPos.x} y={selectedPos.y} />
      )}

      <NameModal />
      <CommentsModal />
    </div>,
    document.body,
  );
};
