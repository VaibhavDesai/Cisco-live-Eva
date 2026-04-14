import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../icons/Icon';
import { TooltipTonalBackdrop } from './TooltipTonalBackdrop';
import type { TooltipPlacement } from './Tooltip';

const GAP = 8;

function computePopoverPosition(
  anchor: DOMRect,
  surface: DOMRect,
  placement: TooltipPlacement,
): { top: number; left: number } {
  let top = 0;
  let left = 0;
  const side = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
  const align = placement.split('-')[1] as 'start' | 'end' | undefined;

  switch (side) {
    case 'top':
      top = anchor.top - surface.height - GAP;
      break;
    case 'bottom':
      top = anchor.bottom + GAP;
      break;
    case 'left':
      left = anchor.left - surface.width - GAP;
      break;
    case 'right':
      left = anchor.right + GAP;
      break;
  }

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') left = anchor.left;
    else if (align === 'end') left = anchor.right - surface.width;
    else left = anchor.left + anchor.width / 2 - surface.width / 2;
  }

  if (side === 'left' || side === 'right') {
    if (align === 'start') top = anchor.top;
    else if (align === 'end') top = anchor.bottom - surface.height;
    else top = anchor.top + anchor.height / 2 - surface.height / 2;
  }

  left = Math.max(8, Math.min(left, window.innerWidth - surface.width - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - surface.height - 8));

  return { top, left };
}

/** Popover surface color treatment (tonal vs contrast) */
export type PopoverVariant = 'tonal' | 'contrast';

export interface PopoverProps {
  /** Whether the popover is visible */
  open: boolean;
  /** Called when open state should change (backdrop, Escape, close control) */
  onOpenChange: (open: boolean) => void;
  /** DOM element used as the positioning anchor */
  anchorRef: RefObject<HTMLElement | null>;
  /** Placement of the surface relative to the anchor */
  placement?: TooltipPlacement;
  /** Visual variant for surface styling */
  variant?: PopoverVariant;
  /** Shows a close affordance in the surface chrome */
  showCloseButton?: boolean;
  /** Renders a full-screen backdrop that dismisses on click when true */
  closeOnBackdrop?: boolean;
  /** Popover body content */
  children: ReactNode;
  /** Extra class names merged onto the surface */
  className?: string;
  /** Accessible name for the dialog surface */
  'aria-label'?: string;
}

/**
 * Portals a positioned popover to `document.body`, anchored to a ref with scroll/resize repositioning.
 *
 * @example
 * <Popover open={open} onOpenChange={setOpen} anchorRef={btnRef} aria-label="Options">
 *   <p>Content</p>
 * </Popover>
 */
export function Popover({
  open,
  onOpenChange,
  anchorRef,
  placement = 'bottom',
  variant = 'tonal',
  showCloseButton = false,
  closeOnBackdrop = true,
  children,
  className = '',
  'aria-label': ariaLabel,
}: PopoverProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    const surf = surfaceRef.current;
    if (!el || !surf) return;
    const rect = el.getBoundingClientRect();
    const sRect = surf.getBoundingClientRect();
    setPos(computePopoverPosition(rect, sRect, placement));
  }, [anchorRef, placement]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, placement, updatePosition, children]);

  useEffect(() => {
    if (!open) return;
    const ro = () => updatePosition();
    window.addEventListener('scroll', ro, true);
    window.addEventListener('resize', ro);
    return () => {
      window.removeEventListener('scroll', ro, true);
      window.removeEventListener('resize', ro);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const surfaceCls = [
    'popover-surface',
    variant === 'tonal' ? 'popover-surface--tonal' : 'popover-surface--contrast',
    showCloseButton && 'popover-surface--show-close',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      {closeOnBackdrop && (
        <button
          type="button"
          className="popover-backdrop"
          aria-label="Dismiss"
          onClick={() => onOpenChange(false)}
        />
      )}
      <div
        ref={surfaceRef}
        role="dialog"
        aria-modal="false"
        aria-label={ariaLabel}
        className={surfaceCls}
        style={{ top: pos.top, left: pos.left }}
      >
        {variant === 'tonal' && <TooltipTonalBackdrop />}
        {showCloseButton && (
          <button
            type="button"
            className="popover-close"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <Icon name="cancel" weight="bold" size={16} />
          </button>
        )}
        <div className="popover-body">{children}</div>
      </div>
    </>
  );

  return createPortal(body, document.body);
}
