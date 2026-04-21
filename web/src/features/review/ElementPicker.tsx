import { useEffect, useState } from 'react';
import { getAnchor, isReviewUiNode } from './anchor';
import { useReview } from './ReviewProvider';

interface HighlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ElementPicker = () => {
  const { pickerMode, setPendingAnchor, cancelPicking } = useReview();
  const [rect, setRect] = useState<HighlightRect | null>(null);

  useEffect(() => {
    if (pickerMode !== 'picking') {
      setRect(null);
      return;
    }

    const prevCursor = document.body.style.cursor;
    document.body.style.cursor = 'crosshair';

    const handleMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isReviewUiNode(el)) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ x: r.left, y: r.top, width: r.width, height: r.height });
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (isReviewUiNode(target)) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isReviewUiNode(el)) return;
      e.preventDefault();
      e.stopPropagation();
      const anchor = getAnchor(el, { clientX: e.clientX, clientY: e.clientY });
      setPendingAnchor({ ...anchor, clientX: e.clientX, clientY: e.clientY });
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelPicking();
    };

    document.addEventListener('mousemove', handleMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKey, true);

    return () => {
      document.body.style.cursor = prevCursor;
      document.removeEventListener('mousemove', handleMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKey, true);
    };
  }, [pickerMode, setPendingAnchor, cancelPicking]);

  if (pickerMode !== 'picking' || !rect) return null;

  return (
    <div
      className="review-picker-highlight"
      data-review-ui
      style={{
        transform: `translate(${rect.x}px, ${rect.y}px)`,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
};
